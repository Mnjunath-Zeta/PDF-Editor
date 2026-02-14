import React from 'react';
import { motion } from 'framer-motion';
import { FileEdit, Maximize2, Settings, Shield, Zap, Sparkles } from 'lucide-react';
import { useAppStore, type AppTool } from '../store/useAppStore';

const tools: { id: AppTool; name: string; description: string; icon: React.ReactNode; color: string }[] = [
    {
        id: 'pdf-editor',
        name: 'PDF Editor',
        description: 'Edit, annotate, and manage your PDF documents with ease.',
        icon: <FileEdit size={32} />,
        color: '#3b82f6'
    },
    {
        id: 'file-resize',
        name: 'File Resize',
        description: 'Reduce file size of JPG, PNG, and PDF images without losing quality.',
        icon: <Maximize2 size={32} />,
        color: '#10b981'
    }
];

export const LandingPage: React.FC = () => {
    const { setActiveTool } = useAppStore();

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f172a',
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden'
        }}>
            {/* Background elements */}
            <div style={{
                position: 'fixed',
                top: '-10%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)',
                zIndex: 0
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-10%',
                left: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0) 70%)',
                zIndex: 0
            }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', position: 'relative', zIndex: 1 }}>
                <header style={{ textAlign: 'center', marginBottom: '6rem' }}>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '100px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#94a3b8',
                            marginBottom: '2rem'
                        }}>
                            <Sparkles size={16} color="#3b82f6" />
                            <span>Ultimate Utility Suite</span>
                        </div>
                        <h1 style={{
                            fontSize: '4.5rem',
                            fontWeight: 900,
                            letterSpacing: '-0.04em',
                            marginBottom: '1.5rem',
                            lineHeight: 1
                        }}>
                            All-in-one <span style={{
                                background: 'linear-gradient(to right, #3b82f6, #10b981)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Power Tools</span>
                        </h1>
                        <p style={{
                            fontSize: '1.25rem',
                            color: '#94a3b8',
                            maxWidth: '600px',
                            margin: '0 auto',
                            lineHeight: 1.6
                        }}>
                            Simple, fast, and secure tools for your daily digital workflows.
                            No registration required. Done locally in your browser.
                        </p>
                    </motion.div>
                </header>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: '2rem',
                    marginBottom: '8rem'
                }}>
                    {tools.map((tool, index) => (
                        <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                            onClick={() => setActiveTool(tool.id)}
                            style={{
                                background: 'rgba(30, 41, 59, 0.5)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '2rem',
                                padding: '2.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: tool.color,
                                borderRadius: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '2rem',
                                boxShadow: `0 10px 30px -5px ${tool.color}66`
                            }}>
                                {tool.icon}
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>{tool.name}</h2>
                            <p style={{ color: '#94a3b8', fontSize: '1.125rem', lineHeight: 1.5, marginBottom: '2rem' }}>
                                {tool.description}
                            </p>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: 700,
                                color: tool.color
                            }}>
                                Open Tool →
                            </div>
                        </motion.div>
                    ))}
                </div>

                <footer style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '4rem',
                    textAlign: 'center'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={18} />
                            <span>Privacy First</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Zap size={18} />
                            <span>Blazing Fast</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={18} />
                            <span>Browser Based</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};
