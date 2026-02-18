/**
 * PDF Report Generation API
 * 
 * GET /api/investigation/[id]/report/pdf
 * - Generates official PDF report with header/footer
 * - Formatted for judicial use
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { jsPDF } from 'jspdf';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    const { id: investigationId } = await params;
    const supabase = getSupabaseAdmin();

    try {
        // Fetch investigation data
        const { data: investigation, error: invError } = await supabase
            .from('intelink_investigations')
            .select(`
                id, title, description, status, created_at, updated_at,
                rho_score, rho_status,
                unit:intelink_units(name, code)
            `)
            .eq('id', investigationId)
            .single();

        if (invError || !investigation) {
            return NextResponse.json({ error: 'Investigação não encontrada' }, { status: 404 });
        }

        // Fetch entities
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, name, type, metadata')
            .eq('investigation_id', investigationId)
            .order('type');

        // Fetch relationships
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('id, type, metadata, source_id, target_id')
            .eq('investigation_id', investigationId);

        // Fetch Rho snapshot
        const { data: rhoSnapshot } = await supabase
            .from('intelink_rho_snapshots')
            .select('*')
            .eq('investigation_id', investigationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = 20;

        // Helper function for text wrapping
        const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number = 10) => {
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            y += lines.length * (fontSize * 0.4) + 2;
        };

        // Header
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('RELATÓRIO DE INTELIGÊNCIA POLICIAL', margin, 15);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const unit = investigation.unit as any;
        doc.text(`${unit?.code || 'INTELINK'} - ${unit?.name || 'Sistema de Inteligência'}`, margin, 25);
        
        doc.setFontSize(8);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin - 50, 25);

        y = 45;
        doc.setTextColor(0, 0, 0);

        // Investigation Info
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('1. IDENTIFICAÇÃO DA OPERAÇÃO', margin, y);
        y += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Título: ${investigation.title}`, margin, y); y += 6;
        doc.text(`Status: ${investigation.status?.toUpperCase() || 'EM ANDAMENTO'}`, margin, y); y += 6;
        doc.text(`ID: ${investigation.id}`, margin, y); y += 6;
        doc.text(`Criada em: ${new Date(investigation.created_at).toLocaleString('pt-BR')}`, margin, y); y += 10;

        if (investigation.description) {
            doc.setFont('helvetica', 'bold');
            doc.text('Descrição:', margin, y); y += 5;
            doc.setFont('helvetica', 'normal');
            addWrappedText(investigation.description, margin, pageWidth - 2 * margin, 9);
            y += 5;
        }

        // Rho Analysis
        if (rhoSnapshot || investigation.rho_score) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('2. ANÁLISE DE CENTRALIZAÇÃO (RHO)', margin, y);
            y += 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            const score = rhoSnapshot?.rho_score || investigation.rho_score || 0;
            const status = rhoSnapshot?.rho_status || investigation.rho_status || 'unknown';
            
            doc.text(`Score Rho: ${(score * 100).toFixed(2)}%`, margin, y); y += 6;
            doc.text(`Status: ${status.toUpperCase()}`, margin, y); y += 6;
            
            if (rhoSnapshot) {
                doc.text(`Entidades: ${rhoSnapshot.total_entities || 0}`, margin, y); y += 6;
                doc.text(`Vínculos: ${rhoSnapshot.total_relationships || 0}`, margin, y); y += 6;
            }
            
            // Risk interpretation
            let riskText = '';
            if (score < 0.01) riskText = 'BAIXO RISCO - Rede bem distribuída';
            else if (score < 0.05) riskText = 'RISCO MODERADO - Alguns pontos de concentração';
            else if (score < 0.1) riskText = 'ALTO RISCO - Centralização significativa';
            else riskText = 'RISCO CRÍTICO - Possível visão de túnel na investigação';
            
            doc.setFont('helvetica', 'bold');
            doc.text(`Interpretação: ${riskText}`, margin, y);
            y += 15;
        }

        // Entities Summary
        if (entities && entities.length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('3. ENTIDADES IDENTIFICADAS', margin, y);
            y += 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            // Group by type
            const byType: Record<string, typeof entities> = {};
            entities.forEach(e => {
                if (!byType[e.type]) byType[e.type] = [];
                byType[e.type].push(e);
            });

            const typeLabels: Record<string, string> = {
                PERSON: 'Pessoas',
                VEHICLE: 'Veículos',
                LOCATION: 'Locais',
                ORGANIZATION: 'Organizações',
                COMPANY: 'Empresas',
                PHONE: 'Telefones',
                FIREARM: 'Armas'
            };

            for (const [type, items] of Object.entries(byType)) {
                doc.setFont('helvetica', 'bold');
                doc.text(`${typeLabels[type] || type} (${items.length}):`, margin, y);
                y += 5;
                doc.setFont('helvetica', 'normal');
                
                items.slice(0, 10).forEach(entity => {
                    doc.text(`  • ${entity.name}`, margin, y);
                    y += 5;
                    
                    // Check page overflow
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                });
                
                if (items.length > 10) {
                    doc.text(`  ... e mais ${items.length - 10} ${typeLabels[type]?.toLowerCase() || 'itens'}`, margin, y);
                    y += 5;
                }
                y += 5;
            }
        }

        // Relationships Summary
        if (relationships && relationships.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('4. VÍNCULOS IDENTIFICADOS', margin, y);
            y += 10;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total de vínculos: ${relationships.length}`, margin, y);
            y += 10;
        }

        // Footer on each page
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFillColor(30, 41, 59);
            doc.rect(0, 282, pageWidth, 15, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text('DOCUMENTO GERADO PELO SISTEMA INTELINK - USO RESTRITO', margin, 290);
            doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, 290);
        }

        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer');

        // Return PDF
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="relatorio-${investigation.title.toLowerCase().replace(/\s+/g, '-')}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error('[Report PDF] Error:', error);
        return NextResponse.json({ error: error.message || 'Erro ao gerar PDF' }, { status: 500 });
    }
}
