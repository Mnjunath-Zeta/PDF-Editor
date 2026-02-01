import React, { useState, useEffect } from 'react';
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
    ArrowRight,
    EyeOff,
    PencilLine,
} from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import type { ToolType } from '../store/useEditorStore';
import { savePDF } from '../utils/pdfProcessing';
import { TextFormatPanel } from './TextFormatPanel';
import { ShapeFormatPanel } from './ShapeFormatPanel';
import { nanoid } from 'nanoid';

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
        history,
        showToast,
        showConfirm,
        addAnnotation,
        addAndSelectAnnotation
    } = useEditorStore();

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSave = async () => {
        if (!file) {
            console.error('No file loaded');
            showToast('No file loaded!', 'error');
            return;
        }

        console.log('Starting PDF save...');
        console.log('Original file:', file.name, file.type, file.size);

        try {
            const pdfBytes = await savePDF(file, annotations);
            console.log('PDF generated, size:', pdfBytes.length);

            // Create sanitized filename
            let filename = file.name;
            if (!filename.toLowerCase().endsWith('.pdf')) {
                filename += '.pdf';
            }
            filename = `edited_${filename}`.replace(/\s+/g, '_');
            console.log('Download filename:', filename);

            // Try modern File System Access API first (works best in Chrome)
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'PDF Files',
                            accept: { 'application/pdf': ['.pdf'] }
                        }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(pdfBytes);
                    await writable.close();
                    // Delay alert to ensure it shows after file picker closes
                    setTimeout(() => {
                        showToast('PDF saved successfully!\n\nYour file has been saved to the location you selected.', 'success');
                    }, 100);
                    return;
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        console.log('File save cancelled by user');
                        return;
                    }
                    console.log('File picker failed, falling back to download:', err);
                }
            }

            // Fallback: Use data URL instead of blob URL (more reliable for filenames)
            const base64 = btoa(
                Array.from(new Uint8Array(pdfBytes))
                    .map(byte => String.fromCharCode(byte))
                    .join('')
            );
            const dataUrl = `data:application/pdf;base64,${base64}`;

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                // Show alert after download starts
                showToast('PDF download started!\n\nCheck your Downloads folder.', 'success');
            }, 200);
        } catch (error) {
            console.error('Failed to save PDF', error);
            showToast(`Failed to save PDF\n\n${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    const handleReplaceText = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            showToast('Please select text on the PDF first', 'info');
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const pageEl = document.elementFromPoint(centerX, centerY)?.closest('.react-pdf__Page');

        if (!pageEl) {
            showToast('Could not determine page. Ensure text is selected.', 'error');
            return;
        }

        const pageRect = pageEl.getBoundingClientRect();
        const pageNumber = parseInt(pageEl.getAttribute('data-page-number') || '1');

        const relX = (rect.left - pageRect.left) / scale;
        const relY = (rect.top - pageRect.top) / scale;
        const relW = rect.width / scale;
        const relH = rect.height / scale;

        addAnnotation({
            id: nanoid(),
            type: 'rect',
            page: pageNumber,
            x: relX - 2,
            y: relY - 1,
            width: relW + 4,
            height: relH + 2,
            color: 'white',
            fillColor: 'white'
        });

        addAndSelectAnnotation({
            id: nanoid(),
            type: 'text',
            page: pageNumber,
            x: relX,
            y: relY,
            fontSize: relH * 0.75,
            content: selection.toString(),
            color: 'black',
            width: relW,
            height: relH
        });

        selection.removeAllRanges();
        setTool('select');
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageContent = event.target?.result as string;
            if (imageContent) {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 200;
                    if (width > maxSize || height > maxSize) {
                        const ratio = width / height;
                        if (width > height) {
                            width = maxSize;
                            height = maxSize / ratio;
                        } else {
                            height = maxSize;
                            width = maxSize * ratio;
                        }
                    }

                    addAndSelectAnnotation({
                        id: nanoid(),
                        type: 'image',
                        x: 100,
                        y: 100,
                        width: width,
                        height: height,
                        page: currentPage,
                        image: imageContent
                    });
                    setTool('select');
                };
                img.src = imageContent;
            }
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const tools: { id: ToolType; icon: React.ReactNode; label: string }[] = [
        { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select' },
        { id: 'text', icon: <Type size={18} />, label: 'Text' },
        { id: 'patch', icon: <EyeOff size={18} />, label: 'Redact (Patch)' },
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
            padding: isMobile ? '0.5rem 0.5rem' : '0.5rem 1.5rem',
            background: 'transparent',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            gap: isMobile ? '0.5rem' : '1.5rem',
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
                border: '1px solid #e2e8f0',
                overflowX: 'auto',
                maxWidth: '100%',
                scrollbarWidth: 'none'
            }}>
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => {
                            if (tool.id === 'image') {
                                fileInputRef.current?.click();
                            } else {
                                setTool(tool.id);
                            }
                        }}
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

                <button
                    onClick={handleReplaceText}
                    title="Edit Selected Text"
                    style={{
                        padding: '0.5rem',
                        borderRadius: '8px',
                        color: 'var(--color-text-secondary)',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderLeft: '1px solid #e2e8f0',
                        marginLeft: '0.2rem',
                        marginRight: '0.2rem'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                >
                    <PencilLine size={18} />
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                />

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
                            // Use setTimeout to ensure the dialog appears properly
                            setTimeout(() => {
                                showConfirm('Clear All Annotations?\n\nThis will remove all annotations from the PDF.\n\nYou can undo this action with Ctrl+Z.', () => {
                                    resetAnnotations();
                                    showToast('All annotations cleared!\n\nUse Ctrl+Z to undo if needed.', 'success');
                                });
                            }, 0);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1.5rem', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-end' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: isMobile ? 'none' : '1px solid #e2e8f0', paddingLeft: isMobile ? 0 : '1.5rem' }}>
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
