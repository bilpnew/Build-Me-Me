
import React, { useState, useEffect, useCallback } from 'react';
import ChatSidebar from './components/ChatSidebar.tsx';
import PreviewFrame from './components/PreviewFrame.tsx';
import CodeEditor from './components/CodeEditor.tsx';
import { Message, AppStatus, ViewMode, DeviceMode, GeneratedComponent, GithubConfig, Project } from './types.ts';
import { generateComponent, getSmartSuggestions } from './services/gemini.ts';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('v0_projects_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return localStorage.getItem('v0_active_project_id') || Math.random().toString(36).substr(2, 9);
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<GeneratedComponent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [generationStep, setGenerationStep] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PREVIEW);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(DeviceMode.DESKTOP);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  
  // GitHub States
  const [availableRepos, setAvailableRepos] = useState<any[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [githubConfig, setGithubConfig] = useState<GithubConfig>(() => {
    const saved = localStorage.getItem('gh_config_v2');
    return saved ? JSON.parse(saved) : { 
      token: '', 
      repo: '', 
      owner: '', 
      branch: 'main', 
      path: 'components/GeneratedUI.tsx',
      commitMessage: 'feat: add AI generated component'
    };
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Load project data when currentProjectId changes
  useEffect(() => {
    const activeProject = projects.find(p => p.id === currentProjectId);
    if (activeProject) {
      setMessages(activeProject.messages);
      setHistory(activeProject.history);
      setCurrentIndex(activeProject.currentIndex);
    } else {
      setMessages([]);
      setHistory([]);
      setCurrentIndex(-1);
    }
    localStorage.setItem('v0_active_project_id', currentProjectId);
  }, [currentProjectId]);

  // Sync state to current project object and persist to localStorage
  useEffect(() => {
    if (!currentProjectId) return;
    
    setProjects(prev => {
      const existingIdx = prev.findIndex(p => p.id === currentProjectId);
      const updatedProject: Project = {
        id: currentProjectId,
        name: history.length > 0 
          ? (history[history.length - 1].prompt.slice(0, 30) + (history[history.length - 1].prompt.length > 30 ? '...' : '')) 
          : 'Untitled Project',
        lastModified: Date.now(),
        history,
        messages,
        currentIndex
      };

      let next;
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = updatedProject;
      } else {
        next = [...prev, updatedProject];
      }
      localStorage.setItem('v0_projects_v2', JSON.stringify(next));
      return next;
    });
  }, [messages, history, currentIndex, currentProjectId]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleNewProject = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setCurrentProjectId(newId);
  };

  const handleSendMessage = async (text: string, image?: string) => {
    const userMessage: Message = { role: 'user', content: text, timestamp: Date.now(), image };
    setMessages(prev => [...prev, userMessage]);
    setStatus(AppStatus.GENERATING);
    setSuggestions([]);

    const steps = [
      "Analyzing requirements...",
      "Defining component schema...",
      "Generating responsive Tailwind layout...",
      "Applying polished UI styling..."
    ];
    
    let stepIdx = 0;
    const interval = setInterval(() => {
      setGenerationStep(steps[stepIdx % steps.length]);
      stepIdx++;
    }, 2500);

    try {
      const response = await generateComponent(text, messages, image);
      
      const newComponent: GeneratedComponent = {
        id: Math.random().toString(36).substr(2, 9),
        prompt: text,
        code: response.code,
        description: response.description,
        version: history.length + 1,
        timestamp: Date.now()
      };

      setHistory(prev => [...prev, newComponent]);
      setCurrentIndex(history.length); // Points to the new item
      setMessages(prev => [...prev, { role: 'assistant', content: response.description, timestamp: Date.now() }]);
      setStatus(AppStatus.IDLE);
      setViewMode(ViewMode.PREVIEW); 
      clearInterval(interval);

      getSmartSuggestions(response.description, response.code).then(setSuggestions);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      clearInterval(interval);
    }
  };

  const handleShare = () => {
    if (!currentComponent) return;
    const base64Code = btoa(encodeURIComponent(currentComponent.code));
    const url = new URL(window.location.href);
    url.searchParams.set('code', base64Code);
    url.searchParams.set('prompt', currentComponent.prompt);
    
    navigator.clipboard.writeText(url.toString());
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const fetchUserRepos = useCallback(async (token: string) => {
    if (!token) return;
    setIsFetchingRepos(true);
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: { 'Authorization': `token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableRepos(data);
      }
    } catch (err) {
      console.error("Error fetching repos:", err);
    } finally {
      setIsFetchingRepos(false);
    }
  }, []);

  const handleGithubExport = async () => {
    if (!githubConfig.token || !githubConfig.repo || !currentComponent) {
      setShowGithubModal(true);
      return;
    }
    setStatus(AppStatus.EXPORTING);
    setGenerationStep("Syncing to GitHub...");
    try {
      const contentBase64 = btoa(unescape(encodeURIComponent(currentComponent.code)));
      await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${githubConfig.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: githubConfig.commitMessage || `Add v${currentComponent.version} of component`,
          content: contentBase64,
          branch: githubConfig.branch
        })
      });
      setStatus(AppStatus.IDLE);
      setShowGithubModal(false);
    } catch (err) {
      console.error(err);
      setStatus(AppStatus.ERROR);
    }
  };

  const currentComponent = currentIndex >= 0 ? history[currentIndex] : null;

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      <ChatSidebar 
        messages={messages} 
        status={status} 
        onSendMessage={handleSendMessage}
        history={history}
        currentVersionIndex={currentIndex}
        onVersionSelect={setCurrentIndex}
        suggestions={suggestions}
        projects={projects}
        currentProjectId={currentProjectId}
        onProjectSelect={setCurrentProjectId}
        onNewProject={handleNewProject}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-4 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode(ViewMode.PREVIEW)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === ViewMode.PREVIEW ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Preview
            </button>
            <button 
              onClick={() => setViewMode(ViewMode.CODE)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === ViewMode.CODE ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Code
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-zinc-500 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
              {isDarkMode ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-15.07 1.41 1.41m12.73 12.73 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14-1.41 1.41"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
            </button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <button onClick={handleShare} disabled={!currentComponent} className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all ${shareCopied ? 'bg-green-500 text-white border-green-500' : 'bg-white dark:bg-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'}`}>{shareCopied ? 'Copied!' : 'Share'}</button>
            <button onClick={() => setShowGithubModal(true)} disabled={!currentComponent} className="text-xs font-bold px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg">Save to GitHub</button>
            <button onClick={handleGithubExport} disabled={!currentComponent || status !== AppStatus.IDLE} className="text-xs font-bold px-4 py-1.5 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700">Deploy</button>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
           <div className={`h-full w-full transition-all duration-700 ease-in-out ${(status === AppStatus.GENERATING || status === AppStatus.EXPORTING) ? 'blur-md opacity-40 scale-[0.98]' : 'blur-0 opacity-100 scale-100'}`}>
            {!currentComponent ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-3xl shadow-xl flex items-center justify-center">
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h2 className="text-xl font-bold dark:text-white">Design Playground</h2>
                <p className="text-sm text-zinc-500">Pick a magic action or start typing to begin.</p>
              </div>
            ) : viewMode === ViewMode.PREVIEW ? (
              <PreviewFrame code={currentComponent.code} deviceMode={deviceMode} />
            ) : (
              <CodeEditor code={currentComponent.code} />
            )}
          </div>

          {(status === AppStatus.GENERATING || status === AppStatus.EXPORTING) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center">
               <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xl dark:text-white">{status === AppStatus.EXPORTING ? 'Cloud Sync' : 'Gemini Logic'}</p>
                    <p className="text-sm text-zinc-500 animate-pulse mt-1">{generationStep || 'Working...'}</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {showGithubModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
             <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-xl dark:text-white">GitHub Integration</h3>
                <button onClick={() => setShowGithubModal(false)} className="text-zinc-400">✕</button>
             </div>
             <div className="p-6 space-y-4">
               <input 
                type="password" 
                placeholder="Personal Access Token" 
                value={githubConfig.token}
                onChange={e => {
                  setGithubConfig(prev => ({ ...prev, token: e.target.value }));
                  fetchUserRepos(e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-white"
               />
               <select 
                value={githubConfig.repo}
                onChange={e => {
                  const selected = availableRepos.find(r => r.name === e.target.value);
                  setGithubConfig(prev => ({ ...prev, repo: e.target.value, owner: selected?.owner.login || '' }));
                }}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-white"
               >
                 <option value="">Select Repository</option>
                 {availableRepos.map(r => <option key={r.id} value={r.name}>{r.full_name}</option>)}
               </select>
               <input 
                type="text" 
                placeholder="Branch (main)" 
                value={githubConfig.branch}
                onChange={e => setGithubConfig(prev => ({ ...prev, branch: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-white"
               />
               <button 
                onClick={handleGithubExport}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg"
               >
                 Authorize & Sync
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
