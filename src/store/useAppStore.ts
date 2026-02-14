import { create } from 'zustand';

export type AppTool = 'landing' | 'pdf-editor' | 'file-resize' | 'emi-calculator';

interface AppState {
    activeTool: AppTool;
    setActiveTool: (tool: AppTool) => void;
}

export const useAppStore = create<AppState>((set) => ({
    activeTool: 'landing',
    setActiveTool: (activeTool) => set({ activeTool }),
}));
