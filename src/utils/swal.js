/**
 * SweetAlert2 utility wrapper
 * Provides consistent alert/confirm dialogs throughout the application
 */
import Swal from 'sweetalert2';

/**
 * Show a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} text - Dialog message (auto-renders HTML if markup is detected)
 * @param {string} confirmButtonText - Confirm button text (default: "OK")
 * @param {string} cancelButtonText - Cancel button text (default: "Cancel")
 * @param {string} icon - Icon type: 'warning', 'question', 'info', 'success', 'error' (default: 'question')
 * @returns {Promise<boolean>} - true if confirmed, false if cancelled
 */
export const confirm = async (title, text, confirmButtonText = 'OK', cancelButtonText = 'Cancel', icon = 'question') => {
  // If the message contains HTML tags, pass it as `html` so SweetAlert2 renders markup instead of escaping it.
  const hasHtml = typeof text === 'string' && /<[a-z][\s\S]*>/i.test(text);
  const result = await Swal.fire({
    title,
    ...(hasHtml ? { html: text } : { text }),
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: '#2563eb', // blue-600
    cancelButtonColor: '#64748b', // slate-500
    reverseButtons: true,
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'px-4 py-2 rounded-md font-medium',
      cancelButton: 'px-4 py-2 rounded-md font-medium',
    },
  });
  
  return result.isConfirmed;
};

/**
 * Show an alert dialog
 * @param {string} title - Dialog title
 * @param {string} text - Dialog message
 * @param {string} icon - Icon type: 'success', 'error', 'warning', 'info' (default: 'info')
 * @param {string} confirmButtonText - Button text (default: "OK")
 */
export const alert = async (title, text, icon = 'info', confirmButtonText = 'OK') => {
  await Swal.fire({
    title,
    text,
    icon,
    confirmButtonText,
    confirmButtonColor: '#2563eb', // blue-600
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'px-4 py-2 rounded-md font-medium',
    },
  });
};

/**
 * Show a prompt dialog
 * @param {string} title - Dialog title
 * @param {string} text - Dialog message
 * @param {string} inputValue - Default input value
 * @param {string} inputPlaceholder - Input placeholder
 * @returns {Promise<string|null>} - Entered value or null if cancelled
 */
export const prompt = async (title, text, inputValue = '', inputPlaceholder = '') => {
  const result = await Swal.fire({
    title,
    text,
    input: 'text',
    inputValue,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return 'Please enter a value';
      }
      return null;
    },
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'px-4 py-2 rounded-md font-medium',
      cancelButton: 'px-4 py-2 rounded-md font-medium',
    },
  });
  
  return result.isConfirmed ? result.value : null;
};

/**
 * Show a success message
 */
export const success = async (title, text = '') => {
  await Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'OK',
    confirmButtonColor: '#10b981', // green-500
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'px-4 py-2 rounded-md font-medium',
    },
  });
};

/**
 * Show an error message
 */
export const error = async (title, text = '') => {
  await Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
    confirmButtonColor: '#ef4444', // red-500
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'px-4 py-2 rounded-md font-medium',
    },
  });
};

/**
 * Show a warning message
 */
export const warning = async (title, text = '') => {
  await Swal.fire({
    title,
    text,
    icon: 'warning',
    confirmButtonText: 'OK',
    confirmButtonColor: '#f59e0b', // amber-500
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'px-4 py-2 rounded-md font-medium',
    },
  });
};

/**
 * Show an info message
 */
export const info = async (title, text = '') => {
  await Swal.fire({
    title,
    text,
    icon: 'info',
    confirmButtonText: 'OK',
    confirmButtonColor: '#2563eb', // blue-600
    customClass: {
      popup: 'rounded-lg',
      confirmButton: 'px-4 py-2 rounded-md font-medium',
    },
  });
};

