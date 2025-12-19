/**
 * Toast notification utility
 * Provides user-friendly feedback for actions
 */

let toastContainer = null;

const createToastContainer = () => {
  if (typeof document === 'undefined') return null;
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md';
    document.body.appendChild(toastContainer);
  }
  
  return toastContainer;
};

const removeToast = (toastElement) => {
  if (toastElement && toastElement.parentNode) {
    toastElement.style.opacity = '0';
    toastElement.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
    }, 300);
  }
};

const showToast = (message, type = 'info', duration = 5000) => {
  if (typeof document === 'undefined') return;

  const container = createToastContainer();
  if (!container) return;

  const toast = document.createElement('div');
  const bgColor = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }[type] || bgColor.info;

  toast.className = `${bgColor} border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md transition-all duration-300 transform translate-x-full opacity-0`;
  toast.innerHTML = `
    <div class="flex-1 text-sm font-medium">${escapeHtml(message)}</div>
    <button onclick="this.parentElement.remove()" class="text-current opacity-70 hover:opacity-100">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);

  // Auto remove
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return toast;
};

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration || 7000),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration),
};
