import React, { useCallback, useState } from 'react';
import { Upload, FileUp, Shield, Zap, Edit3, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PDFUploaderProps {
  onUpload: (file: File) => void;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onUpload(file);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        background: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        padding: '2rem',
      }}
    >
      {/* Dynamic Background Blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ zIndex: 1, textAlign: 'center', maxWidth: '1000px', width: '100%' }}
      >
        <header style={{ marginBottom: '3rem' }}>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            style={{ marginBottom: '1rem', display: 'inline-block' }}
          >
            <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', padding: '1rem', borderRadius: '1.25rem', boxShadow: '0 10px 25px -5px rgba(59,130,246,0.3)' }}>
              <Edit3 size={32} color="white" />
            </div>
          </motion.div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '1rem', background: 'linear-gradient(to right, #0f172a, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Next-Gen PDF Editing
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Redact, annotate, and transform your documents with professional tools in seconds. No sign-up required.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 500px) 1fr', gap: '3rem', alignItems: 'center' }}>
          {/* Upload Card */}
          <motion.label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ y: -5 }}
            style={{
              position: 'relative',
              background: 'white',
              padding: '3rem 2rem',
              borderRadius: 'var(--radius-xl)',
              boxShadow: isDragging ? '0 25px 50px -12px rgba(59,130,246,0.25)' : 'var(--shadow-xl)',
              cursor: 'pointer',
              border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(59,130,246,0.05)', borderRadius: 'var(--radius-xl)', zIndex: 0 }}
                />
              )}
            </AnimatePresence>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '2rem',
                  background: isDragging ? '#eff6ff' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  transition: 'all 0.3s'
                }}
              >
                <FileUp size={40} color={isDragging ? 'var(--color-primary)' : '#64748b'} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Drop your PDF here</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>or click to browse from your device</p>

              <div style={{
                background: 'var(--color-primary)',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px 0 rgba(59,130,246,0.39)'
              }}>
                <Upload size={18} />
                Upload PDF
              </div>
            </div>

            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </motion.label>

          {/* Features Section */}
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
              Why choose our editor?
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { icon: <Shield size={20} />, title: 'Privacy Guaranteed', desc: 'Processing happens entirely in your browser. Files never leave your device.' },
                { icon: <Zap size={20} />, title: 'Instant Performance', desc: 'No loading screens or server delays. Local processing for maximum speed.' },
                { icon: <CheckCircle2 size={20} />, title: 'Professional Tools', desc: 'Complete set of redact, highlight, and text annotation features.' }
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i + 0.4 }}
                  style={{ display: 'flex', gap: '1rem' }}
                >
                  <div style={{ color: 'var(--color-primary)', marginTop: '0.125rem' }}>{f.icon}</div>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a' }}>{f.title}</h5>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <footer style={{ marginTop: '5rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Trusted by precision editors worldwide. Built for security.
          </p>
        </footer>
      </motion.div>
    </div>
  );
};
