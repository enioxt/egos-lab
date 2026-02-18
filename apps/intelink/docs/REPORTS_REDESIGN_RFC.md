# RFC: Redesign da Página de Relatórios - Intelink

**Versão:** 1.0.0  
**Data:** 2025-12-10  
**Status:** RFC (Request for Comments)

---

## 📋 Análise da Página Atual

### Estrutura Atual

A página `/reports` possui 4 abas:

| Aba | Descrição | Status |
|-----|-----------|--------|
| **Por Operação** | Lista operações para gerar relatório | ✅ Funcional |
| **Por Entidade** | Entidades agrupadas por nome | ✅ Funcional |
| **Gerados por IA** | Relatórios salvos | ✅ Funcional |
| **Relatórios Gerais** | Placeholder → Central | 🔶 Incompleto |

### Funcionalidades Existentes

1. **Templates Arkham** (`lib/reports/arkham-templates.ts`)
   - `entity_profile`: Perfil de entidade
   - `network_analysis`: Análise de rede
   - `timeline`: Cronologia
   - `risk_assessment`: Avaliação de risco
   - `executive_summary`: Sumário executivo
   - `full_investigation`: Relatório completo

2. **API de Geração** (`/api/reports/generate`)
   - Aceita `reportType` como parâmetro
   - Suporta `includeAiAnalysis`
   - Auto-save em `intelink_documents`

3. **Exportação**
   - PDF (jsPDF)
   - TXT
   - Markdown
   - Clipboard

---

## 🎯 Problemas Identificados

### 1. Aba "Relatórios Gerais" Vazia
- Apenas um link para Central
- Não usa as capacidades existentes

### 2. Falta Acesso Direto aos Tipos de Relatório
- Templates Arkham existem mas não são expostos na UI
- Usuário não pode escolher tipo específico

### 3. Falta Quick Actions
- Relatórios mais comuns deveriam ter acesso rápido
- Ex: "Resumo Executivo para Delegado"

### 4. Visualização do Relatório
- Preview é texto mono apenas
- Falta formatação visual

### 5. Falta Indicadores
- Quantos relatórios foram gerados?
- Qual operação tem mais relatórios?
- Relatórios recentes?

---

## 🚀 Proposta de Melhorias

### Fase 1: Quick Actions (Alto Impacto, Baixo Esforço)

Adicionar seção no topo com botões rápidos:

```jsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
  <QuickReportCard 
    icon={FileText} 
    label="Resumo Executivo" 
    sublabel="Para Delegado/Promotor"
    reportType="executive_summary"
  />
  <QuickReportCard 
    icon={Network} 
    label="Análise de Rede" 
    sublabel="Vínculos e conexões"
    reportType="network_analysis"
  />
  <QuickReportCard 
    icon={AlertTriangle} 
    label="Avaliação de Risco" 
    sublabel="Periculosidade"
    reportType="risk_assessment"
  />
  <QuickReportCard 
    icon={Clock} 
    label="Linha do Tempo" 
    sublabel="Cronologia"
    reportType="timeline"
  />
  <QuickReportCard 
    icon={User} 
    label="Perfil de Suspeito" 
    sublabel="Entidade única"
    reportType="entity_profile"
  />
  <QuickReportCard 
    icon={FileCheck} 
    label="Relatório Completo" 
    sublabel="Tudo incluído"
    reportType="full_investigation"
  />
</div>
```

### Fase 2: Seletor de Tipo no Modal

Ao clicar em "Gerar Relatório" de uma operação, mostrar modal com tipos:

```jsx
<div className="grid grid-cols-2 gap-3">
  {reportTypes.map(type => (
    <button 
      key={type.id}
      onClick={() => generateReport(inv.id, type.id)}
      className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-left"
    >
      <type.icon className="w-8 h-8 text-blue-400 mb-2" />
      <p className="font-medium">{type.label}</p>
      <p className="text-xs text-slate-400">{type.description}</p>
    </button>
  ))}
</div>
```

### Fase 3: Aba "Relatórios Gerais" Funcional

Substituir placeholder por relatórios reais:

| Tipo | Descrição | API |
|------|-----------|-----|
| **Panorama Geral** | Estatísticas de todas operações | `/api/reports/panorama` |
| **Cross-Case Summary** | Resumo de vínculos entre operações | `/api/reports/cross-case` |
| **Top 10 Entidades** | Pessoas mais conectadas | `/api/reports/top-entities` |
| **Mapa de Calor** | Concentração geográfica | `/api/reports/heatmap` |
| **Rho Global** | Saúde de todas as redes | `/api/rho/global` (já existe!) |

### Fase 4: Relatório Visual (Preview Melhorado)

Substituir mono text por componentes visuais:

```jsx
<div className="report-preview">
  {/* Header Institucional */}
  <ReportHeader investigation={investigation} />
  
  {/* Seções com ícones */}
  <ReportSection title="Resumo Executivo" icon={FileText}>
    {summary}
  </ReportSection>
  
  <ReportSection title="Entidades Envolvidas" icon={Users}>
    <EntityTable entities={entities} />
  </ReportSection>
  
  <ReportSection title="Análise de Rede" icon={Network}>
    <NetworkDiagram relationships={relationships} />
  </ReportSection>
  
  {/* Footer com QR Code */}
  <ReportFooter generatedAt={generatedAt} />
</div>
```

### Fase 5: Stats Dashboard

Adicionar cards de estatísticas no topo:

```jsx
<div className="grid grid-cols-4 gap-4 mb-6">
  <StatCard 
    label="Relatórios Gerados" 
    value={stats.totalReports} 
    trend="+12 esta semana"
  />
  <StatCard 
    label="Por IA" 
    value={stats.aiReports} 
    icon={Brain}
  />
  <StatCard 
    label="Exportados (PDF)" 
    value={stats.pdfExports} 
    icon={Download}
  />
  <StatCard 
    label="Última Geração" 
    value={stats.lastGenerated} 
    icon={Clock}
  />
</div>
```

---

## 📐 Especificações Técnicas

### Novos Componentes Necessários

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `QuickReportCard` | `components/reports/QuickReportCard.tsx` | Botão de ação rápida |
| `ReportTypeSelector` | `components/reports/ReportTypeSelector.tsx` | Modal seletor de tipo |
| `ReportPreviewVisual` | `components/reports/ReportPreviewVisual.tsx` | Preview formatado |
| `ReportStatsBar` | `components/reports/ReportStatsBar.tsx` | Dashboard de stats |

### Novas APIs Necessárias

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/reports/panorama` | GET | Estatísticas gerais |
| `/api/reports/stats` | GET | Métricas de uso de relatórios |

### Tabela de Telemetria

```sql
-- Já existe intelink_telemetry, adicionar eventos:
INSERT INTO telemetry_event_types VALUES 
  ('report_generated', 'Report generated'),
  ('report_exported_pdf', 'Report exported as PDF'),
  ('report_exported_txt', 'Report exported as TXT'),
  ('report_shared', 'Report shared');
```

---

## 📊 Priorização

| Fase | Impacto | Esforço | Prioridade |
|------|---------|---------|------------|
| 1. Quick Actions | Alto | Baixo | P0 |
| 2. Seletor de Tipo | Alto | Médio | P1 |
| 3. Aba Gerais | Médio | Médio | P1 |
| 4. Preview Visual | Médio | Alto | P2 |
| 5. Stats Dashboard | Baixo | Baixo | P2 |

---

## 🎯 Métricas de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Relatórios por semana | ~5 | 20+ |
| Tempo para gerar | 3 cliques | 1 clique |
| Exportações PDF | ~2 | 10+ |
| Uso aba "Gerais" | 0% | 30% |

---

## 📝 Changelog

| Data | Versão | Mudança |
|------|--------|---------|
| 2025-12-10 | 1.0.0 | Documento inicial |

---

*Documento criado por: Equipe Intelink*
*Aguardando aprovação para implementação*
