import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) => {
    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onCancel}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    animation: 'fadeIn 0.2s ease-out'
                }}
            />

            {/* Dialog */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '400px',
                maxWidth: '500px',
                animation: 'scaleIn 0.2s ease-out'
            }}>
                <div style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            background: '#fef3c7',
                            borderRadius: '50%',
                            padding: '0.5rem',
                            display: 'flex'
                        }}>
                            <AlertTriangle size={24} color="#f59e0b" />
                        </div>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: '#0f172a',
                            margin: 0
                        }}>
                            Confirm Action
                        </h3>
                    </div>

                    <p style={{
                        color: '#64748b',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        margin: 0,
                        whiteSpace: 'pre-line'
                    }}>
                        {message}
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'flex-end',
                        marginTop: '0.5rem'
                    }}>
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '0.625rem 1.25rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                color: '#64748b',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'white';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{
                                padding: '0.625rem 1.25rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#dc2626';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#ef4444';
                            }}
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from {
                        transform: translate(-50%, -50%) scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    );
};
