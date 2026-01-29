import { PDFUploader } from './components/PDFUploader';
import { Toolbar } from './components/Toolbar';
import { PDFViewer } from './components/PDFViewer';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useEditorStore } from './store/useEditorStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#fff' }}>
          <h2 style={{ color: 'var(--color-danger)' }}>Something went wrong.</h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: '1rem 0' }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reload PDF Editor
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import { X, Edit3 } from 'lucide-react';

function App() {
  const { file, setFile, toast, hideToast, confirmDialog, hideConfirm } = useEditorStore();
  useKeyboardShortcuts();

  return (
    <ErrorBoundary>
      <div className="app-container" style={{ background: '#f1f5f9', minHeight: '100vh' }}>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
        {confirmDialog && (
          <ConfirmDialog
            message={confirmDialog.message}
            onConfirm={() => {
              confirmDialog.onConfirm();
              hideConfirm();
            }}
            onCancel={hideConfirm}
          />
        )}
        {!file ? (
          <PDFUploader onUpload={setFile} />
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
                  onClick={() => window.location.reload()}
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
    </ErrorBoundary>
  );
}

export default App;
