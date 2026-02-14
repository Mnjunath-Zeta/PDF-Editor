import React from 'react';
import { PDFUploader } from '../../components/PDFUploader';
import { Toolbar } from '../../components/Toolbar';
import { PDFViewer } from '../../components/PDFViewer';
import { useEditorStore } from '../../store/useEditorStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { X, Edit3, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const PDFEditorTool: React.FC = () => {
    const { file, setFile } = useEditorStore();
    const { setActiveTool } = useAppStore();
    useKeyboardShortcuts();

    return (
        <div className="pdf-editor-container" style={{ background: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {!file ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <header style={{
                        background: 'white',
                        padding: '1rem 2rem',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <button
                            onClick={() => setActiveTool('landing')}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '50%',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>PDF Editor</h1>
                    </header>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PDFUploader onUpload={setFile} />
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                    <header style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                        position: 'relative',
                        zIndex: 50,
                        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.02)'
                    }}>
                        <div style={{
                            padding: '0.75rem 1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            maxWidth: '1800px',
                            margin: '0 auto',
                            width: '100%'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setActiveTool('landing')}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background 0.2s',
                                        marginRight: '0.5rem'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div style={{
                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 10px -2px rgba(59,130,246,0.3)'
                                }}>
                                    <Edit3 size={18} color="white" />
                                </div>
                                <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                                    PDF<span style={{ color: 'var(--color-primary)' }}>Pro</span>
                                </h1>
                            </div>

                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to close the editor? Any unsaved changes will be lost.')) {
                                        window.location.reload();
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#fee2e2';
                                    e.currentTarget.style.color = 'var(--color-danger)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                                }}
                            >
                                <X size={16} />
                                Close Editor
                            </button>
                        </div>
                        <Toolbar />
                    </header>
                    <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                        <PDFViewer />
                    </main>
                </div>
            )}
        </div>
    );
};
