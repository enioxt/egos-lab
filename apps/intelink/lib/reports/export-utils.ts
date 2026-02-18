/**
 * Report Export Utilities
 * 
 * Generates PDF and DOCX exports from markdown reports.
 * 
 * @version 1.0.0
 * @updated 2025-12-14
 */

import jsPDF from 'jspdf';
import { 
    Document, 
    Paragraph, 
    TextRun, 
    HeadingLevel, 
    Table, 
    TableRow, 
    TableCell, 
    WidthType,
    AlignmentType,
    BorderStyle,
    Packer
} from 'docx';
import { saveAs } from 'file-saver';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportOptions {
    title: string;
    filename: string;
    author?: string;
    date?: Date;
}

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * Export markdown content to PDF
 */
export async function exportToPDF(
    markdownContent: string, 
    options: ExportOptions
): Promise<void> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Header
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('INTELINK - Sistema de Inteligência Policial', 20, 15);
    doc.text(new Date().toLocaleDateString('pt-BR'), 190, 15, { align: 'right' });
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(options.title.toUpperCase(), 20, 30);
    
    // Separator line
    doc.setDrawColor(0, 150, 200);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Content - Parse markdown and add to PDF
    const lines = markdownContent.split('\n');
    let yPosition = 45;
    const pageHeight = 280;
    const marginLeft = 20;
    const marginRight = 190;
    const lineHeight = 6;
    
    for (const line of lines) {
        // Check for page break
        if (yPosition > pageHeight) {
            doc.addPage();
            yPosition = 20;
        }
        
        // Parse line type
        if (line.startsWith('# ')) {
            // H1
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 100, 150);
            yPosition += 4;
            doc.text(line.replace('# ', ''), marginLeft, yPosition);
            yPosition += lineHeight + 4;
        } else if (line.startsWith('## ')) {
            // H2
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 80, 120);
            yPosition += 3;
            doc.text(line.replace('## ', ''), marginLeft, yPosition);
            yPosition += lineHeight + 2;
        } else if (line.startsWith('### ')) {
            // H3
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50, 50, 50);
            yPosition += 2;
            doc.text(line.replace('### ', ''), marginLeft, yPosition);
            yPosition += lineHeight + 1;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            // List item
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const text = '• ' + line.replace(/^[-*] /, '');
            const splitText = doc.splitTextToSize(text, marginRight - marginLeft - 10);
            doc.text(splitText, marginLeft + 5, yPosition);
            yPosition += splitText.length * lineHeight;
        } else if (line.startsWith('|')) {
            // Table row - simplified handling
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const cells = line.split('|').filter(c => c.trim());
            const cellWidth = (marginRight - marginLeft) / cells.length;
            cells.forEach((cell, i) => {
                const text = cell.trim().substring(0, 20);
                doc.text(text, marginLeft + (i * cellWidth), yPosition);
            });
            yPosition += lineHeight;
        } else if (line.startsWith('---') || line.startsWith('═')) {
            // Separator
            doc.setDrawColor(200, 200, 200);
            doc.line(marginLeft, yPosition, marginRight, yPosition);
            yPosition += 4;
        } else if (line.trim() === '') {
            // Empty line
            yPosition += 3;
        } else {
            // Normal text
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '');
            const splitText = doc.splitTextToSize(cleanLine, marginRight - marginLeft);
            doc.text(splitText, marginLeft, yPosition);
            yPosition += splitText.length * lineHeight;
        }
    }
    
    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Página ${i} de ${pageCount} | Documento gerado por INTELINK`,
            105, 
            290, 
            { align: 'center' }
        );
    }
    
    // Save
    doc.save(`${options.filename}.pdf`);
}

// ============================================================================
// DOCX EXPORT
// ============================================================================

/**
 * Export markdown content to DOCX
 */
export async function exportToDOCX(
    markdownContent: string, 
    options: ExportOptions
): Promise<void> {
    const lines = markdownContent.split('\n');
    const children: Paragraph[] = [];
    
    // Title
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: options.title.toUpperCase(),
                    bold: true,
                    size: 36,
                    color: '006496',
                }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    );
    
    // Subtitle with date
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Gerado em: ${(options.date || new Date()).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}`,
                    italics: true,
                    size: 20,
                    color: '666666',
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
        })
    );
    
    // Parse markdown content
    for (const line of lines) {
        if (line.startsWith('# ')) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: line.replace('# ', ''),
                            bold: true,
                            size: 32,
                            color: '006496',
                        }),
                    ],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 },
                })
            );
        } else if (line.startsWith('## ')) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: line.replace('## ', ''),
                            bold: true,
                            size: 28,
                            color: '005078',
                        }),
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 },
                })
            );
        } else if (line.startsWith('### ')) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: line.replace('### ', ''),
                            bold: true,
                            size: 24,
                        }),
                    ],
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                })
            );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '• ' + line.replace(/^[-*] /, ''),
                            size: 22,
                        }),
                    ],
                    indent: { left: 720 },
                    spacing: { after: 50 },
                })
            );
        } else if (line.startsWith('---') || line.startsWith('═')) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '─'.repeat(80),
                            color: 'CCCCCC',
                            size: 12,
                        }),
                    ],
                    spacing: { before: 200, after: 200 },
                })
            );
        } else if (line.startsWith('|') && !line.includes('---')) {
            // Table row - parse as regular text for simplicity
            const cells = line.split('|').filter(c => c.trim());
            if (cells.length > 0) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: cells.join(' | '),
                                size: 20,
                                font: 'Consolas',
                            }),
                        ],
                        spacing: { after: 50 },
                    })
                );
            }
        } else if (line.trim() === '') {
            children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
        } else if (!line.startsWith('╔') && !line.startsWith('║') && !line.startsWith('╚')) {
            // Normal text (skip ASCII art borders)
            const cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '');
            if (cleanLine.trim()) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: cleanLine,
                                size: 22,
                            }),
                        ],
                        spacing: { after: 100 },
                    })
                );
            }
        }
    }
    
    // Footer
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '─'.repeat(80),
                    color: 'CCCCCC',
                    size: 12,
                }),
            ],
            spacing: { before: 600 },
        })
    );
    
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Documento gerado automaticamente pelo INTELINK - Sistema de Inteligência Policial',
                    italics: true,
                    size: 18,
                    color: '999999',
                }),
            ],
            alignment: AlignmentType.CENTER,
        })
    );
    
    // Create document
    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }],
        creator: options.author || 'INTELINK',
        title: options.title,
        description: 'Relatório de Inteligência Policial',
    });
    
    // Generate and save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${options.filename}.docx`);
}

// ============================================================================
// MARKDOWN EXPORT (already exists, keeping for completeness)
// ============================================================================

/**
 * Export as markdown file
 */
export function exportToMarkdown(
    markdownContent: string, 
    options: ExportOptions
): void {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    saveAs(blob, `${options.filename}.md`);
}

export default {
    exportToPDF,
    exportToDOCX,
    exportToMarkdown,
};
