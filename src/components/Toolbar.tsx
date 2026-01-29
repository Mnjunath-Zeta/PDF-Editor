import React from 'react';
import {
    MousePointer2,
    Type,
    Pen,
    Square,
    Image as ImageIcon,
    ZoomIn,
    ZoomOut,
    ChevronLeft,
    ChevronRight,
    Eraser,
    Download,
    Undo,
    Redo,
    Trash2,
    Circle,
    Minus,
    ArrowRight
} from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import type { ToolType } from '../store/useEditorStore';
import { savePDF } from '../utils/pdfProcessing';
import { TextFormatPanel } from './TextFormatPanel';
import { ShapeFormatPanel } from './ShapeFormatPanel';

export const Toolbar: React.FC = () => {
    const {
        selectedTool,
        setTool,
        scale,
        setScale,
        currentPage,
        numPages,
        setCurrentPage,
        deleteAnnotation,
        selectedAnnotationId,
        file,
        annotations,
        resetAnnotations,
        undo,
        redo,
        historyIndex,
        history
    } = useEditorStore();

    const handleSave = async () => {
        if (!file) return;
        try {
            const pdfBytes = await savePDF(file, annotations);
            // Cast to any to avoid SharedArrayBuffer vs ArrayBuffer conflict in strict mode
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'edited_document.pdf';
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to save PDF', error);
            alert('Failed to save PDF');
        }
    };

    const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
        { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select' },
        { id: 'text', icon: <Type size={18} />, label: 'Text' },
        { id: 'patch', icon: <Square size={18} fill="currentColor" />, label: 'Redact (Patch)' },
        { id: 'line', icon: <Minus size={18} style={{ transform: 'rotate(-45deg)' }} />, label: 'Line' },
        { id: 'arrow', icon: <ArrowRight size={18} style={{ transform: 'rotate(-45deg)' }} />, label: 'Arrow' },
        { id: 'rect', icon: <Square size={18} />, label: 'Rectangle' },
        { id: 'circle', icon: <Circle size={18} />, label: 'Circle' },
        { id: 'draw', icon: <Pen size={18} />, label: 'Freehand' },
        { id: 'image', icon: <ImageIcon size={18} />, label: 'Image' },
    ];

    if (!file) return null;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1.5rem',
            background: 'transparent',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            gap: '1.5rem',
            flexWrap: 'wrap',
            maxWidth: '1800px',
            margin: '0 auto',
            width: '100%'
        }}>
            {/* Tools Section */}
            <div style={{
                display: 'flex',
                gap: '0.4rem',
                background: '#f1f5f9',
                padding: '0.3rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e2e8f0'
            }}>
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => setTool(tool.id)}
                        title={tool.label}
                        style={{
                            padding: '0.5rem',
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: selectedTool === tool.id ? 'white' : 'transparent',
                            color: selectedTool === tool.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            boxShadow: selectedTool === tool.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseOver={(e) => {
                            if (selectedTool !== tool.id) e.currentTarget.style.color = 'var(--color-text)';
                        }}
                        onMouseOut={(e) => {
                            if (selectedTool !== tool.id) e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }}
                    >
                        {tool.icon}
                    </button>
                ))}

                {/* Delete Selection */}
                {selectedAnnotationId && (
                    <button
                        onClick={() => deleteAnnotation(selectedAnnotationId)}
                        title="Delete Selected Annotation (Delete/Backspace)"
                        style={{
                            padding: '0.5rem',
                            borderRadius: '8px',
                            color: 'var(--color-danger)',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <Eraser size={18} />
                    </button>
                )}
            </div>

            {/* History Section */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    title="Undo (Ctrl+Z)"
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-secondary)',
                        opacity: historyIndex <= 0 ? 0.3 : 1,
                        cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
                    }}
                    onMouseOver={(e) => { if (historyIndex > 0) e.currentTarget.style.background = '#f1f5f9' }}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <Undo size={18} />
                </button>
                <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    title="Redo (Ctrl+Shift+Z)"
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-secondary)',
                        opacity: historyIndex >= history.length - 1 ? 0.3 : 1,
                        cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
                    }}
                    onMouseOver={(e) => { if (historyIndex < history.length - 1) e.currentTarget.style.background = '#f1f5f9' }}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <Redo size={18} />
                </button>

                {/* Reset/Clear All */}
                {annotations.length > 0 && (
                    <button
                        onClick={() => {
                            if (window.confirm('Clear all annotations? This can be undone.')) {
                                resetAnnotations();
                            }
                        }}
                        title="Clear All Annotations"
                        style={{
                            padding: '0 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-danger)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginLeft: '0.5rem',
                            height: '36px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <Trash2 size={14} />
                        Clear All
                    </button>
                )}
            </div>

            {/* Format Panels */}
            <div style={{ position: 'relative' }}>
                <TextFormatPanel />
                <ShapeFormatPanel />
            </div>

            {/* Navigation & Action Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {/* Save Button - Premium Styling */}
                <button
                    onClick={handleSave}
                    title="Save PDF - Download edited PDF"
                    style={{
                        padding: '0.6rem 1.25rem',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        color: 'white',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                        border: 'none'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <Download size={16} />
                    Export PDF
                </button>

                {/* Zoom & Page Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px' }}>
                        <button
                            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'white'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <ZoomOut size={16} color="#64748b" />
                        </button>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '3.5rem', textAlign: 'center', color: '#475569' }}>
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={() => setScale(Math.min(3, scale + 0.1))}
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'white'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <ZoomIn size={16} color="#64748b" />
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px' }}>
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            style={{ padding: '0.4rem', borderRadius: '6px', opacity: currentPage <= 1 ? 0.3 : 1 }}
                            onMouseOver={(e) => { if (currentPage > 1) e.currentTarget.style.background = 'white' }}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <ChevronLeft size={16} color="#64748b" />
                        </button>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '3.5rem', textAlign: 'center', color: '#475569' }}>
                            {currentPage} / {numPages || '--'}
                        </span>
                        <button
                            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                            disabled={currentPage >= numPages}
                            style={{ padding: '0.4rem', borderRadius: '6px', opacity: currentPage >= numPages ? 0.3 : 1 }}
                            onMouseOver={(e) => { if (currentPage < numPages) e.currentTarget.style.background = 'white' }}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <ChevronRight size={16} color="#64748b" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
