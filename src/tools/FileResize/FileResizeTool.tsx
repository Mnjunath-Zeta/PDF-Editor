import React, { useState, useEffect } from 'react';
import { Upload, FileType, ArrowLeft, Maximize, Minimize, FileText, Sparkles, Download, Loader2, CheckCircle2, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';

// Set up pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ResizeMode = 'reduce' | 'upscale' | 'target';
type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export const FileResizeTool: React.FC = () => {
    const { setActiveTool } = useAppStore();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [mode, setMode] = useState<ResizeMode>('reduce');
    const [status, setStatus] = useState<ProcessingStatus>('idle');
    const [processedFile, setProcessedFile] = useState<{ blob: Blob; name: string } | null>(null);
    const [maxSizeKb, setMaxSizeKb] = useState<number | ''>('');

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            setStatus('idle');
            setProcessedFile(null);
            return;
        }

        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    const isPdf = file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf');
    const isImage = file?.type.startsWith('image/');

    const handleProcess = async () => {
        if (!file) return;
        setStatus('processing');

        try {
            if (isImage) {
                await processImage();
            } else if (isPdf) {
                await processPdf();
            }
        } catch (err) {
            console.error('Processing failed:', err);
            setStatus('error');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const processImage = async () => {
        return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                const targetSizeBytes = maxSizeKb !== '' ? maxSizeKb * 1024 : Infinity;

                // Determine output type and extension
                let outputType = file!.type;
                if (!['image/jpeg', 'image/png'].includes(outputType)) {
                    outputType = 'image/jpeg';
                }

                let bestBlob: Blob | null = null;
                const nameWithoutExt = file!.name.split('.').slice(0, -1).join('.') || 'image';
                const extension = outputType === 'image/png' ? '.png' : '.jpg';

                if (maxSizeKb !== '') {
                    const scales = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
                    const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];

                    outer: for (const scale of scales) {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) continue;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        for (const quality of qualities) {
                            const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, outputType, quality));
                            if (blob && blob.size <= targetSizeBytes) {
                                bestBlob = blob;
                                break outer;
                            }
                            if (blob) bestBlob = blob;
                        }
                    }
                } else {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (mode === 'reduce') {
                        width *= 0.7;
                        height *= 0.7;
                    } else if (mode === 'upscale') {
                        width *= 1.5;
                        height *= 1.5;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    const quality = mode === 'reduce' ? 0.7 : 0.9;
                    bestBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, outputType, quality));
                }

                if (bestBlob) {
                    setProcessedFile({
                        blob: bestBlob,
                        name: `processed_${nameWithoutExt}${extension}`
                    });
                    setStatus('completed');
                    resolve();
                } else {
                    reject(new Error('Image processing failed'));
                }
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file!);
        });
    };

    const processPdf = async () => {
        if (!file) return;
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const pdfBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
        });

        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.') || 'document';

        setProcessedFile({
            blob,
            name: `processed_${nameWithoutExt}.pdf`
        });
        setStatus('completed');
    };

    const handleDownload = () => {
        if (!processedFile || !processedFile.blob) return;

        const url = URL.createObjectURL(processedFile.blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = processedFile.name || 'processed_file';

        document.body.appendChild(link);

        // Use a more robust trigger for standard browsers
        link.click();

        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
        }, 5000); // 5 seconds to be safe
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column'
        }}>
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
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>File Resize Tool</h1>
            </header>

            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }}>
                <div style={{
                    maxWidth: '800px',
                    width: '100%',
                    background: 'white',
                    borderRadius: '1.5rem',
                    padding: '3rem',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                    textAlign: 'center'
                }}>
                    {!file ? (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const droppedFile = e.dataTransfer.files[0];
                                if (droppedFile) setFile(droppedFile);
                            }}
                            style={{
                                border: '2px dashed #e2e8f0',
                                borderRadius: '1rem',
                                padding: '4rem 2rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: '#eff6ff',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                color: '#3b82f6'
                            }}>
                                <Upload size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
                                Upload files to resize
                            </h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                                Support for JPG, PNG and PDF files
                            </p>
                            <input
                                type="file"
                                id="file-upload"
                                hidden
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <label
                                htmlFor="file-upload"
                                style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '0.75rem 2rem',
                                    borderRadius: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-block'
                                }}
                            >
                                Select Files
                            </label>
                        </div>
                    ) : (
                        <div>
                            {status === 'completed' ? (
                                <div style={{ padding: '1rem 0' }}>
                                    <div style={{ color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: '#ecfdf5',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#10b981'
                                        }}>
                                            <CheckCircle2 size={40} />
                                        </div>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>File Processed!</h2>
                                        <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '400px', wordBreak: 'break-all' }}>
                                            Ready to save: <strong>{processedFile?.name}</strong>
                                        </p>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1.5rem',
                                        marginBottom: '3rem'
                                    }}>
                                        <div style={{
                                            background: '#f8fafc',
                                            padding: '1.5rem',
                                            borderRadius: '1rem',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>Original Size</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{formatBytes(file.size)}</div>
                                        </div>
                                        <div style={{
                                            background: '#eff6ff',
                                            padding: '1.5rem',
                                            borderRadius: '1rem',
                                            border: '1px solid #bfdbfe'
                                        }}>
                                            <div style={{ fontSize: '0.875rem', color: '#1e63e9', marginBottom: '0.5rem', fontWeight: 600 }}>Resized Size</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e3a8a' }}>{formatBytes(processedFile?.blob.size || 0)}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                        <button
                                            onClick={handleDownload}
                                            style={{
                                                background: '#3b82f6',
                                                color: 'white',
                                                padding: '1rem 2rem',
                                                borderRadius: '0.75rem',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                                                fontSize: '1.125rem'
                                            }}
                                        >
                                            <Download size={20} />
                                            Download Resized File
                                        </button>
                                        <button
                                            onClick={() => { setFile(null); setStatus('idle'); }}
                                            style={{
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                padding: '1rem 2rem',
                                                borderRadius: '0.75rem',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '1.125rem'
                                            }}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1.5rem',
                                        padding: '1.5rem',
                                        background: '#f8fafc',
                                        borderRadius: '1.25rem',
                                        marginBottom: '2.5rem',
                                        textAlign: 'left',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{
                                            width: '100px',
                                            height: '100px',
                                            background: 'white',
                                            borderRadius: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            border: '1px solid #e2e8f0',
                                            flexShrink: 0
                                        }}>
                                            {isImage && previewUrl ? (
                                                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : isPdf ? (
                                                <div style={{ transform: 'scale(0.3)', transformOrigin: 'center' }}>
                                                    <Document file={file} loading={<FileText size={48} color="#94a3b8" />}>
                                                        <Page pageNumber={1} width={300} renderTextLayer={false} renderAnnotationLayer={false} />
                                                    </Document>
                                                </div>
                                            ) : (
                                                <FileType size={40} color="#94a3b8" />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.125rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {file.name}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                {formatBytes(file.size)} • {file.type || 'Unknown Type'}
                                            </div>
                                            <button
                                                onClick={() => setFile(null)}
                                                style={{
                                                    marginTop: '0.75rem',
                                                    color: '#ef4444',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    padding: 0
                                                }}
                                                disabled={status === 'processing'}
                                            >
                                                Choose another file
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Sparkles size={18} color="#3b82f6" />
                                                Resizing Options
                                            </h3>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                                            <button
                                                onClick={() => { setMode('reduce'); setMaxSizeKb(''); }}
                                                style={{
                                                    padding: '1.5rem',
                                                    border: mode === 'reduce' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                                                    borderRadius: '1.25rem',
                                                    background: mode === 'reduce' ? '#eff6ff' : 'white',
                                                    cursor: status === 'processing' ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                disabled={status === 'processing'}
                                            >
                                                <Minimize size={28} color={mode === 'reduce' ? '#3b82f6' : '#64748b'} />
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 700, color: mode === 'reduce' ? '#1e3a8a' : '#1e293b' }}>Simple Reduce</div>
                                                    <div style={{ fontSize: '0.75rem', color: mode === 'reduce' ? '#3b82f6' : '#64748b', marginTop: '0.25rem' }}>Automated compression</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => { setMode('upscale'); setMaxSizeKb(''); }}
                                                style={{
                                                    padding: '1.5rem',
                                                    border: mode === 'upscale' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                                                    borderRadius: '1.25rem',
                                                    background: mode === 'upscale' ? '#eff6ff' : 'white',
                                                    cursor: status === 'processing' ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                disabled={status === 'processing'}
                                            >
                                                <Maximize size={28} color={mode === 'upscale' ? '#3b82f6' : '#64748b'} />
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 700, color: mode === 'upscale' ? '#1e3a8a' : '#1e293b' }}>Upscale</div>
                                                    <div style={{ fontSize: '0.75rem', color: mode === 'upscale' ? '#3b82f6' : '#64748b', marginTop: '0.25rem' }}>Increase resolution</div>
                                                </div>
                                            </button>
                                        </div>

                                        <div style={{
                                            background: '#f8fafc',
                                            padding: '1.5rem',
                                            borderRadius: '1.25rem',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                                <Info size={16} color="#3b82f6" />
                                                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Target file size (Advanced)</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 100"
                                                    value={maxSizeKb}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                                        setMaxSizeKb(val);
                                                        if (val !== '') setMode('target');
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.75rem 1rem',
                                                        borderRadius: '0.75rem',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '1rem',
                                                        outline: 'none',
                                                        transition: 'border-color 0.2s'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                                />
                                                <span style={{ fontWeight: 600, color: '#64748b' }}>KB</span>
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>
                                                The tool will automatically adjust quality and dimensions to fit under this size.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleProcess}
                                        disabled={status === 'processing'}
                                        style={{
                                            width: '100%',
                                            background: status === 'processing' ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                            color: 'white',
                                            padding: '1.25rem',
                                            borderRadius: '1rem',
                                            fontWeight: 800,
                                            fontSize: '1.125rem',
                                            border: 'none',
                                            cursor: status === 'processing' ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 10px 15px -3px rgba(59,130,246,0.3)',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.75rem'
                                        }}
                                    >
                                        {status === 'processing' ? (
                                            <>
                                                <Loader2 size={24} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Process and Download'
                                        )}
                                    </button>
                                    {status === 'error' && (
                                        <p style={{ color: '#ef4444', marginTop: '1rem', fontWeight: 500 }}>
                                            An error occurred during processing. Please try again.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
