/**
 * Enhanced fetch with retry logic and better error handling
 */

const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000, // 30 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Fetch with automatic retry on failure
 */
export const fetchWithRetry = async (url, options = {}, retryOptions = {}) => {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
  const { maxRetries, retryDelay, timeout, retryableStatuses } = config;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If successful, return response
      if (response.ok) {
        return response;
      }

      // Check if status is retryable
      if (retryableStatuses.includes(response.status) && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`[fetchWithRetry] Retryable error ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable error or max retries reached
      return response;
    } catch (error) {
      lastError = error;

      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      // Network errors are retryable
      if (attempt < maxRetries && (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('Failed to fetch')
      )) {
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`[fetchWithRetry] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Non-retryable error
      throw error;
    }
  }

  throw lastError || new Error('Request failed after all retries');
};

/**
 * Fetch JSON with retry and error handling
 */
export const fetchJSON = async (url, options = {}, retryOptions = {}) => {
  try {
    const response = await fetchWithRetry(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, retryOptions);

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return { success: true, data, response };
  } catch (error) {
    // Handle network errors
    if (error.message.includes('timeout') || error.message.includes('fetch')) {
      throw new Error('Network error: Please check your internet connection and try again.');
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      throw new Error('Invalid response from server. Please try again.');
    }

    throw error;
  }
};
