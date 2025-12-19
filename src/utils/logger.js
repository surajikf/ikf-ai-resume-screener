/**
 * Centralized logging utility
 * Replaces console.log/error/warn with structured logging
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLogLevel = process.env.NODE_ENV === 'development' 
  ? LOG_LEVELS.DEBUG 
  : LOG_LEVELS.INFO;

/**
 * Format log message with context
 */
const formatLog = (level, message, context = '', data = null) => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  const prefix = `[${timestamp}] ${level} ${contextStr}`;
  
  if (data) {
    return { prefix, message, data };
  }
  return { prefix, message };
};

/**
 * Debug log (only in development)
 */
export const debug = (message, context = '', data = null) => {
  if (currentLogLevel <= LOG_LEVELS.DEBUG) {
    const formatted = formatLog('DEBUG', message, context, data);
    console.debug(formatted.prefix, formatted.message, data || '');
  }
};

/**
 * Info log
 */
export const info = (message, context = '', data = null) => {
  if (currentLogLevel <= LOG_LEVELS.INFO) {
    const formatted = formatLog('INFO', message, context, data);
    console.info(formatted.prefix, formatted.message, data || '');
  }
};

/**
 * Warning log
 */
export const warn = (message, context = '', data = null) => {
  if (currentLogLevel <= LOG_LEVELS.WARN) {
    const formatted = formatLog('WARN', message, context, data);
    console.warn(formatted.prefix, formatted.message, data || '');
  }
};

/**
 * Error log
 */
export const error = (message, context = '', error = null) => {
  if (currentLogLevel <= LOG_LEVELS.ERROR) {
    const formatted = formatLog('ERROR', message, context, error);
    console.error(formatted.prefix, formatted.message, error || '');
    
    // In production, you could send to error tracking service here
    // Example: Sentry.captureException(error);
  }
};

/**
 * Log API request
 */
export const logRequest = (method, url, data = null) => {
  debug(`${method} ${url}`, 'API', data);
};

/**
 * Log API response
 */
export const logResponse = (method, url, status, data = null) => {
  if (status >= 400) {
    error(`${method} ${url} - ${status}`, 'API', data);
  } else {
    debug(`${method} ${url} - ${status}`, 'API', data);
  }
};

/**
 * Log performance metric
 */
export const logPerformance = (operation, duration, context = '') => {
  if (duration > 1000) {
    warn(`${operation} took ${duration}ms`, context || 'Performance');
  } else {
    debug(`${operation} took ${duration}ms`, context || 'Performance');
  }
};

// Export default logger object
const logger = {
  debug,
  info,
  warn,
  error,
  logRequest,
  logResponse,
  logPerformance,
};

export default logger;
