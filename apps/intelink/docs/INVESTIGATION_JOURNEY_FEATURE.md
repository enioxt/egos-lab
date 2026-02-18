# Feature: Investigation Journey (Diário de Bordo Inteligente)

**Baseado em:** i2 Analyst's Notebook (Provenance), Palantir Gotham (Workflows)
**Versão:** 2.0 (Revisado com pesquisa de mercado)

## 1. Visão Geral (Concept)

O **Investigation Journey** é um sistema de **provenance tracking** que registra a "trilha de raciocínio" do investigador. Inspirado no conceito de "Provenance Information" do i2 Analyst's Notebook.

**Metáfora:** O "Fio de Ariadne" no labirinto da investigação criminal.

### O Problema
Investigadores abrem dezenas de entidades. Clicam em "Pai de X", depois "Carro de Y", depois "Endereço Z". No final:
- Não lembram como chegaram lá
- Podem ter passado por uma conexão crítica sem perceber
- Não há registro auditável do processo de raciocínio

### A Solução (Referência: i2 + Palantir)
1. **Provenance Tracking:** Cada passo registra FONTE e CONFIABILIDADE (como i2)
2. **Rastreador Always-On:** Widget flutuante (ícone Teia/Bússola) que grava cada passo
3. **Contexto de Investigação:** O usuário informa O QUE está procurando
4. **Síntese AI (Gemini 2.0):** Analisa conexões ignoradas e sugere leads
5. **Integração Chat:** Resultado enviável para Tsun-Cha para aprofundamento

---

## 2. UX/UI Flow

### A. O Widget "Pathfinder"
- **Localização:** Canto inferior direito (FAB - Floating Action Button) ou TopBar persistente.
- **Estado:**
  - 🔴 **Gravando:** "Rastreando linha de investigação (12 passos)"
  - 🟢 **Analisar:** "Gerar Síntese Inteligente"
- **Interação:**
  - **Hover:** Mostra tooltip com os últimos 3 passos.
  - **Click:** Abre o painel "Journey Report".

### B. Input de Contexto (O Gatilho)
Antes de gerar a síntese, o sistema pergunta:
> *"O que você está investigando?"*
> Input: "Homicídio em Patos de Minas, vítima homem trans, suspeita de veiculo prata."

### C. O Resultado (Journey Report)
Uma tela dividida:
1. **Esquerda (Timeline):** O caminho que o usuário fez (Entidade A → Entidade B → Carro C).
2. **Direita (Insights AI):**
   - *"Você passou por CARLOS (Passo 3). Ele tem um GOL PRATA registrado no nome da esposa, mas você não clicou nela."*
   - *"A conexão entre o Passo 2 e o Passo 8 é o Endereço X, que aparece em ambos."*

---

## 3. Arquitetura de Dados (v2.0 - Com Provenance)

### Reuso: Estender `useTelemetry` existente
**NÃO criar novo contexto.** Usar o hook `useTelemetry.ts` que já existe.

### Interface `JourneyStep` (Com Provenance - Inspirado i2)
```typescript
interface JourneyStep {
  timestamp: number;
  entityId: string;
  entityName: string;
  entityType: string;
  source: 'search' | 'click_relationship' | 'graph_nav' | 'document';
  
  // Provenance (i2 Analyst's Notebook)
  provenance: {
    sourceType: 'database' | 'document' | 'witness' | 'osint' | 'manual';
    reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'; // i2 6x6 rating
    documentRef?: string; // Referência ao documento fonte
  };
  
  // Navegação
  previousEntityId?: string; 
  relationshipType?: string; 
  
  // Snapshot das conexões visíveis (para IA identificar ignorados)
  visibleConnectionsSnapshot: {
    id: string;
    name: string;
    type: string;
    relationship: string;
  }[];
}

interface InvestigationJourney {
  id: string;
  userId: string;
  investigationId?: string;
  context?: string; // "Homicídio, Gol Prata, Patos de Minas"
  steps: JourneyStep[];
  createdAt: Date;
  aiAnalysis?: string; // Resultado do Gemini
}
```

### Persistência: Supabase (não localStorage)
**Tabela:** `intelink_journeys`
- Permite auditoria
- Sincroniza entre dispositivos
- Histórico permanente

### Fluxo de Processamento (Backend/AI)

1. **Coleta:** `useTelemetry` acumula passos em memória + batch para Supabase
2. **Enriquecimento:** API `/api/entity/[id]/indirect` busca 2º grau
3. **Prompt Engineering:**
   - Envia `JourneyStep[]` (O que eu vi)
   - Envia `Context` (O que eu procuro)
   - Envia `Mycelium` (Conexões 1º e 2º grau)
4. **Modelo:** OpenRouter → `google/gemini-2.0-flash-001` (janela longa, PAGO)
5. **Integração:** Botão "Enviar para Chat" manda resultado para Tsun-Cha

---

## 4. Integração com Mycelium (1º e 2º Grau)

O Journey usa a infraestrutura do Mycelium (`/api/entity/[id]/indirect`) para alimentar a IA.

- **Durante a navegação:** O sistema *silenciosamente* indexa os vizinhos das entidades visitadas.
- **Na análise:** A IA verifica se alguma conexão de 2º grau (Mycelium) conecta dois pontos distantes da jornada do usuário.

### Exemplo Prático:
1. Usuário busca **ENIO** (Passo 1).
2. Clica no pai **JOÃO** (Passo 2).
3. Clica no veículo **GM ASTRA** (Passo 3).
4. **Contexto:** "Gol Prata".

**Análise da IA:**
*"Atenção: No Passo 1 (ENIO), existia uma conexão de sócio com 'SILVA'. O 'SILVA' (que você não clicou) possui um 'GOL PRATA'. Esta é uma linha de investigação sugerida baseada no seu contexto."*

---

## 5. Implementação Técnica (Roadmap v2.0)

### Phase 1: Database + Types
- [ ] Criar tabela `intelink_journeys` no Supabase
- [ ] Definir tipos TypeScript em `lib/types/journey.ts`
- [ ] Estender `useTelemetry` com `trackJourneyStep()`

### Phase 2: UI Widget (FAB + Breadcrumb)
- [ ] Componente `JourneyFAB.tsx` (Floating Action Button)
  - Ícone: Teia (🕸️) ou Bússola
  - Badge com contador de passos
  - Hover: tooltip com últimos 3 passos
- [ ] Usar `shadcn/ui Breadcrumb` para timeline horizontal
- [ ] Integrar em `GlobalLayout`

### Phase 3: Data Harvest
- [ ] Capturar snapshot em `EntityDetailModal` (onOpen)
- [ ] Capturar snapshot em `GlobalSearch` (onSelect)
- [ ] Capturar snapshot no Grafo (onNodeClick)

### Phase 4: Intelligence API
- [ ] Rota `/api/intelligence/journey` (POST)
- [ ] Integração OpenRouter → Gemini 2.0 Flash
- [ ] Input de contexto antes da análise

### Phase 5: Report Modal + Chat
- [ ] Modal `JourneyReportModal.tsx` (timeline + insights)
- [ ] Botão "Enviar para Chat" → cria sessão com contexto
- [ ] Salvar jornadas na página `/history`

## 6. Componentes UI (shadcn/ui)

```tsx
// Breadcrumb para Timeline
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb"

<Breadcrumb>
  {journey.steps.map((step, i) => (
    <BreadcrumbItem key={i}>
      <BreadcrumbLink onClick={() => openEntity(step.entityId)}>
        {getIcon(step.entityType)} {step.entityName}
      </BreadcrumbLink>
    </BreadcrumbItem>
  ))}
</Breadcrumb>
```

## 7. Referências de Mercado

| Produto | Feature | O que Aprender |
|---------|---------|----------------|
| **i2 Analyst's Notebook** | Provenance Information | Rating 6x6, Source References |
| **Palantir Gotham** | Investigation Workflows | Cohorting, Tracks |
| **DataWalk** | Graph + AI | Visual link analysis |
| **Cognyte** | Knowledge Graph | Real-time discovery |

## 8. Métricas de Sucesso

- **Adoção:** % de investigações com jornada salva
- **Insights:** Nº de leads descobertos pela IA
- **Tempo:** Redução de tempo até encontrar conexão
