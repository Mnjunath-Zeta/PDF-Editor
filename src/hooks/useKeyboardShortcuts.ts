import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { nanoid } from 'nanoid';

export const useKeyboardShortcuts = () => {
    const { undo, redo, deleteAnnotation, selectedAnnotationId, annotations, addAnnotation } = useEditorStore();
    const copiedAnnotation = useRef<any>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Undo: Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }

            // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                redo();
            }

            // Copy: Ctrl+C or Cmd+C
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedAnnotationId) {
                const target = e.target as HTMLElement;
                if (target.contentEditable !== 'true' && target.tagName !== 'INPUT') {
                    e.preventDefault();
                    const annotation = annotations.find(a => a.id === selectedAnnotationId);
                    if (annotation) {
                        copiedAnnotation.current = { ...annotation };
                    }
                }
            }

            // Paste: Ctrl+V or Cmd+V
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedAnnotation.current) {
                const target = e.target as HTMLElement;
                if (target.contentEditable !== 'true' && target.tagName !== 'INPUT') {
                    e.preventDefault();
                    // Create a new annotation with a slight offset
                    const newAnnotation = {
                        ...copiedAnnotation.current,
                        id: nanoid(),
                        x: copiedAnnotation.current.x + 20,
                        y: copiedAnnotation.current.y + 20
                    };
                    addAnnotation(newAnnotation);
                }
            }

            // Delete: Delete or Backspace
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
                // Don't delete if user is editing text
                const target = e.target as HTMLElement;
                if (target.contentEditable !== 'true' && target.tagName !== 'INPUT') {
                    e.preventDefault();
                    deleteAnnotation(selectedAnnotationId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, deleteAnnotation, selectedAnnotationId, annotations, addAnnotation]);
};
