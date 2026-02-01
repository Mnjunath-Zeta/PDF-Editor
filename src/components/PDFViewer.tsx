import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useEditorStore } from '../store/useEditorStore';
import { motion } from 'framer-motion';
import { AnnotationLayer } from './AnnotationLayer';

// Set worker src to stable CDN version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export const PDFViewer: React.FC = () => {
    const { file, scale, setNumPages, currentPage, pages, initPages } = useEditorStore();
    const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);

    if (!file) return null;

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        initPages(numPages);
    };

    const onPageLoadSuccess = (page: any) => {
        setPageSize({ width: page.width, height: page.height });
    };

    // Map visual page to original PDF page
    const activePageConfig = pages[currentPage - 1];
    const displayPageNumber = activePageConfig ? activePageConfig.originalIndex + 1 : currentPage;
    const displayRotation = activePageConfig ? activePageConfig.rotation : 0;

    return (
        <div
            className="pdf-viewer-container"
            style={{
                display: 'flex',
                justifyContent: 'center',
                background: '#e2e8f0', // slate-200
                padding: '2rem',
                overflow: 'auto',
                height: '100%',
                position: 'relative'
            }}
        >
            <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        Loading PDF...
                    </div>
                }
                error={
                    <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
                        Failed to load PDF.
                    </div>
                }
            >
                <motion.div
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        marginBottom: '1rem',
                        position: 'relative' // Important for absolute positioning of annotation layer
                    }}
                >
                    <Page
                        pageNumber={displayPageNumber}
                        rotate={displayRotation}
                        scale={scale}
                        renderTextLayer={false} // Disable text selection for now to simplify tool interactions
                        renderAnnotationLayer={false} // We will implement our own annotation layer
                        canvasBackground="#ffffff"
                        onLoadSuccess={onPageLoadSuccess}
                    />
                    {pageSize && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%', // Page component sets dimensions, this should match
                            height: '100%',
                            pointerEvents: 'none' // Let events pass through wrapper, but AnnotationLayer should catch them if needed
                        }}>
                            {/* AnnotationLayer needs pointerEvents: all */}
                            <AnnotationLayer
                                pageNumber={displayPageNumber}
                            />
                        </div>
                    )}
                </motion.div>
            </Document>
        </div>
    );
};
