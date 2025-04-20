
// No need for process.env polyfills in Vite projects as we use import.meta.env
// This file is kept for any other polyfills that might be needed

// Define global for compatibility with any remaining code
if (typeof window !== 'undefined') {
  window.global = window;
}

export default {};
