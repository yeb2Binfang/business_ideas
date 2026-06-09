import { create } from 'zustand';

export interface AnalysisResult {
  simple: string;
  complicate: string;
  story: string;
  test: string;
  news: string;
}

export type ProcessingStep = 'idle' | 'parsing' | 'summarizing' | 'storytelling' | 'ideating' | 'completed';

export interface AppState {
  // 输入状态
  file: File | null;
  url: string;
  settings: {
    analysisDepth: 'basic' | 'detailed';
    outputStyle: 'professional' | 'casual';
  };
  
  // 处理状态
  processingStep: ProcessingStep;
  isProcessing: boolean;
  progress: number;
  
  // 结果状态
  result: AnalysisResult | null;
  activeTab: number;
  
  // 折叠状态
  collapsedSections: Record<string, boolean>;
  
  // Actions
  setFile: (file: File | null) => void;
  setUrl: (url: string) => void;
  setSettings: (settings: Partial<AppState['settings']>) => void;
  startProcessing: () => void;
  updateProgress: (step: ProcessingStep, progress: number) => void;
  setResult: (result: AnalysisResult | null) => void;
  setActiveTab: (tab: number) => void;
  toggleSection: (section: string) => void;
  reset: () => void;
}

const initialResult: AnalysisResult = {
  simple: '',
  complicate: '',
  story: '',
  test: '',
  news: ''
};

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  file: null,
  url: '',
  settings: {
    analysisDepth: 'detailed',
    outputStyle: 'professional'
  },
  processingStep: 'idle',
  isProcessing: false,
  progress: 0,
  result: null,
  activeTab: 0,
  collapsedSections: {},
  
  // Actions
  setFile: (file) => set({ file }),
  setUrl: (url) => set({ url }),
  setSettings: (settings) => set((state) => ({ 
    settings: { ...state.settings, ...settings } 
  })),
  
  startProcessing: () => set({ 
    isProcessing: true, 
    processingStep: 'parsing', 
    progress: 0,
    result: initialResult
  }),
  
  updateProgress: (step, progress) => set({ 
    processingStep: step, 
    progress 
  }),
  
  setResult: (result) => set({ 
    result, 
    isProcessing: false, 
    processingStep: 'completed' 
  }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  toggleSection: (section) => set((state) => ({
    collapsedSections: {
      ...state.collapsedSections,
      [section]: !state.collapsedSections[section]
    }
  })),
  
  reset: () => set({
    file: null,
    url: '',
    processingStep: 'idle',
    isProcessing: false,
    progress: 0,
    result: null,
    activeTab: 0
  })
}));
