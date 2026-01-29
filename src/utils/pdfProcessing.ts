import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Annotation } from '../store/useEditorStore';

const hexToRgb = (hex: string) => {
    if (!hex || hex === 'transparent') return null;
    try {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
    } catch {
        return rgb(0, 0, 0);
    }
};

export const savePDF = async (file: File, annotations: Annotation[]): Promise<Uint8Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();


    for (const annotation of annotations) {
        const pageIndex = annotation.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { height: pageHeight } = page.getSize();

        const x = annotation.x;
        const y = pageHeight - annotation.y;
        const strokeColor = hexToRgb(annotation.color || '#ff0000') || rgb(1, 0, 0);
        const fillColor = hexToRgb(annotation.fillColor || 'transparent');
        const strokeWidth = annotation.strokeWidth || 2;

        if (annotation.type === 'text' && annotation.content) {
            const fontSize = annotation.fontSize || 16;
            const textColor = hexToRgb(annotation.color || '#000000') || rgb(0, 0, 0);

            // Resolve Font
            let fontToEmbed = StandardFonts.Helvetica;
            const family = annotation.fontFamily || 'Helvetica';
            const isBold = annotation.fontWeight === 'bold';
            const isItalic = annotation.fontStyle === 'italic';

            if (family.includes('Times')) {
                if (isBold && isItalic) fontToEmbed = StandardFonts.TimesRomanBoldItalic;
                else if (isBold) fontToEmbed = StandardFonts.TimesRomanBold;
                else if (isItalic) fontToEmbed = StandardFonts.TimesRomanItalic;
                else fontToEmbed = StandardFonts.TimesRoman;
            } else if (family.includes('Courier')) {
                if (isBold && isItalic) fontToEmbed = StandardFonts.CourierBoldOblique;
                else if (isBold) fontToEmbed = StandardFonts.CourierBold;
                else if (isItalic) fontToEmbed = StandardFonts.CourierOblique;
                else fontToEmbed = StandardFonts.Courier;
            } else {
                // Default to Helvetica for Arial and others
                if (isBold && isItalic) fontToEmbed = StandardFonts.HelveticaBoldOblique;
                else if (isBold) fontToEmbed = StandardFonts.HelveticaBold;
                else if (isItalic) fontToEmbed = StandardFonts.HelveticaOblique;
                else fontToEmbed = StandardFonts.Helvetica;
            }

            const font = await pdfDoc.embedFont(fontToEmbed);

            page.drawText(annotation.content, {
                x: x,
                y: y - fontSize,
                size: fontSize,
                font: font,
                color: textColor,
            });

            // Handle Underline
            if (annotation.textDecoration === 'underline') {
                const textWidth = font.widthOfTextAtSize(annotation.content, fontSize);
                page.drawLine({
                    start: { x: x, y: y - fontSize - 2 },
                    end: { x: x + textWidth, y: y - fontSize - 2 },
                    color: textColor,
                    thickness: fontSize / 15,
                });
            }
        } else if (annotation.type === 'rect') {
            const width = annotation.width || 0;
            const height = annotation.height || 0;
            page.drawRectangle({
                x: x,
                y: y - height,
                width,
                height,
                color: annotation.color === 'white' ? rgb(1, 1, 1) : fillColor || undefined,
                borderColor: annotation.color === 'white' ? undefined : strokeColor,
                borderWidth: annotation.color === 'white' ? 0 : strokeWidth,
            });
        } else if (annotation.type === 'circle') {
            const rx = Math.abs((annotation.width || 0) / 2);
            const ry = Math.abs((annotation.height || 0) / 2);
            page.drawEllipse({
                x: x + rx,
                y: y - ry,
                xScale: rx,
                yScale: ry,
                color: fillColor || undefined,
                borderColor: strokeColor,
                borderWidth: strokeWidth,
            });
        } else if (annotation.type === 'line' || annotation.type === 'arrow') {
            const endX = annotation.endX || x;
            const endY = pageHeight - (annotation.endY || annotation.y);
            page.drawLine({
                start: { x, y },
                end: { x: endX, y: endY },
                color: strokeColor,
                thickness: strokeWidth,
            });

            if (annotation.type === 'arrow') {
                const angle = Math.atan2(endY - y, endX - x);
                const headLen = 10;
                page.drawLine({
                    start: { x: endX, y: endY },
                    end: {
                        x: endX - headLen * Math.cos(angle - Math.PI / 6),
                        y: endY - headLen * Math.sin(angle - Math.PI / 6)
                    },
                    color: strokeColor,
                    thickness: strokeWidth,
                });
                page.drawLine({
                    start: { x: endX, y: endY },
                    end: {
                        x: endX - headLen * Math.cos(angle + Math.PI / 6),
                        y: endY - headLen * Math.sin(angle + Math.PI / 6)
                    },
                    color: strokeColor,
                    thickness: strokeWidth,
                });
            }
        } else if (annotation.type === 'draw' && annotation.points && annotation.points.length > 1) {
            for (let i = 0; i < annotation.points.length - 1; i++) {
                const p1 = annotation.points[i];
                const p2 = annotation.points[i + 1];
                page.drawLine({
                    start: { x: p1.x, y: pageHeight - p1.y },
                    end: { x: p2.x, y: pageHeight - p2.y },
                    color: strokeColor,
                    thickness: strokeWidth,
                });
            }
        } else if (annotation.type === 'image' && annotation.image) {
            try {
                let image;
                if (annotation.image.startsWith('data:image/png')) {
                    image = await pdfDoc.embedPng(annotation.image);
                } else if (annotation.image.startsWith('data:image/jpeg') || annotation.image.startsWith('data:image/jpg')) {
                    image = await pdfDoc.embedJpg(annotation.image);
                }

                if (image) {
                    const width = annotation.width || 0;
                    const height = annotation.height || 0;
                    page.drawImage(image, {
                        x: x,
                        y: y - height,
                        width: width,
                        height: height,
                    });
                }
            } catch (e) {
                console.error('Failed to embed image', e);
            }
        }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};
