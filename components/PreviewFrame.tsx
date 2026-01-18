
import React, { useEffect, useRef } from 'react';

interface PreviewFrameProps {
  code: string;
  deviceMode: 'DESKTOP' | 'TABLET' | 'MOBILE';
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({ code, deviceMode }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getWidth = () => {
    switch (deviceMode) {
      case 'MOBILE': return '375px';
      case 'TABLET': return '768px';
      default: return '100%';
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'EXPORT_IMAGE') {
        iframeRef.current?.contentWindow?.postMessage({ 
          type: 'CAPTURE_SCREENSHOT', 
          format: event.data.format 
        }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!iframeRef.current) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <script crossorigin src="https://unpkg.com/react@19/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://unpkg.com/lucide@latest"></script>
          <script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; min-height: 100vh; background-color: transparent; }
            #error-display { padding: 20px; color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; margin: 20px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div id="preview-root"></div>
          <div id="error-boundary"></div>
          
          <script type="text/babel">
            const { useState, useEffect, useMemo, useCallback, useRef } = React;
            
            const ErrorDisplay = ({ error }) => (
              <div id="error-display">
                <h2 style="margin-top: 0; font-size: 1.2rem;">Runtime Error</h2>
                <pre style="white-space: pre-wrap; font-size: 0.85rem;">{error.message}</pre>
              </div>
            );

            try {
              ${code}

              const rootElement = document.getElementById('preview-root');
              const root = ReactDOM.createRoot(rootElement);

              if (typeof Component !== 'undefined') {
                root.render(<Component />);
              } else {
                // Fallback: search for the last defined function if 'Component' is missing
                const keys = Object.keys(window);
                let found = false;
                for (let i = keys.length - 1; i >= 0; i--) {
                  const val = window[keys[i]];
                  if (typeof val === 'function' && val.name && val.name !== 'Component') {
                    root.render(React.createElement(val));
                    found = true;
                    break;
                  }
                }
                if (!found) throw new Error("No React component found in generated code.");
              }

              if (window.lucide) {
                window.lucide.createIcons();
              }

              window.addEventListener('message', async (e) => {
                if (e.data.type === 'CAPTURE_SCREENSHOT') {
                  const node = document.getElementById('preview-root');
                  if (!node) return;
                  try {
                    const dataUrl = e.data.format === 'png' 
                      ? await htmlToImage.toPng(node) 
                      : await htmlToImage.toJpeg(node, { quality: 0.95 });
                    const link = document.createElement('a');
                    link.download = \`build-me-me-export.\${e.data.format}\`;
                    link.href = dataUrl;
                    link.click();
                  } catch (err) {
                    console.error("Screenshot failed", err);
                  }
                }
              });

            } catch (err) {
              console.error("Preview Render Error:", err);
              const errorRoot = ReactDOM.createRoot(document.getElementById('error-boundary'));
              errorRoot.render(<ErrorDisplay error={err} />);
            }
          </script>
        </body>
      </html>
    `;

    iframeRef.current.srcdoc = htmlContent;
  }, [code]);

  return (
    <div className="flex-1 w-full h-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-4 md:p-8 overflow-auto transition-colors duration-300">
      <div 
        style={{ width: getWidth(), transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} 
        className="bg-white dark:bg-zinc-950 shadow-2xl rounded-xl overflow-hidden h-full max-h-[95vh] border border-zinc-200 dark:border-zinc-800 flex flex-col"
      >
        <div className="h-6 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3 gap-1.5 shrink-0">
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>
        <iframe
          ref={iframeRef}
          title="Preview"
          className="w-full flex-1 border-none bg-white"
          sandbox="allow-scripts allow-modals"
        />
      </div>
    </div>
  );
};

export default PreviewFrame;
