
import React, { useState, useRef } from 'react';
import { Message, AppStatus, StylePreset, GeneratedComponent, Project } from '../types';

interface ChatSidebarProps {
  messages: Message[];
  status: AppStatus;
  onSendMessage: (text: string, image?: string) => void;
  history: GeneratedComponent[];
  currentVersionIndex: number;
  onVersionSelect: (index: number) => void;
  suggestions: string[];
  projects: Project[];
  currentProjectId: string;
  onProjectSelect: (id: string) => void;
  onNewProject: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  messages, 
  status, 
  onSendMessage, 
  history, 
  currentVersionIndex, 
  onVersionSelect,
  suggestions,
  projects,
  currentProjectId,
  onProjectSelect,
  onNewProject
}) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<StylePreset>('Modern');
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'projects'>('chat');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedImage) && status !== AppStatus.GENERATING) {
      const finalPrompt = activeStyle !== 'Modern' 
        ? `[Style: ${activeStyle}] ${input}`
        : input;
      onSendMessage(finalPrompt, selectedImage || undefined);
      setInput('');
      setSelectedImage(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const magicActions = [
    { label: 'Website', prompt: 'Create a stunning, fully responsive multi-section corporate website for a high-tech startup. Include a glassmorphic navbar, hero section with animated gradients, features grid with hover effects, and a modern footer.', icon: '🌐' },
    { label: 'Game', prompt: 'Create a fully functional "Retro Snake Game" or "Space Invaders" style arcade game using React hooks for state management. Ensure it has a score system and a "Start Game" overlay.', icon: '🎮' },
    { label: 'Landing Page', prompt: 'Create a high-conversion SaaS landing page. Include a value proposition hero, social proof logos, a 3-tier pricing table, and a newsletter signup form. Use a professional blue and slate color palette.', icon: '📄' }
  ];

  const styles: StylePreset[] = ['Modern', 'Minimalist', 'Glassmorphism', 'Brutalist', 'Cyberpunk'];

  return (
    <div className="w-full md:w-80 lg:w-96 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full transition-all duration-300">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center transition-colors">
              <span className="text-white dark:text-zinc-950 font-bold text-xs">B</span>
            </div>
            <h1 className="font-semibold text-lg tracking-tight dark:text-zinc-100">Build me me</h1>
          </div>
          <button 
            onClick={onNewProject}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-500 transition-colors"
            title="New Project"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>

        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
          {(['chat', 'history', 'projects'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-all uppercase tracking-wider ${
                activeTab === tab 
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'chat' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 pt-10">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-3xl">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-700"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                </div>
                <div className="space-y-2 px-6">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">What's the vision?</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Describe a UI component or try a magic shortcut below.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full px-4">
                  {magicActions.map(action => (
                    <button
                      key={action.label}
                      onClick={() => onSendMessage(action.prompt)}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-900 dark:hover:border-zinc-100 transition-all text-left group"
                    >
                      <span className="text-xl">{action.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold dark:text-white">Quick {action.label}</span>
                        <span className="text-[10px] text-zinc-500 line-clamp-1">{action.prompt.slice(0, 40)}...</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-br-none shadow-sm' 
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-bl-none'
                  }`}>
                    {msg.image && (
                      <img src={msg.image} alt="Upload" className="w-full h-32 object-cover rounded-lg mb-2 border border-white/10" />
                    )}
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">
                    {msg.role === 'user' ? 'You' : 'Gemini'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
            {history.length === 0 ? (
              <div className="py-20 text-center text-zinc-400 text-xs">No version history yet.</div>
            ) : (
              history.map((comp, idx) => (
                <button
                  key={comp.id}
                  onClick={() => onVersionSelect(idx)}
                  className={`w-full p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    currentVersionIndex === idx 
                      ? 'bg-zinc-900 dark:bg-zinc-100 border-transparent shadow-md' 
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${currentVersionIndex === idx ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'}`}>
                      v{idx + 1}
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      {new Date(comp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs font-medium line-clamp-2 leading-relaxed ${currentVersionIndex === idx ? 'text-white dark:text-zinc-900' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {comp.prompt.length > 80 ? comp.prompt.slice(0, 80) + '...' : comp.prompt}
                  </p>
                </button>
              )).reverse()
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-3 animate-in slide-in-from-left-4 duration-300">
            {projects.length === 0 ? (
              <div className="py-20 text-center text-zinc-400 text-xs">No saved projects yet.</div>
            ) : (
              projects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => onProjectSelect(proj.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    currentProjectId === proj.id 
                      ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 shadow-inner' 
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-lg">
                      📁
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold dark:text-white truncate">{proj.name}</p>
                      <p className="text-[9px] text-zinc-500 uppercase font-medium">Modified {new Date(proj.lastModified).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 shrink-0">
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {styles.map(s => (
              <button 
                key={s}
                onClick={() => setActiveStyle(s)}
                className={`text-[11px] whitespace-nowrap px-3 py-1 rounded-full border transition-all ${
                  activeStyle === s 
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-transparent' 
                    : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {suggestions.length > 0 && activeTab === 'chat' && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(s)}
                className="text-[10px] px-2.5 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What should we build?"
            className="w-full pr-12 pl-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 resize-none h-24 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="absolute right-3 bottom-3 flex flex-col gap-2">
             <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <button
                type="submit"
                disabled={status === AppStatus.GENERATING || (!input.trim() && !selectedImage)}
                className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg>
              </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </form>
      </div>
    </div>
  );
};

export default ChatSidebar;
