/**
 * Input sanitization utilities
 * Prevents XSS attacks and validates user input
 */

/**
 * Sanitize HTML to prevent XSS
 */
export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Sanitize text input (remove HTML tags)
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  
  // Remove HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const div = document.createElement('div');
  div.innerHTML = withoutTags;
  return div.textContent || div.innerText || '';
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  return trimmed;
};

/**
 * Validate and sanitize phone number (10 digits)
 */
export const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Extract last 10 digits (in case country code is included)
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  
  return digits.length === 10 ? digits : '';
};

/**
 * Validate and sanitize URL
 */
export const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  
  // Add https:// if no protocol
  let urlWithProtocol = trimmed;
  if (!trimmed.match(/^https?:\/\//i)) {
    urlWithProtocol = `https://${trimmed}`;
  }
  
  try {
    const urlObj = new URL(urlWithProtocol);
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return '';
    }
    return urlObj.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Validate file name (prevent path traversal)
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') return 'file';
  
  // Remove path separators and dangerous characters
  const sanitized = fileName
    .replace(/[\/\\]/g, '_')
    .replace(/[<>:"|?*]/g, '_')
    .replace(/\.\./g, '_')
    .trim();
  
  return sanitized || 'file';
};
