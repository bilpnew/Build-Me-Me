
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const mount = () => {
  const container = document.getElementById('root');
  if (!container) return;

  try {
    const root = createRoot(container);
    root.render(<App />);
  } catch (err) {
    console.error("React Mount Error:", err);
    container.innerHTML = `<div style="padding: 40px; color: red;">Mount Failed: ${err}</div>`;
  }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mount();
} else {
  document.addEventListener('DOMContentLoaded', mount);
}
