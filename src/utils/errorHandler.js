/**
 * Centralized error handling utilities
 * Provides consistent error handling across the application
 */

/**
 * Format error message for user display
 */
export const formatErrorMessage = (error, defaultMessage = 'An unexpected error occurred') => {
  if (!error) return defaultMessage;
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle error objects with message property
  if (error.message) {
    return error.message;
  }
  
  // Handle API error responses
  if (error.error) {
    return error.error;
  }
  
  return defaultMessage;
};

/**
 * Log error with context
 */
export const logError = (error, context = '') => {
  const message = formatErrorMessage(error);
  console.error(`[${context || 'Error'}]`, message, error);
  return message;
};

/**
 * Validate evaluation data structure
 */
export const validateEvaluation = (evaluation) => {
  if (!evaluation) {
    throw new Error('Evaluation data is required');
  }
  
  if (!evaluation.candidateName || typeof evaluation.candidateName !== 'string') {
    throw new Error('Valid candidate name is required');
  }
  
  if (!evaluation.roleApplied || typeof evaluation.roleApplied !== 'string') {
    throw new Error('Valid role applied is required');
  }
  
  if (!evaluation.verdict || !['Recommended', 'Partially Suitable', 'Not Suitable'].includes(evaluation.verdict)) {
    throw new Error('Valid verdict is required');
  }
  
  if (typeof evaluation.matchScore !== 'number' || evaluation.matchScore < 0 || evaluation.matchScore > 100) {
    throw new Error('Match score must be a number between 0 and 100');
  }
  
  return true;
};

/**
 * Validate job description
 */
export const validateJobDescription = (jobDescription) => {
  if (!jobDescription || typeof jobDescription !== 'string') {
    throw new Error('Job description is required');
  }
  
  const trimmed = jobDescription.trim();
  if (trimmed.length < 10) {
    throw new Error('Job description must be at least 10 characters long');
  }
  
  if (trimmed.length > 50000) {
    throw new Error('Job description is too long (maximum 50,000 characters)');
  }
  
  return true;
};

/**
 * Validate file
 */
export const validateFile = (file, maxSizeMB = 10) => {
  if (!file) {
    throw new Error('File is required');
  }
  
  const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedTypes.includes(fileExtension)) {
    throw new Error(`File type not supported. Please upload PDF, DOCX, or TXT files.`);
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }
  
  return true;
};

/**
 * Safe async operation wrapper
 */
export const safeAsync = async (asyncFn, errorHandler = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    const message = formatErrorMessage(error);
    if (errorHandler) {
      errorHandler(message, error);
    } else {
      logError(error, 'SafeAsync');
    }
    throw error;
  }
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Retry with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

