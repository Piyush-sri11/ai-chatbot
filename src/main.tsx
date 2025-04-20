
// Polyfill for the global object needed by MongoDB Stitch SDK
if (typeof window !== 'undefined') {
  window.global = window;
  // Use proper type assertion to avoid TypeScript errors with process.env
  window.process = window.process || {} as NodeJS.Process;
  window.process.env = window.process.env || {} as NodeJS.ProcessEnv;
}

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
