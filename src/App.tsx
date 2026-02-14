import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useEditorStore } from './store/useEditorStore';
import { useAppStore } from './store/useAppStore';
import { LandingPage } from './components/LandingPage';
import { PDFEditorTool } from './tools/PDFEditor/PDFEditorTool';
import { FileResizeTool } from './tools/FileResize/FileResizeTool';
import { EMICalculatorTool } from './tools/EMICalculator/EMICalculatorTool';
import { AnimatePresence, motion } from 'framer-motion';

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
        <div style={{ padding: '2rem', textAlign: 'center', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
              cursor: 'pointer',
              alignSelf: 'center'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { toast, hideToast, confirmDialog, hideConfirm } = useEditorStore();
  const { activeTool } = useAppStore();

  const renderTool = () => {
    switch (activeTool) {
      case 'landing':
        return <LandingPage />;
      case 'pdf-editor':
        return <PDFEditorTool />;
      case 'file-resize':
        return <FileResizeTool />;
      case 'emi-calculator':
        return <EMICalculatorTool />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
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

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTool()}
          </motion.div>
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

export default App;
