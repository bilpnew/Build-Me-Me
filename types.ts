
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string; // Base64 image data
}

export interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  description: string;
  version: number;
  timestamp: number;
}

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  history: GeneratedComponent[];
  messages: Message[];
  currentIndex: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
  EXPORTING = 'EXPORTING'
}

export enum ViewMode {
  PREVIEW = 'PREVIEW',
  CODE = 'CODE'
}

export enum DeviceMode {
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  MOBILE = 'MOBILE'
}

export type StylePreset = 'Modern' | 'Glassmorphism' | 'Minimalist' | 'Brutalist' | 'Cyberpunk';

export interface GithubConfig {
  token: string;
  repo: string;
  owner: string;
  branch: string;
  path: string;
  commitMessage: string;
}
