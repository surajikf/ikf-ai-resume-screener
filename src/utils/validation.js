/**
 * Comprehensive input validation utilities
 */

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number (10 digits)
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
};

/**
 * Validate URL format
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate file type
 */
export const isValidFileType = (file, allowedTypes = ['.pdf', '.docx', '.doc', '.txt']) => {
  if (!file || !file.name) return false;
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return allowedTypes.includes(extension);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file, maxSizeMB = 10) => {
  if (!file || !file.size) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate required field
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate string length
 */
export const isValidLength = (value, min = 0, max = Infinity) => {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= min && length <= max;
};

/**
 * Validate job description
 */
export const validateJobDescription = (jd) => {
  if (!isRequired(jd)) {
    return { valid: false, error: 'Job description is required' };
  }
  
  if (!isValidLength(jd, 10, 50000)) {
    return { valid: false, error: 'Job description must be between 10 and 50,000 characters' };
  }
  
  return { valid: true };
};

/**
 * Validate candidate name
 */
export const validateCandidateName = (name) => {
  if (!isRequired(name)) {
    return { valid: false, error: 'Candidate name is required' };
  }
  
  if (!isValidLength(name, 2, 255)) {
    return { valid: false, error: 'Candidate name must be between 2 and 255 characters' };
  }
  
  return { valid: true };
};

/**
 * Validate resume file
 */
export const validateResumeFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Resume file is required' };
  }
  
  if (!isValidFileType(file)) {
    return { valid: false, error: 'Invalid file type. Please upload PDF, DOCX, or TXT files.' };
  }
  
  if (!isValidFileSize(file, 10)) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }
  
  return { valid: true };
};
