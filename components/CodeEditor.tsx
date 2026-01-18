
import React, { useState, useEffect, useRef } from 'react';
import * as prettier from "https://esm.sh/prettier@3.5.1/standalone";
import * as babel from "https://esm.sh/prettier@3.5.1/plugins/babel";
import * as estree from "https://esm.sh/prettier@3.5.1/plugins/estree";

// Prism is loaded via global script tag in index.html to avoid ESM plugin resolution issues
declare const Prism: any;

interface CodeEditorProps {
  code: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const [formattedCode, setFormattedCode] = useState(code);
  const [isFormatting, setIsFormatting] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const formatCode = async () => {
      setIsFormatting(true);
      try {
        const result = await prettier.format(code, {
          parser: "babel-ts",
          plugins: [babel, estree],
          semi: true,
          singleQuote: true,
          trailingComma: "es5",
          printWidth: 80,
          tabWidth: 2,
        });
        setFormattedCode(result);
      } catch (err) {
        console.warn("Prettier formatting failed, falling back to raw code:", err);
        setFormattedCode(code);
      } finally {
        setIsFormatting(false);
      }
    };

    formatCode();
  }, [code]);

  useEffect(() => {
    if (codeRef.current && typeof Prism !== 'undefined') {
      Prism.highlightElement(codeRef.current);
    }
  }, [formattedCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = formattedCode.split('\n');

  return (
    <div className="flex-1 h-full bg-[#1e1e1e] flex flex-col overflow-hidden transition-colors duration-300">
      <div className="px-4 py-2 bg-[#2d2d2d] flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 items-center mr-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs font-medium text-zinc-400">GeneratedComponent.tsx</span>
          {isFormatting && (
            <span className="text-[10px] text-zinc-500 animate-pulse uppercase tracking-wider">Formatting...</span>
          )}
        </div>
        <button 
          onClick={handleCopy}
          className="text-xs flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Copied!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Copy Code
            </>
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-auto flex text-[13px] leading-relaxed relative prism-code-container">
        {/* Line Number Gutter */}
        <div 
          className="select-none py-6 pr-4 text-right bg-[#1e1e1e] border-r border-white/5 min-w-[3.5rem] text-zinc-600 font-mono sticky left-0 z-10"
          aria-hidden="true"
        >
          {lines.map((_, i) => (
            <div key={i} className="h-[1.6em]">{i + 1}</div>
          ))}
        </div>
        
        {/* Code Area */}
        <div className="flex-1 min-w-0 py-6 px-6 font-mono">
          <pre className="!bg-transparent !p-0 !m-0 overflow-visible">
            <code 
              ref={codeRef} 
              className="language-tsx !bg-transparent"
            >
              {formattedCode}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
