import React, { useState, useEffect } from 'react';
import { Maximize, SlidersHorizontal, X } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';

export const ShapeFormatPanel: React.FC = () => {
    const {
        selectedAnnotationId,
        annotations,
        updateAnnotation,
        selectedTool,
        defaultShapeColor,
        defaultShapeFillColor,
        defaultShapeStrokeWidth,
        defaultShapeStrokeStyle,
        setDefaultShapeColor,
        setDefaultShapeFillColor,
        setDefaultShapeStrokeWidth,
        setDefaultShapeStrokeStyle
    } = useEditorStore();

    const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId);
    const isShapeSelected = selectedAnnotation && ['line', 'arrow', 'rect', 'circle'].includes(selectedAnnotation.type);
    const isShapeToolActive = ['line', 'arrow', 'rect', 'circle', 'draw'].includes(selectedTool);

    // Show panel if a shape is selected OR a shape tool is active
    const shouldShow = isShapeSelected || isShapeToolActive;

    const [strokeColor, setStrokeColor] = useState(defaultShapeColor);
    const [fillColor, setFillColor] = useState(defaultShapeFillColor);
    const [strokeWidth, setStrokeWidth] = useState(defaultShapeStrokeWidth);
    const [strokeStyle, setStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>(defaultShapeStrokeStyle);

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const panelRef = React.useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isExpanded, setIsExpanded] = useState(!isMobile);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setIsExpanded(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isShapeSelected) {
            // Editing existing shape
            setStrokeColor(selectedAnnotation.color || defaultShapeColor);
            setFillColor(selectedAnnotation.fillColor || defaultShapeFillColor);
            setStrokeWidth(selectedAnnotation.strokeWidth || defaultShapeStrokeWidth);
            setStrokeStyle(selectedAnnotation.strokeStyle || defaultShapeStrokeStyle);
        } else {
            // Setting defaults for new shapes
            setStrokeColor(defaultShapeColor);
            setFillColor(defaultShapeFillColor);
            setStrokeWidth(defaultShapeStrokeWidth);
            setStrokeStyle(defaultShapeStrokeStyle);
        }
    }, [selectedAnnotation, isShapeSelected, defaultShapeColor, defaultShapeFillColor, defaultShapeStrokeWidth, defaultShapeStrokeStyle]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, input, select')) return;
        setIsDragging(true);
        const currentX = position.x || 0;
        const currentY = position.y || 0;
        setDragStart({
            x: e.clientX - currentX,
            y: e.clientY - currentY
        });
    };

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e: MouseEvent) => {
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            const margin = 10;
            const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 200) - margin;
            const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 50) - margin;
            setPosition({
                x: Math.min(Math.max(margin, newX), maxX),
                y: Math.min(Math.max(margin, newY), maxY)
            });
        };
        const handleMouseUp = () => setIsDragging(false);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    if (!shouldShow) return null;

    if (isMobile && !isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    color: '#3b82f6'
                }}
            >
                <SlidersHorizontal size={24} />
            </button>
        );
    }

    const colors = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#f97316', '#84cc16'
    ];

    return (
        <div
            ref={panelRef}
            onMouseDown={!isMobile ? handleMouseDown : undefined}
            style={{
                position: 'fixed',
                top: isMobile ? 'auto' : (position.y !== 0 ? position.y : 160),
                left: isMobile ? 0 : (position.x !== 0 ? position.x : 20),
                bottom: isMobile ? 0 : 'auto',
                width: isMobile ? '100%' : '200px',
                transform: 'none',
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: isMobile ? '16px 16px 0 0' : 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: isMobile ? '12px' : '1rem',
                maxHeight: isMobile ? '45vh' : 'auto',
                overflowY: 'auto',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                minWidth: isMobile ? '100%' : '240px',
                cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                userSelect: 'none'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Maximize size={16} color="var(--color-primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {isShapeSelected ? 'Edit Shape' : 'Default Shape Style'}
                    </span>
                </div>
                {isMobile && (
                    <button onClick={() => setIsExpanded(false)} style={{ background: 'none', border: 'none', padding: '4px' }}>
                        <X size={20} color="#64748b" />
                    </button>
                )}
            </div>

            {/* Stroke Color */}
            <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Stroke Color</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                    {colors.map(c => (
                        <button
                            key={c}
                            onClick={() => {
                                setStrokeColor(c);
                                if (isShapeSelected && selectedAnnotation) {
                                    updateAnnotation(selectedAnnotation.id, { color: c });
                                } else {
                                    setDefaultShapeColor(c);
                                }
                            }}
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                background: c,
                                border: strokeColor === c ? '2px solid white' : '1px solid #e2e8f0',
                                boxShadow: strokeColor === c ? '0 0 0 2px var(--color-primary)' : 'none'
                            }}
                        />
                    ))}
                    <input
                        type="color"
                        value={strokeColor}
                        onChange={(e) => {
                            setStrokeColor(e.target.value);
                            if (isShapeSelected && selectedAnnotation) {
                                updateAnnotation(selectedAnnotation.id, { color: e.target.value });
                            } else {
                                setDefaultShapeColor(e.target.value);
                            }
                        }}
                        style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'none' }}
                    />
                </div>
            </div>

            {/* Fill Color (if applicable) */}
            {(isShapeSelected && selectedAnnotation && ['rect', 'circle'].includes(selectedAnnotation.type) || (!isShapeSelected && ['rect', 'circle'].includes(selectedTool))) && (
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Fill Color</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            onClick={() => {
                                setFillColor('transparent');
                                if (isShapeSelected && selectedAnnotation) {
                                    updateAnnotation(selectedAnnotation.id, { fillColor: 'transparent' });
                                } else {
                                    setDefaultShapeFillColor('transparent');
                                }
                            }}
                            style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                background: fillColor === 'transparent' ? '#eff6ff' : '#f1f5f9',
                                color: fillColor === 'transparent' ? 'var(--color-primary)' : '#64748b',
                                border: '1px solid #e2e8f0'
                            }}
                        >
                            None
                        </button>
                        <input
                            type="color"
                            value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                            onChange={(e) => {
                                setFillColor(e.target.value);
                                if (isShapeSelected && selectedAnnotation) {
                                    updateAnnotation(selectedAnnotation.id, { fillColor: e.target.value });
                                } else {
                                    setDefaultShapeFillColor(e.target.value);
                                }
                            }}
                            style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'none' }}
                        />
                    </div>
                </div>
            )}

            {/* Stroke Width & Style */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Width</label>
                    <select
                        value={strokeWidth}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setStrokeWidth(val);
                            if (isShapeSelected && selectedAnnotation) {
                                updateAnnotation(selectedAnnotation.id, { strokeWidth: val });
                            } else {
                                setDefaultShapeStrokeWidth(val);
                            }
                        }}
                        style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                    >
                        {[1, 2, 3, 4, 5, 8, 10].map(w => <option key={w} value={w}>{w}px</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Style</label>
                    <select
                        value={strokeStyle}
                        onChange={(e) => {
                            const val = e.target.value as any;
                            setStrokeStyle(val);
                            if (isShapeSelected && selectedAnnotation) {
                                updateAnnotation(selectedAnnotation.id, { strokeStyle: val });
                            } else {
                                setDefaultShapeStrokeStyle(val);
                            }
                        }}
                        style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                    >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
