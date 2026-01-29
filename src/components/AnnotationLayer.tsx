import React, { useRef, useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { nanoid } from 'nanoid';

interface AnnotationLayerProps {
    pageNumber: number;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ pageNumber }) => {
    const {
        selectedTool,
        addAnnotation,
        addAndSelectAnnotation,
        moveAnnotation,
        annotations,
        updateAnnotation,
        selectedAnnotationId,
        selectAnnotation,
        scale // Need scale to normalize coordinates
    } = useEditorStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [currentShape, setCurrentShape] = useState<{ x: number, y: number, endX: number, endY: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedAnnotationId, setDraggedAnnotationId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Filter annotations for this page
    const pageAnnotations = annotations.filter(a => a.page === pageNumber);

    const getRelativeCoords = (e: React.MouseEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getRelativeCoords(e);

        // If select tool and clicking on background (not handled by annotation), deselect
        if (selectedTool === 'select') {
            selectAnnotation(null);
            return;
        }

        // x, y are screen pixels. 
        setStartPos({ x, y });
        setIsDrawing(true);

        if (selectedTool === 'text') {
            try {
                const id = nanoid();
                // Store UN-SCALED coordinates (PDF points approx)
                addAndSelectAnnotation({
                    id,
                    type: 'text',
                    page: pageNumber,
                    x: x / scale,
                    y: y / scale,
                    content: 'Text',
                    fontSize: 16, // This is PDF points size
                    color: 'black'
                });
                setIsDrawing(false);
            } catch (err) {
                console.error("Error adding text box:", err);
            }
        } else if (selectedTool === 'rect' || selectedTool === 'patch' || selectedTool === 'circle' || selectedTool === 'image') {
            setCurrentRect({ x, y, w: 0, h: 0 });
        } else if (selectedTool === 'line' || selectedTool === 'arrow') {
            setCurrentShape({ x, y, endX: x, endY: y });
        }
    };

    const handleAnnotationMouseDown = (e: React.MouseEvent, ann: any) => {
        e.stopPropagation();

        if (selectedTool === 'select') {
            selectAnnotation(ann.id);
            const { x, y } = getRelativeCoords(e);
            setIsDragging(true);
            setDraggedAnnotationId(ann.id);
            // Calculate offset from annotation's top-left corner
            setDragOffset({
                x: x - (ann.x * scale),
                y: y - (ann.y * scale)
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y } = getRelativeCoords(e);

        // Handle dragging
        if (isDragging && draggedAnnotationId) {
            const newX = (x - dragOffset.x) / scale;
            const newY = (y - dragOffset.y) / scale;
            // Use moveAnnotation to update position without bloat history
            moveAnnotation(draggedAnnotationId, newX, newY);
            return;
        }

        if (!isDrawing) return;

        if (selectedTool === 'rect' || selectedTool === 'patch' || selectedTool === 'circle' || selectedTool === 'image') {
            // currentRect is for visual feedback, so keep in screen pixels
            const w = x - startPos.x;
            const h = y - startPos.y;
            setCurrentRect({ x: startPos.x, y: startPos.y, w, h });
        } else if (selectedTool === 'line' || selectedTool === 'arrow') {
            setCurrentShape({ x: startPos.x, y: startPos.y, endX: x, endY: y });
        }
    };

    const handleMouseUp = () => {
        // End dragging
        if (isDragging && draggedAnnotationId) {
            // Find the current position to commit to history
            const ann = annotations.find(a => a.id === draggedAnnotationId);
            if (ann) {
                // This call triggers history update
                updateAnnotation(draggedAnnotationId, { x: ann.x, y: ann.y });
            }
            setIsDragging(false);
            setDraggedAnnotationId(null);
            return;
        }

        if (!isDrawing) return;
        setIsDrawing(false);

        if ((selectedTool === 'rect' || selectedTool === 'patch' || selectedTool === 'circle') && currentRect && (Math.abs(currentRect.w) > 5 || Math.abs(currentRect.h) > 5)) {
            addAnnotation({
                id: nanoid(),
                type: selectedTool === 'patch' ? 'rect' : selectedTool,
                page: pageNumber,
                // Store Unscaled
                x: currentRect.x / scale,
                y: currentRect.y / scale,
                width: currentRect.w / scale,
                height: currentRect.h / scale,
                color: selectedTool === 'patch' ? 'white' : 'red',
                strokeWidth: selectedTool === 'patch' ? 0 : 2,
                strokeStyle: 'solid'
            });
        } else if ((selectedTool === 'line' || selectedTool === 'arrow') && currentShape) {
            addAnnotation({
                id: nanoid(),
                type: selectedTool,
                page: pageNumber,
                x: currentShape.x / scale,
                y: currentShape.y / scale,
                endX: currentShape.endX / scale,
                endY: currentShape.endY / scale,
                color: 'red',
                strokeWidth: 2,
                strokeStyle: 'solid'
            });
        }

        setCurrentRect(null);
        setCurrentShape(null);
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 10,
                cursor: selectedTool === 'select' ? 'default' : 'crosshair',
                pointerEvents: 'all'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Render Shapes (Lines, Arrows, Circles, Rects) using SVG for better control */}
            <svg style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible'
            }}>
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="red" />
                    </marker>
                </defs>

                {pageAnnotations.map(ann => {
                    const strokeStyleAttr = ann.strokeStyle === 'dashed' ? '5,5' : ann.strokeStyle === 'dotted' ? '2,2' : 'none';

                    if (ann.type === 'line' || ann.type === 'arrow') {
                        return (
                            <line
                                key={ann.id}
                                x1={ann.x * scale}
                                y1={ann.y * scale}
                                x2={(ann.endX || ann.x) * scale}
                                y2={(ann.endY || ann.y) * scale}
                                stroke={ann.color || 'red'}
                                strokeWidth={(ann.strokeWidth || 2) * scale}
                                strokeDasharray={strokeStyleAttr}
                                markerEnd={ann.type === 'arrow' ? 'url(#arrowhead)' : undefined}
                                style={{ pointerEvents: selectedTool === 'select' ? 'auto' : 'none', cursor: 'move' }}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                            />
                        );
                    }
                    if (ann.type === 'circle') {
                        return (
                            <ellipse
                                key={ann.id}
                                cx={(ann.x + (ann.width || 0) / 2) * scale}
                                cy={(ann.y + (ann.height || 0) / 2) * scale}
                                rx={Math.abs((ann.width || 0) / 2) * scale}
                                ry={Math.abs((ann.height || 0) / 2) * scale}
                                stroke={ann.color || 'red'}
                                strokeWidth={(ann.strokeWidth || 2) * scale}
                                strokeDasharray={strokeStyleAttr}
                                fill={ann.fillColor || 'transparent'}
                                style={{ pointerEvents: selectedTool === 'select' ? 'auto' : 'none', cursor: 'move' }}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                            />
                        );
                    }
                    if (ann.type === 'rect' && ann.color !== 'white') {
                        return (
                            <rect
                                key={ann.id}
                                x={ann.x * scale}
                                y={ann.y * scale}
                                width={(ann.width || 0) * scale}
                                height={(ann.height || 0) * scale}
                                stroke={ann.color || 'red'}
                                strokeWidth={(ann.strokeWidth || 2) * scale}
                                strokeDasharray={strokeStyleAttr}
                                fill={ann.fillColor || 'transparent'}
                                style={{ pointerEvents: selectedTool === 'select' ? 'auto' : 'none', cursor: 'move' }}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                            />
                        );
                    }
                    return null;
                })}

                {/* Previews for shapes being drawn */}
                {isDrawing && currentShape && (selectedTool === 'line' || selectedTool === 'arrow') && (
                    <line
                        x1={currentShape.x}
                        y1={currentShape.y}
                        x2={currentShape.endX}
                        y2={currentShape.endY}
                        stroke="red"
                        strokeWidth={2}
                        markerEnd={selectedTool === 'arrow' ? 'url(#arrowhead)' : undefined}
                    />
                )}
                {isDrawing && currentRect && selectedTool === 'circle' && (
                    <ellipse
                        cx={currentRect.x + currentRect.w / 2}
                        cy={currentRect.y + currentRect.h / 2}
                        rx={Math.abs(currentRect.w / 2)}
                        ry={Math.abs(currentRect.h / 2)}
                        stroke="red"
                        strokeWidth={2}
                        fill="rgba(255, 0, 0, 0.1)"
                    />
                )}
                {isDrawing && currentRect && selectedTool === 'rect' && (
                    <rect
                        x={currentRect.x}
                        y={currentRect.y}
                        width={currentRect.w}
                        height={currentRect.h}
                        stroke="red"
                        strokeWidth={2}
                        fill="rgba(255, 0, 0, 0.1)"
                    />
                )}
            </svg>

            {/* Render Text and White Rects (Patches) separately as they have different behaviors */}
            {pageAnnotations.map(ann => (
                <div
                    key={ann.id}
                    onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                    style={{
                        position: 'absolute',
                        left: ann.x * scale,
                        top: ann.y * scale,
                        width: ann.width ? Math.abs(ann.width * scale) : undefined,
                        height: ann.height ? Math.abs(ann.height * scale) : undefined,
                        border: (selectedAnnotationId === ann.id && (ann.type === 'text' || ann.type === 'rect')) ? '2px solid #3b82f6' : '1px dashed transparent',
                        backgroundColor: (ann.type === 'rect' && ann.color === 'white') ? 'white' : undefined,
                        cursor: selectedTool === 'select' ? 'move' : 'default',
                        userSelect: 'none',
                        // Allow clicks to pass through patches when not in select mode
                        pointerEvents: (ann.type === 'rect' && ann.color === 'white' && selectedTool !== 'select') ? 'none' : (ann.type === 'text' || (ann.type === 'rect' && ann.color === 'white')) ? 'auto' : 'none',
                        zIndex: ann.type === 'text' ? 2 : 1,
                        display: (ann.type === 'text' || (ann.type === 'rect' && ann.color === 'white')) ? 'block' : 'none'
                    }}
                >
                    {ann.type === 'text' && (
                        <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                const content = e.currentTarget.textContent || '';
                                setTimeout(() => {
                                    updateAnnotation(ann.id, { content });
                                }, 0);
                            }}
                            style={{
                                fontSize: `${(ann.fontSize || 16) * Math.max(0.1, scale)}px`,
                                color: ann.color || 'black',
                                whiteSpace: 'nowrap',
                                background: ann.backgroundColor || 'transparent',
                                outline: 'none',
                                fontFamily: ann.fontFamily || 'Helvetica',
                                textAlign: ann.textAlign || 'left',
                                opacity: ann.opacity !== undefined ? Math.max(0, Math.min(1, ann.opacity)) : 1,
                                padding: (ann.backgroundColor && ann.backgroundColor !== 'transparent') ? '2px 4px' : '0',
                                borderRadius: (ann.backgroundColor && ann.backgroundColor !== 'transparent') ? '2px' : '0',
                                minHeight: '1em',
                                minWidth: '10px'
                            }}
                        >
                            {ann.content}
                        </div>
                    )}
                </div>
            ))}

            {/* Render Draft Image Rect */}
            {currentRect && selectedTool === 'image' && (
                <div style={{
                    position: 'absolute',
                    left: currentRect.x,
                    top: currentRect.y,
                    width: currentRect.w,
                    height: currentRect.h,
                    border: '2px dashed blue',
                    backgroundColor: 'rgba(255, 255, 255, 0.5)'
                }} />
            )}
        </div>
    );
};
