import { create } from 'zustand';

export interface CommitFileData {
  filename: string;
  additions: number;
  deletions: number;
  status: string;
}

export interface CommitData {
  id: string;
  sha: string;
  message: string;
  author: string;
  author_login?: string;
  author_avatar?: string;
  date: string;
  url: string;
  repo: string;
  branch?: string;
  similarity?: number;
  category?: string;
  tags?: string[];
  techDebt?: boolean;
  impactScore?: number;
  stats?: { additions: number; deletions: number; total: number };
  files?: CommitFileData[];
}

export interface ChatMessage {
  text: string;
  sender: 'bot' | 'user';
  timestamp: number;
}

interface AppState {
  // RHO Score (system health metric)
  rhoScore: number;
  setRhoScore: (score: number) => void;

  // Commits data from Supabase
  commits: CommitData[];
  setCommits: (commits: CommitData[]) => void;
  isLoadingCommits: boolean;
  setIsLoadingCommits: (loading: boolean) => void;

  // Chat state
  isChatOpen: boolean;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;

  // Chat messages
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;

  // User query for RAG
  userQuery: string;
  setUserQuery: (query: string) => void;

  // UI state
  activeView: 'spiral' | 'dashboard' | 'feed';
  setActiveView: (view: 'spiral' | 'dashboard' | 'feed') => void;

  // Loading states
  isThinking: boolean;
  setIsThinking: (thinking: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // RHO
  rhoScore: 0.095,
  setRhoScore: (score) => set({ rhoScore: score }),

  // Commits
  commits: [],
  setCommits: (commits) => set({ commits }),
  isLoadingCommits: false,
  setIsLoadingCommits: (loading) => set({ isLoadingCommits: loading }),

  // Chat
  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setChatOpen: (open) => set({ isChatOpen: open }),

  // Messages
  messages: [
    {
      text: "Olá! Sou o EGOS Intelligence. Pergunte-me sobre commits, arquitetura ou contribuições.",
      sender: 'bot',
      timestamp: Date.now(),
    },
  ],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () =>
    set({
      messages: [
        {
          text: "Olá! Sou o EGOS Intelligence. Pergunte-me sobre commits, arquitetura ou contribuições.",
          sender: 'bot',
          timestamp: Date.now(),
        },
      ],
    }),

  // Query
  userQuery: '',
  setUserQuery: (query) => set({ userQuery: query }),

  // UI
  activeView: 'spiral',
  setActiveView: (view) => set({ activeView: view }),

  // Loading
  isThinking: false,
  setIsThinking: (thinking) => set({ isThinking: thinking }),
}));
