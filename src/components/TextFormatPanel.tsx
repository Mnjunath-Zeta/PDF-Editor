import React, { useState, useEffect } from 'react';
import { Type, Palette, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';

export const TextFormatPanel: React.FC = () => {
    const { selectedAnnotationId, annotations, updateAnnotation } = useEditorStore();

    const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId);

    const [fontSize, setFontSize] = useState(16);
    const [color, setColor] = useState('#000000');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
    const [backgroundColor, setBackgroundColor] = useState('transparent');
    const [opacity, setOpacity] = useState(1);
    const [fontFamily, setFontFamily] = useState('Helvetica');
    const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
    const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
    const [textDecoration, setTextDecoration] = useState<'none' | 'underline'>('none');
    const [showFontMenu, setShowFontMenu] = useState(false);

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const panelRef = React.useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Popular fonts that work well in PDFs
    const popularFonts = [
        'Helvetica',
        'Times-Roman',
        'Courier',
        'Arial',
        'Georgia',
        'Verdana',
        'Trebuchet MS',
        'Comic Sans MS',
        'Impact'
    ];

    useEffect(() => {
        if (selectedAnnotation && selectedAnnotation.type === 'text') {
            setFontSize(selectedAnnotation.fontSize || 16);
            setColor(selectedAnnotation.color || '#000000');
            setTextAlign(selectedAnnotation.textAlign || 'left');
            setBackgroundColor(selectedAnnotation.backgroundColor || 'transparent');
            setOpacity(selectedAnnotation.opacity !== undefined ? selectedAnnotation.opacity : 1);
            setOpacity(selectedAnnotation.opacity !== undefined ? selectedAnnotation.opacity : 1);
            setFontFamily(selectedAnnotation.fontFamily || 'Helvetica');
            setFontWeight(selectedAnnotation.fontWeight || 'normal');
            setFontStyle(selectedAnnotation.fontStyle || 'normal');
            setTextDecoration(selectedAnnotation.textDecoration || 'none');
        }
    }, [selectedAnnotation]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only drag if clicking on the panel itself, not on inputs/buttons
        if ((e.target as HTMLElement).closest('button, input, select')) return;

        setIsDragging(true);
        // Calculate the initial offset so the panel doesn't jump to the mouse position
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

            // Boundary checks (keep panel within viewport)
            const margin = 10;
            const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 200) - margin;
            const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 50) - margin;

            setPosition({
                x: Math.min(Math.max(margin, newX), maxX),
                y: Math.min(Math.max(margin, newY), maxY)
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    if (!selectedAnnotationId || !selectedAnnotation || selectedAnnotation.type !== 'text') {
        return null;
    }

    const handleFontSizeChange = (newSize: number) => {
        setFontSize(newSize);
        updateAnnotation(selectedAnnotation.id, { fontSize: newSize });
    };

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        updateAnnotation(selectedAnnotation.id, { color: newColor });
    };

    const handleAlignmentChange = (align: 'left' | 'center' | 'right') => {
        setTextAlign(align);
        updateAnnotation(selectedAnnotation.id, { textAlign: align });
    };

    const handleBackgroundColorChange = (newBgColor: string) => {
        setBackgroundColor(newBgColor);
        updateAnnotation(selectedAnnotation.id, { backgroundColor: newBgColor });
    };

    const handleOpacityChange = (newOpacity: number) => {
        setOpacity(newOpacity);
        updateAnnotation(selectedAnnotation.id, { opacity: newOpacity });
    };

    const handleFontFamilyChange = (newFont: string) => {
        setFontFamily(newFont);
        updateAnnotation(selectedAnnotation.id, { fontFamily: newFont });
    };

    const toggleBold = () => {
        const newWeight = fontWeight === 'bold' ? 'normal' : 'bold';
        setFontWeight(newWeight);
        updateAnnotation(selectedAnnotation.id, { fontWeight: newWeight });
    };

    const toggleItalic = () => {
        const newStyle = fontStyle === 'italic' ? 'normal' : 'italic';
        setFontStyle(newStyle);
        updateAnnotation(selectedAnnotation.id, { fontStyle: newStyle });
    };

    const toggleUnderline = () => {
        const newDecor = textDecoration === 'underline' ? 'none' : 'underline';
        setTextDecoration(newDecor);
        updateAnnotation(selectedAnnotation.id, { textDecoration: newDecor });
    };


    return (
        <div
            ref={panelRef}
            onMouseDown={!isMobile ? handleMouseDown : undefined}
            style={{
                position: 'fixed',
                // Default to top left if not moved
                top: isMobile ? 'auto' : (position.y !== 0 ? position.y : 160),
                left: isMobile ? 0 : (position.x !== 0 ? position.x : 20),
                bottom: isMobile ? 0 : 'auto',
                width: isMobile ? '100%' : '200px',
                transform: 'none',
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: isMobile ? '16px 16px 0 0' : 'var(--radius-md)',
                padding: isMobile ? '12px' : '1rem',
                maxHeight: isMobile ? '45vh' : '80vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                alignItems: 'stretch',
                zIndex: 1000,
                minWidth: '240px',
                maxWidth: '280px',
                cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                userSelect: 'none'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <Type size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Text Format</span>
            </div>

            {/* Font Size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Type size={16} color="var(--color-text-secondary)" />
                <input
                    type="number"
                    min="8"
                    max="72"
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                    style={{
                        width: '60px',
                        padding: '0.25rem 0.5rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem'
                    }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>px</span>
            </div>

            {/* Font Family */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                <button
                    onClick={() => setShowFontMenu(!showFontMenu)}
                    title="Font Family - Click to open"
                    style={{
                        padding: '0.25rem 0.5rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontFamily: fontFamily,
                        minWidth: '120px',
                        textAlign: 'left',
                        background: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <span>{fontFamily}</span>
                    <span style={{ fontSize: '0.6rem' }}>▼</span>
                </button>

                {showFontMenu && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '0.25rem',
                            background: 'white',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            zIndex: 1000,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            minWidth: '150px'
                        }}
                    >
                        {popularFonts.map(font => (
                            <div
                                key={font}
                                onClick={() => {
                                    handleFontFamilyChange(font);
                                    setShowFontMenu(false);
                                }}
                                style={{
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    fontFamily: font,
                                    background: fontFamily === font ? '#eff6ff' : 'transparent',
                                    borderBottom: '1px solid #f1f5f9'
                                }}
                            >
                                {font}
                            </div>
                        ))}
                    </div>
                )}
            </div>



            {/* Font Styling (Bold, Italic, Underline) */}
            <div style={{ display: 'flex', gap: '0.25rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--color-border)' }}>
                <button
                    onClick={toggleBold}
                    title="Bold"
                    style={{
                        padding: '0.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: fontWeight === 'bold' ? '#eff6ff' : 'transparent',
                        color: fontWeight === 'bold' ? 'var(--color-primary)' : 'var(--color-text)',
                        border: fontWeight === 'bold' ? '1px solid var(--color-primary)' : '1px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    <Bold size={16} />
                </button>
                <button
                    onClick={toggleItalic}
                    title="Italic"
                    style={{
                        padding: '0.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: fontStyle === 'italic' ? '#eff6ff' : 'transparent',
                        color: fontStyle === 'italic' ? 'var(--color-primary)' : 'var(--color-text)',
                        border: fontStyle === 'italic' ? '1px solid var(--color-primary)' : '1px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    <Italic size={16} />
                </button>
                <button
                    onClick={toggleUnderline}
                    title="Underline"
                    style={{
                        padding: '0.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: textDecoration === 'underline' ? '#eff6ff' : 'transparent',
                        color: textDecoration === 'underline' ? 'var(--color-primary)' : 'var(--color-text)',
                        border: textDecoration === 'underline' ? '1px solid var(--color-primary)' : '1px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    <Underline size={16} />
                </button>
            </div>

            {/* Text Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Palette size={16} color="var(--color-text-secondary)" />
                <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    title="Text Color"
                    style={{
                        width: '40px',
                        height: '28px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                    }}
                />
            </div>

            {/* Text Alignment */}
            <div style={{ display: 'flex', gap: '0.25rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--color-border)' }}>
                {[
                    { align: 'left' as const, icon: AlignLeft, label: 'Align Left' },
                    { align: 'center' as const, icon: AlignCenter, label: 'Align Center' },
                    { align: 'right' as const, icon: AlignRight, label: 'Align Right' }
                ].map(({ align, icon: Icon, label }) => (
                    <button
                        key={align}
                        onClick={() => handleAlignmentChange(align)}
                        title={label}
                        style={{
                            padding: '0.25rem',
                            borderRadius: 'var(--radius-md)',
                            background: textAlign === align ? '#eff6ff' : 'transparent',
                            color: textAlign === align ? 'var(--color-primary)' : 'var(--color-text)',
                            border: textAlign === align ? '1px solid var(--color-primary)' : '1px solid transparent',
                            cursor: 'pointer'
                        }}
                    >
                        <Icon size={16} />
                    </button>
                ))}
            </div>

            {/* Background Color */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>BG:</span>
                <input
                    type="color"
                    value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    title="Background Color"
                    style={{
                        width: '40px',
                        height: '28px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                    }}
                />
                <button
                    onClick={() => handleBackgroundColorChange('transparent')}
                    title="Remove Background"
                    style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: backgroundColor === 'transparent' ? '#eff6ff' : 'white',
                        cursor: 'pointer'
                    }}
                >
                    None
                </button>
            </div>

            {/* Opacity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Opacity:</span>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => handleOpacityChange(Number(e.target.value))}
                    title={`Opacity: ${Math.round(opacity * 100)}%`}
                    style={{
                        width: '80px',
                        cursor: 'pointer'
                    }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', minWidth: '35px' }}>
                    {Math.round(opacity * 100)}%
                </span>
            </div>
        </div >
    );
};
