import React, { useState, useEffect } from 'react';
import { Maximize } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';

export const ShapeFormatPanel: React.FC = () => {
    const { selectedAnnotationId, annotations, updateAnnotation } = useEditorStore();
    const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId);

    const isShape = selectedAnnotation && ['line', 'arrow', 'rect', 'circle'].includes(selectedAnnotation.type);

    const [strokeColor, setStrokeColor] = useState('#ff0000');
    const [fillColor, setFillColor] = useState('transparent');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [strokeStyle, setStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const panelRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedAnnotation && isShape) {
            setStrokeColor(selectedAnnotation.color || '#ff0000');
            setFillColor(selectedAnnotation.fillColor || 'transparent');
            setStrokeWidth(selectedAnnotation.strokeWidth || 2);
            setStrokeStyle(selectedAnnotation.strokeStyle || 'solid');
        }
    }, [selectedAnnotation, isShape]);

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

    if (!isShape) return null;

    const colors = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
        '#ffff00', '#ff00ff', '#00ffff', '#f97316', '#84cc16'
    ];

    return (
        <div
            ref={panelRef}
            onMouseDown={handleMouseDown}
            style={{
                position: 'fixed',
                top: position.y !== 0 ? position.y : '140px',
                left: position.x !== 0 ? position.x : '50%',
                transform: position.x !== 0 ? 'none' : 'translateX(-50%)',
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '1rem',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                minWidth: '240px',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <Maximize size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Shape Properties</span>
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
                                updateAnnotation(selectedAnnotation.id, { color: c });
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
                            updateAnnotation(selectedAnnotation.id, { color: e.target.value });
                        }}
                        style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'none' }}
                    />
                </div>
            </div>

            {/* Fill Color (if applicable) */}
            {['rect', 'circle'].includes(selectedAnnotation.type) && (
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Fill Color</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            onClick={() => {
                                setFillColor('transparent');
                                updateAnnotation(selectedAnnotation.id, { fillColor: 'transparent' });
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
                                updateAnnotation(selectedAnnotation.id, { fillColor: e.target.value });
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
                            updateAnnotation(selectedAnnotation.id, { strokeWidth: val });
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
                            updateAnnotation(selectedAnnotation.id, { strokeStyle: val });
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
