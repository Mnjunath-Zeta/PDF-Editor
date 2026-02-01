import React from 'react';
import { Document, Page } from 'react-pdf';
import { useEditorStore } from '../store/useEditorStore';
import { X, RotateCw, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

export const PageManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { file, pages, rotatePage, movePage, deletePage } = useEditorStore();

    if (!file) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '1000px',
                height: '85%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Manage Pages</h2>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.5rem', borderRadius: '50%', background: '#f1f5f9' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                    <Document file={file}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem' }}>
                            {pages.map((page, index) => (
                                <div key={page.id} style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    background: '#fff',
                                    transition: 'box-shadow 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{
                                        width: 140,
                                        height: 180,
                                        background: '#f8fafc',
                                        marginBottom: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '4px'
                                    }}>
                                        <Page
                                            pageNumber={page.originalIndex + 1}
                                            width={140}
                                            rotate={page.rotation}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            loading={<div style={{ fontSize: '0.75rem', color: '#64748b' }}>Loading...</div>}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                        <button
                                            onClick={() => rotatePage(page.id, 'cw')}
                                            title="Rotate"
                                            style={{ padding: '0.4rem', borderRadius: '4px', background: '#e0f2fe', color: '#0284c7', border: 'none', cursor: 'pointer' }}
                                        >
                                            <RotateCw size={14} />
                                        </button>
                                        <button
                                            onClick={() => deletePage(page.id)}
                                            title="Delete"
                                            style={{ padding: '0.4rem', borderRadius: '4px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        <div style={{ width: '1px', background: '#e2e8f0', margin: '0 0.2rem' }} />

                                        <button
                                            onClick={() => index > 0 && movePage(index, index - 1)}
                                            disabled={index === 0}
                                            title="Move Left/Up"
                                            style={{ padding: '0.4rem', borderRadius: '4px', background: index === 0 ? '#f1f5f9' : '#f0f9ff', color: index === 0 ? '#cbd5e1' : '#475569', border: 'none', cursor: index === 0 ? 'default' : 'pointer' }}
                                        >
                                            <ArrowLeft size={14} />
                                        </button>
                                        <button
                                            onClick={() => index < pages.length - 1 && movePage(index, index + 1)}
                                            disabled={index === pages.length - 1}
                                            title="Move Right/Down"
                                            style={{ padding: '0.4rem', borderRadius: '4px', background: index === pages.length - 1 ? '#f1f5f9' : '#f0f9ff', color: index === pages.length - 1 ? '#cbd5e1' : '#475569', border: 'none', cursor: index === pages.length - 1 ? 'default' : 'pointer' }}
                                        >
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#64748b', fontWeight: 500 }}>Page {index + 1}</span>
                                </div>
                            ))}
                        </div>
                    </Document>
                </div>
            </div>
        </div>
    );
};
