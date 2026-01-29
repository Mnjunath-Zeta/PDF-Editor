import { create } from 'zustand';

export type ToolType = 'select' | 'text' | 'draw' | 'rect' | 'patch' | 'line' | 'arrow' | 'circle' | 'image';

export interface Annotation {
    id: string;
    type: ToolType;
    page: number;
    x: number;
    y: number;
    content?: string; // for text
    width?: number; // for rect/image/circle
    height?: number; // for rect/image/circle
    endX?: number; // for line/arrow
    endY?: number; // for line/arrow
    color?: string; // stroke color
    fillColor?: string; // fill color
    strokeWidth?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    fontSize?: number;
    fontFamily?: string; // font family
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
    points?: { x: number; y: number }[]; // for draw
    image?: string; // dataURL for image
    textAlign?: 'left' | 'center' | 'right'; // text alignment
    backgroundColor?: string; // background color for text
    opacity?: number; // 0-1 for transparency
}

interface EditorState {
    file: File | null;
    numPages: number;
    currentPage: number;
    scale: number;
    selectedTool: ToolType;
    annotations: Annotation[];
    selectedAnnotationId: string | null;
    history: Annotation[][];
    historyIndex: number;
    defaultShapeColor: string;
    defaultShapeFillColor: string;
    defaultShapeStrokeWidth: number;
    defaultShapeStrokeStyle: 'solid' | 'dashed' | 'dotted';

    setFile: (file: File) => void;
    setNumPages: (num: number) => void;
    setCurrentPage: (page: number) => void;
    setScale: (scale: number) => void;
    setTool: (tool: ToolType) => void;
    addAnnotation: (annotation: Annotation) => void;
    addAndSelectAnnotation: (annotation: Annotation) => void;
    moveAnnotation: (id: string, x: number, y: number) => void;
    updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
    deleteAnnotation: (id: string) => void;
    resetAnnotations: () => void;
    selectAnnotation: (id: string | null) => void;
    undo: () => void;
    redo: () => void;
    setDefaultShapeColor: (color: string) => void;
    setDefaultShapeFillColor: (color: string) => void;
    setDefaultShapeStrokeWidth: (width: number) => void;
    setDefaultShapeStrokeStyle: (style: 'solid' | 'dashed' | 'dotted') => void;

    // Toast notifications
    toast: { message: string; type: 'success' | 'error' | 'info' } | null;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    hideToast: () => void;

    // Confirm dialog
    confirmDialog: { message: string; onConfirm: () => void } | null;
    showConfirm: (message: string, onConfirm: () => void) => void;
    hideConfirm: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    file: null,
    numPages: 0,
    currentPage: 1,
    scale: 1.0,
    selectedTool: 'select',
    annotations: [],
    selectedAnnotationId: null,
    history: [[]],
    historyIndex: 0,
    defaultShapeColor: '#000000',
    defaultShapeFillColor: 'transparent',
    defaultShapeStrokeWidth: 2,
    defaultShapeStrokeStyle: 'solid',
    toast: null,
    confirmDialog: null,

    setFile: (file) => set({
        file,
        currentPage: 1,
        numPages: 0,
        annotations: [],
        history: [[]],
        historyIndex: 0,
        selectedAnnotationId: null
    }),
    setNumPages: (numPages) => set({ numPages }),
    setCurrentPage: (currentPage) => set({ currentPage }),
    setScale: (scale) => set({ scale }),
    setTool: (selectedTool) => set({ selectedTool, selectedAnnotationId: null }),

    // Efficient movement without history bloat
    moveAnnotation: (id, x, y) => {
        if (!id) return;
        set((state) => ({
            annotations: state.annotations.map(ann =>
                ann.id === id ? { ...ann, x, y } : ann
            )
        }));
    },

    addAndSelectAnnotation: (annotation) => {
        if (!annotation || !annotation.id) return;
        set((state) => {
            const newAnnotations = [...state.annotations, annotation];
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newAnnotations);
            return {
                annotations: newAnnotations,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                selectedAnnotationId: annotation.id
            };
        });
    },

    addAnnotation: (annotation) => {
        if (!annotation || !annotation.id) return;
        set((state) => {
            const newAnnotations = [...state.annotations, annotation];
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newAnnotations);
            return {
                annotations: newAnnotations,
                history: newHistory,
                historyIndex: newHistory.length - 1
            };
        });
    },

    updateAnnotation: (id, updates) => {
        if (!id || !updates) return;
        set((state) => {
            const targetAnn = state.annotations.find(a => a.id === id);
            if (!targetAnn) return state;

            const newAnnotations = state.annotations.map((ann) =>
                ann.id === id ? { ...ann, ...updates } : ann
            );

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newAnnotations);
            return {
                annotations: newAnnotations,
                history: newHistory,
                historyIndex: newHistory.length - 1
            };
        });
    },

    deleteAnnotation: (id) =>
        set((state) => {
            const newAnnotations = state.annotations.filter((ann) => ann.id !== id);
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newAnnotations);
            return {
                annotations: newAnnotations,
                history: newHistory,
                historyIndex: newHistory.length - 1
            };
        }),

    resetAnnotations: () =>
        set((state) => {
            if (state.annotations.length === 0) return state;
            const newAnnotations: any[] = [];
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newAnnotations);
            return {
                annotations: newAnnotations,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                selectedAnnotationId: null
            };
        }),

    selectAnnotation: (selectedAnnotationId) => set({ selectedAnnotationId }),

    undo: () => set((state) => {
        if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            return {
                annotations: state.history[newIndex],
                historyIndex: newIndex,
                selectedAnnotationId: null
            };
        }
        return state;
    }),

    redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            return {
                annotations: state.history[newIndex],
                historyIndex: newIndex,
                selectedAnnotationId: null
            };
        }
        return state;
    }),

    setDefaultShapeColor: (defaultShapeColor) => set({ defaultShapeColor }),
    setDefaultShapeFillColor: (defaultShapeFillColor) => set({ defaultShapeFillColor }),
    setDefaultShapeStrokeWidth: (defaultShapeStrokeWidth) => set({ defaultShapeStrokeWidth }),
    setDefaultShapeStrokeStyle: (defaultShapeStrokeStyle) => set({ defaultShapeStrokeStyle }),

    showToast: (message, type) => set({ toast: { message, type } }),
    hideToast: () => set({ toast: null }),

    showConfirm: (message, onConfirm) => set({ confirmDialog: { message, onConfirm } }),
    hideConfirm: () => set({ confirmDialog: null }),
}));
