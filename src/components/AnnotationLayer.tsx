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
        scale, // Need scale to normalize coordinates
        defaultShapeColor,
        defaultShapeFillColor
    } = useEditorStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [currentShape, setCurrentShape] = useState<{ x: number, y: number, endX: number, endY: number } | null>(null);
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingImageRect, setPendingImageRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedAnnotationId, setDraggedAnnotationId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [alignmentGuides, setAlignmentGuides] = useState<{ type: 'vertical' | 'horizontal', position: number }[]>([]);

    // Filter annotations for this page
    const pageAnnotations = annotations.filter(a => a.page === pageNumber);

    const getRelativeCoords = (e: React.MouseEvent | React.TouchEvent | any) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent | any) => {
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
        } else if (selectedTool === 'draw') {
            setCurrentPath([{ x, y }]);
        }
    };

    const handleAnnotationMouseDown = (e: React.MouseEvent | React.TouchEvent | any, ann: any) => {
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

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent | any) => {
        const { x, y } = getRelativeCoords(e);

        // Handle dragging with Snapping
        if (isDragging && draggedAnnotationId) {
            const draggingAnn = annotations.find(a => a.id === draggedAnnotationId);
            if (!draggingAnn) return;

            let newX = (x - dragOffset.x) / scale;
            let newY = (y - dragOffset.y) / scale;

            // Alignment Logic
            const guides: { type: 'vertical' | 'horizontal', position: number }[] = [];
            const SNAP_DISTANCE = 8; // Pixel distance to snap

            if (containerRef.current) {
                const pageW = containerRef.current.offsetWidth / scale;
                const pageH = containerRef.current.offsetHeight / scale;
                const w = draggingAnn.width || 0;
                const h = draggingAnn.height || 0;

                // --- Vertical Snapping (X) ---
                const vCandidates = [
                    { val: 0, type: 'page' }, // Page Left
                    { val: pageW * 0.25, type: 'page' }, // 1/4
                    { val: pageW / 2, type: 'page' }, // Page Center
                    { val: pageW * 0.75, type: 'page' }, // 3/4
                    { val: pageW, type: 'page' }, // Page Right
                ];
                // Add other annotations
                pageAnnotations.forEach(other => {
                    if (other.id === draggedAnnotationId) return;
                    vCandidates.push({ val: other.x, type: 'item' });
                    if (other.width) {
                        vCandidates.push({ val: other.x + other.width, type: 'item' });
                        vCandidates.push({ val: other.x + other.width / 2, type: 'item' });
                    }
                });

                // Edges to check: Left (newX), Center (newX + w/2), Right (newX + w)
                let snappedX = false;
                // Check Left
                for (const cand of vCandidates) {
                    if (Math.abs(cand.val - newX) * scale < SNAP_DISTANCE) {
                        newX = cand.val;
                        guides.push({ type: 'vertical', position: cand.val });
                        snappedX = true;
                        break;
                    }
                }
                // Check Center
                if (!snappedX) {
                    for (const cand of vCandidates) {
                        if (Math.abs(cand.val - (newX + w / 2)) * scale < SNAP_DISTANCE) {
                            newX = cand.val - w / 2;
                            guides.push({ type: 'vertical', position: cand.val });
                            snappedX = true;
                            break;
                        }
                    }
                }
                // Check Right
                if (!snappedX) {
                    for (const cand of vCandidates) {
                        if (Math.abs(cand.val - (newX + w)) * scale < SNAP_DISTANCE) {
                            newX = cand.val - w;
                            guides.push({ type: 'vertical', position: cand.val });
                            snappedX = true;
                            break;
                        }
                    }
                }

                // --- Horizontal Snapping (Y) ---
                const hCandidates = [
                    { val: 0, type: 'page' },
                    { val: pageH * 0.25, type: 'page' }, // 1/4
                    { val: pageH / 2, type: 'page' },
                    { val: pageH * 0.75, type: 'page' }, // 3/4
                    { val: pageH, type: 'page' },
                ];
                pageAnnotations.forEach(other => {
                    if (other.id === draggedAnnotationId) return;
                    hCandidates.push({ val: other.y, type: 'item' });
                    if (other.height) {
                        hCandidates.push({ val: other.y + other.height, type: 'item' });
                        hCandidates.push({ val: other.y + other.height / 2, type: 'item' });
                    }
                });

                let snappedY = false;
                // Top
                for (const cand of hCandidates) {
                    if (Math.abs(cand.val - newY) * scale < SNAP_DISTANCE) {
                        newY = cand.val;
                        guides.push({ type: 'horizontal', position: cand.val });
                        snappedY = true;
                        break;
                    }
                }
                // Middle
                if (!snappedY) {
                    for (const cand of hCandidates) {
                        if (Math.abs(cand.val - (newY + h / 2)) * scale < SNAP_DISTANCE) {
                            newY = cand.val - h / 2;
                            guides.push({ type: 'horizontal', position: cand.val });
                            snappedY = true;
                            break;
                        }
                    }
                }
                // Bottom
                if (!snappedY) {
                    for (const cand of hCandidates) {
                        if (Math.abs(cand.val - (newY + h)) * scale < SNAP_DISTANCE) {
                            newY = cand.val - h;
                            guides.push({ type: 'horizontal', position: cand.val });
                            snappedY = true;
                            break;
                        }
                    }
                }
            }

            setAlignmentGuides(guides);
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
        } else if (selectedTool === 'draw') {
            setCurrentPath(prev => [...prev, { x, y }]);
        }
    };

    const handleMouseUp = () => {
        if (isDragging && draggedAnnotationId) {
            // Find the current position to commit to history
            const ann = annotations.find(a => a.id === draggedAnnotationId);
            if (ann) {
                // This call triggers history update
                updateAnnotation(draggedAnnotationId, { x: ann.x, y: ann.y });
            }
            setIsDragging(false);
            setDraggedAnnotationId(null);
            setAlignmentGuides([]);
            return;
        }

        if (!isDrawing) return;
        setIsDrawing(false);

        if (selectedTool === 'image' && currentRect && (Math.abs(currentRect.w) > 5 || Math.abs(currentRect.h) > 5)) {
            setPendingImageRect(currentRect);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset
                fileInputRef.current.click();
            }
            setCurrentRect(null);
            return;
        }

        if ((selectedTool === 'rect' || selectedTool === 'patch' || selectedTool === 'circle') && currentRect && (Math.abs(currentRect.w) > 5 || Math.abs(currentRect.h) > 5)) {
            const { defaultShapeColor, defaultShapeFillColor, defaultShapeStrokeWidth, defaultShapeStrokeStyle } = useEditorStore.getState();
            addAnnotation({
                id: nanoid(),
                type: selectedTool === 'patch' ? 'rect' : selectedTool,
                page: pageNumber,
                // Store Unscaled
                x: currentRect.x / scale,
                y: currentRect.y / scale,
                width: currentRect.w / scale,
                height: currentRect.h / scale,
                color: selectedTool === 'patch' ? 'white' : defaultShapeColor,
                fillColor: selectedTool === 'patch' ? 'white' : defaultShapeFillColor,
                strokeWidth: selectedTool === 'patch' ? 0 : defaultShapeStrokeWidth,
                strokeStyle: selectedTool === 'patch' ? 'solid' : defaultShapeStrokeStyle
            });
        } else if ((selectedTool === 'line' || selectedTool === 'arrow') && currentShape) {
            const { defaultShapeColor, defaultShapeStrokeWidth, defaultShapeStrokeStyle } = useEditorStore.getState();
            addAnnotation({
                id: nanoid(),
                type: selectedTool,
                page: pageNumber,
                x: currentShape.x / scale,
                y: currentShape.y / scale,
                endX: currentShape.endX / scale,
                endY: currentShape.endY / scale,
                color: defaultShapeColor,
                strokeWidth: defaultShapeStrokeWidth,
                strokeStyle: defaultShapeStrokeStyle
            });
        } else if (selectedTool === 'draw' && currentPath.length > 1) {
            const { defaultShapeColor, defaultShapeStrokeWidth } = useEditorStore.getState();
            addAnnotation({
                id: nanoid(),
                type: 'draw',
                page: pageNumber,
                x: 0, // Not used for draw (path covers it)
                y: 0,
                points: currentPath.map(p => ({ x: p.x / scale, y: p.y / scale })),
                color: defaultShapeColor,
                strokeWidth: defaultShapeStrokeWidth
            });
        }

        setCurrentRect(null);
        setCurrentShape(null);
        setCurrentPath([]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pendingImageRect) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            addAnnotation({
                id: nanoid(),
                type: 'image',
                page: pageNumber,
                x: pendingImageRect.x / scale,
                y: pendingImageRect.y / scale,
                width: pendingImageRect.w / scale,
                height: pendingImageRect.h / scale,
                image: dataUrl
            });
            setPendingImageRect(null);
        };
        reader.readAsDataURL(file);
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
                pointerEvents: 'all',
                touchAction: selectedTool === 'select' ? 'auto' : 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            {/* Alignment Guides */}
            {alignmentGuides.map((guide, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: guide.type === 'horizontal' ? guide.position * scale : 0,
                        left: guide.type === 'vertical' ? guide.position * scale : 0,
                        width: guide.type === 'horizontal' ? '100%' : '0px',
                        height: guide.type === 'vertical' ? '100%' : '0px',
                        borderLeft: guide.type === 'vertical' ? '2px dotted rgba(71, 85, 105, 0.6)' : 'none',
                        borderTop: guide.type === 'horizontal' ? '2px dotted rgba(71, 85, 105, 0.6)' : 'none',
                        zIndex: 100,
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Render Shapes (Lines, Arrows, Circles, Rects) using SVG for better control */}
            <svg style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
                zIndex: 1
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
                                style={{ pointerEvents: selectedTool === 'select' ? 'auto' : 'none', cursor: 'move', touchAction: 'none' }}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                                onTouchStart={(e) => handleAnnotationMouseDown(e, ann)}
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
                                style={{ pointerEvents: selectedTool === 'select' ? 'auto' : 'none', cursor: 'move', touchAction: 'none' }}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                                onTouchStart={(e) => handleAnnotationMouseDown(e, ann)}
                            />
                        );
                    }
                    if (ann.type === 'image' && ann.image) {
                        return (
                            <image
                                key={ann.id}
                                href={ann.image}
                                x={ann.x * scale}
                                y={ann.y * scale}
                                width={(ann.width || 0) * scale}
                                height={(ann.height || 0) * scale}
                                preserveAspectRatio="none"
                                style={{ pointerEvents: selectedTool === 'select' ? 'auto' : 'none', cursor: 'move', touchAction: 'none' }}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                                onTouchStart={(e) => handleAnnotationMouseDown(e, ann)}
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
                                style={{ pointerEvents: selectedTool === 'select' ? 'auto' : 'none', cursor: 'move', touchAction: 'none' }}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                                onTouchStart={(e) => handleAnnotationMouseDown(e, ann)}
                            />
                        );
                    }
                    if (ann.type === 'draw' && ann.points) {
                        return (
                            <polyline
                                key={ann.id}
                                points={ann.points.map((p: any) => `${p.x * scale},${p.y * scale}`).join(' ')}
                                stroke={ann.color || 'red'}
                                strokeWidth={(ann.strokeWidth || 2) * scale}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ pointerEvents: selectedTool === 'select' ? 'auto' : 'none', cursor: 'move' }}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                                onTouchStart={(e) => handleAnnotationMouseDown(e, ann)}
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
                        stroke={defaultShapeColor}
                        strokeWidth={2}
                        markerEnd={selectedTool === 'arrow' ? 'url(#arrowhead)' : undefined}
                    />
                )}
                {isDrawing && currentPath.length > 0 && selectedTool === 'draw' && (
                    <polyline
                        points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                        stroke={defaultShapeColor}
                        strokeWidth={2}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
                {isDrawing && currentRect && selectedTool === 'circle' && (
                    <ellipse
                        cx={currentRect.x + currentRect.w / 2}
                        cy={currentRect.y + currentRect.h / 2}
                        rx={Math.abs(currentRect.w / 2)}
                        ry={Math.abs(currentRect.h / 2)}
                        stroke={defaultShapeColor}
                        strokeWidth={2}
                        fill={defaultShapeFillColor === 'transparent' ? 'none' : defaultShapeFillColor}
                    />
                )}
                {isDrawing && currentRect && selectedTool === 'rect' && (
                    <rect
                        x={currentRect.x}
                        y={currentRect.y}
                        width={currentRect.w}
                        height={currentRect.h}
                        stroke={defaultShapeColor}
                        strokeWidth={2}
                        fill={defaultShapeFillColor === 'transparent' ? 'none' : defaultShapeFillColor}
                    />
                )}
                {isDrawing && currentRect && selectedTool === 'patch' && (
                    <rect
                        x={currentRect.x}
                        y={currentRect.y}
                        width={currentRect.w}
                        height={currentRect.h}
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5,5"
                        fill="rgba(255, 255, 255, 0.8)"
                    />
                )}
            </svg>

            {/* Render Text and White Rects (Patches) separately as they have different behaviors */}
            {pageAnnotations.map(ann => (
                <div
                    key={ann.id}
                    onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
                    onTouchStart={(e) => handleAnnotationMouseDown(e, ann)}
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
                        zIndex: ann.type === 'text' ? 2 : (ann.type === 'rect' && ann.color === 'white') ? 0 : 1,
                        display: (ann.type === 'text' || (ann.type === 'rect' && ann.color === 'white')) ? 'block' : 'none',
                        touchAction: 'none'
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
                                fontWeight: ann.fontWeight || 'normal',
                                fontStyle: ann.fontStyle || 'normal',
                                textDecoration: ann.textDecoration || 'none',
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

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>
    );
};
