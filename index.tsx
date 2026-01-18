
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * Robust mounting logic to prevent black screens.
 * Ensures the root element exists and handles potential render errors gracefully.
 */
const mount = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Critical Error: Root element '#root' not found in DOM.");
    return;
  }

  try {
    // Clear any loading state placed by the global error handler
    if (rootElement.innerHTML.includes('Load Error')) {
      rootElement.innerHTML = '';
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
    console.log("Build me me: React application mounted successfully.");
  } catch (err) {
    console.error("Critical Error during React mount:", err);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: system-ui; color: #ef4444; max-width: 600px; margin: auto;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Mount Failed</h1>
        <p style="color: #52525b; margin-bottom: 24px;">The application failed to start. This is usually due to a JavaScript error during the initial load.</p>
        <pre style="background: #f4f4f5; padding: 16px; border-radius: 8px; overflow: auto; font-size: 14px;">${err instanceof Error ? err.stack : String(err)}</pre>
      </div>
    `;
  }
};

// Initiate mounting
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mount();
} else {
  document.addEventListener('DOMContentLoaded', mount);
}
