# 🎯 SPRINT 40 - Mobile & UI Polish (Enterprise Grade)

**Data:** 2025-12-15
**Status:** PLANEJAMENTO
**Autor:** Análise consolidada de 3 feedbacks de teste

---

## 📋 Resumo Executivo

Este documento consolida **3 rodadas de feedback** de testes mobile e desktop.
O objetivo é elevar o Intelink ao nível "Enterprise/Palantir" com polish fino.

**Fontes de Feedback:**
1. Screencast 15-05-15.mp4 - Teste mobile inicial
2. Screencast 15-24-30.mp4 - Teste mobile avançado  
3. Prints (image_abd8c4.png, image_abd57c.jpg, investigacao.pdf, home.pdf, relatorios.pdf)

---

## 🏆 O QUE ESTÁ FUNCIONANDO (NÃO MEXER)

| Feature | Status | Observação |
|---------|--------|------------|
| Bottom Navigation Bar | ✅ Excelente | App parece nativo |
| Busca Global Rica | ✅ Excelente | Visualização de vínculos perfeita |
| Modais de Entidade | ✅ Bom | Rápido, bom contraste |
| Achados Investigativos | ✅ Excelente | Hierarquia visual correta |
| Lista de Vínculos | ✅ Excelente | Substituiu grafo com sucesso |
| Faixa Tática de Tempo | ✅ Bom | "Cold Case" badge profissional |
| Menu Overlay | ✅ Implementado | backdrop-blur-md aplicado |
| Skeleton Loading | ✅ Implementado | Páginas de redirect |

---

## 🔴 CATEGORIA 1: Vazamento de Dados Brutos (Data Leaks)

### Problema
Termos técnicos em inglês/snake_case aparecem na interface:
- `SUSPECT_IN`, `MEMBER_OF`, `FOUND_AT`, `KNOWS`
- Campos como `role`, `calibre` minúsculos
- Nomes de arquivo com prefixos numéricos (67-191)

### Tasks

| # | Task | Descrição | Arquivos Prováveis | Complexidade |
|:-:|:-----|:----------|:-------------------|:------------:|
| 1.1 | **Humanizar Vínculos** | Criar helper `humanizeRelationType()`: SUSPECT_IN → "Suspeito em", MEMBER_OF → "Membro de", etc | `lib/utils/formatters.ts` (novo) | Baixa |
| 1.2 | **Humanizar Labels** | Capitalizar campos: role → "Função", calibre → "Calibre" | Componentes de entidade | Baixa |
| 1.3 | **Limpar Nomes de Arquivo** | Criar `prettifyFilename()`: remove extensões, prefixos numéricos, substitui _ por espaço | `lib/utils/formatters.ts` | Baixa |
| 1.4 | **Aplicar em Lista de Vínculos** | Usar helpers nos chips de vínculo | `components/shared/` | Média |
| 1.5 | **Aplicar em Evidências** | Usar `prettifyFilename` na lista de documentos | `components/investigation/` | Baixa |

---

## 🔴 CATEGORIA 2: UX de Modais e Espaço

### Problema
- Modal de endereço confuso ("Nenhuma referência encontrada")
- Seção "Fontes de Pesquisa" ocupa tela inteira no mobile
- Seletor de operação em Vínculos é pequeno

### Tasks

| # | Task | Descrição | Arquivos Prováveis | Complexidade |
|:-:|:-----|:----------|:-------------------|:------------:|
| 2.1 | **Refatorar Modal Endereço** | Mudar mensagem para "Este endereço não aparece em outras operações", destacar botão Maps, altura auto | `components/shared/LocationModal.tsx` ou similar | Média |
| 2.2 | **Colapsar Fontes/IA** | Transformar seção em Accordion fechado por padrão: "📚 Fontes Externas & Assistente IA" | Página de investigação mobile | Média |
| 2.3 | **Drawer Seletor Operação** | Em `/central/vinculos` mobile: botão largo que abre Drawer com operações | `app/central/vinculos/page.tsx` | Alta |
| 2.4 | **Botões Vínculo Maiores** | Cards de alerta: botões em linha separada, grid-cols-2, touch-friendly (44px min) | `components/central/` | Média |

---

## 🔴 CATEGORIA 3: Padronização Visual (Design System)

### Problema
- Variações desnecessárias em headers
- Hierarquia de botões inconsistente (Primary/Secondary/Tertiary)
- Tipografia sem contraste suficiente
- Cores semânticas inconsistentes (Cold Case roxo vs gelo)

### Tasks

| # | Task | Descrição | Arquivos Prováveis | Complexidade |
|:-:|:-----|:----------|:-------------------|:------------:|
| 3.1 | **Limpar Header Mobile** | Remover título "INTELINK - Sistema..." do mobile home. Manter apenas busca/logo | `app/page.tsx` ou layout mobile | Baixa |
| 3.2 | **Padronizar Altura Header** | Todos inputs/botões do header = h-10 (40px) | CSS global ou componentes | Baixa |
| 3.3 | **Sistema de Botões** | Definir e aplicar 3 níveis: Primary (bg-blue-600), Secondary (bg-slate-800 border), Tertiary (text-slate-400) | Criar doc + aplicar | Média |
| 3.4 | **Botões Grafo/Relatórios** | Atualmente "ghost", mudar para Secondary (bg-slate-800) | `app/investigation/` | Baixa |
| 3.5 | **Tipografia Labels** | Labels: text-slate-500 text-xs uppercase font-semibold. Valores numéricos: font-mono | Modais de entidade | Média |
| 3.6 | **Cor Cold Case** | Mudar de roxo para Gelo (bg-slate-700 ou bg-cyan-950) | Componente de status | Baixa |
| 3.7 | **Seta Vínculos** | Apagar seta (→) nos chips: text-slate-600 para respiro visual | Componente de vínculo | Baixa |

---

## 🔴 CATEGORIA 4: Performance e Transições

### Problema
- Spinner em fundo preto "pisca" entre transições
- Indicadores de dev mode visíveis (Creating.../Compiling...)

### Tasks

| # | Task | Descrição | Arquivos Prováveis | Complexidade |
|:-:|:-----|:----------|:-------------------|:------------:|
| 4.1 | **Skeleton em Listas** | Lista de operações: 5 retângulos pulsantes durante loading | `app/central/` | Média |
| 4.2 | **Skeleton em Vínculos** | Esqueleto de cards de alerta | `app/central/vinculos/` | Média |
| 4.3 | **Ocultar Dev Indicators** | Garantir que "Creating..."/"Compiling..." não apareça em prod (verificar se é config Next.js) | `next.config.js` ou build | Baixa |

---

## 🔴 CATEGORIA 5: Mobile Specifics

### Problema
- Nomes de arquivo cortados/quebrando
- Ícone de Menu poderia ser foto do perfil

### Tasks

| # | Task | Descrição | Arquivos Prováveis | Complexidade |
|:-:|:-----|:----------|:-------------------|:------------:|
| 5.1 | **Truncate Nomes Arquivo** | Usar `truncate` CSS + ícone de tipo (PDF, DOC) à esquerda | Lista de evidências | Baixa |
| 5.2 | **Perfil no Menu** | Considerar trocar ícone Menu por foto mini do usuário (opcional - padrão moderno) | `MobileNavBar.tsx` | Baixa |

---

## 📊 Resumo de Tasks por Prioridade

### P0 - Crítico (Quebra experiência)
| Task | Descrição |
|------|-----------|
| 1.1 | Humanizar Vínculos (SUSPECT_IN → "Suspeito em") |
| 1.4 | Aplicar em Lista de Vínculos |
| 2.1 | Refatorar Modal Endereço |
| 3.3 | Sistema de Botões (Primary/Secondary/Tertiary) |

### P1 - Importante (Melhora significativa)
| Task | Descrição |
|------|-----------|
| 1.2 | Humanizar Labels |
| 1.3 | Limpar Nomes de Arquivo |
| 2.2 | Colapsar Fontes/IA em Accordion |
| 2.3 | Drawer Seletor Operação |
| 3.1 | Limpar Header Mobile |
| 3.5 | Tipografia Labels |
| 4.1 | Skeleton em Listas |

### P2 - Nice to Have (Polish fino)
| Task | Descrição |
|------|-----------|
| 1.5 | Aplicar prettifyFilename em Evidências |
| 2.4 | Botões Vínculo Maiores |
| 3.2 | Padronizar Altura Header |
| 3.4 | Botões Grafo/Relatórios → Secondary |
| 3.6 | Cor Cold Case → Gelo |
| 3.7 | Seta Vínculos mais apagada |
| 4.2 | Skeleton em Vínculos |
| 4.3 | Ocultar Dev Indicators |
| 5.1 | Truncate Nomes Arquivo |
| 5.2 | Perfil no Menu |

---

## 🔧 Arquivos Chave (LOCALIZAÇÕES EXATAS)

### 1. Humanização de Vínculos

**JÁ EXISTE helper parcial (extrair e expandir):**
```
components/intelink/InvestigationTimeline.tsx:158
→ RELATIONSHIP_TYPE_LABELS (já tem traduções, falta SUSPECT_IN, FOUND_AT, etc)
```

**Onde aplicar:**
```
components/intelink/FirearmModal.tsx:224 → relationship_type || 'Relacionado'
components/intelink/FirearmModal.tsx:254 → relationship_type || 'Local'
components/intelink/VehicleModal.tsx:82 → mapRelationship
components/intelink/PersonModal.tsx:122 → mapRelationship
components/shared/EntityDetailModal.tsx:316 → relationship_type
```

### 2. Modal de Endereço

```
components/intelink/LocationModal.tsx:427-433
→ Mensagem "Nenhuma referência encontrada para este endereço"
→ Ajustar texto e altura do modal
```

### 3. Fontes de Pesquisa (Accordion)

```
components/intelink/UrgencyIndicator.tsx:259-264
→ Seção "Fontes de Pesquisa" com RESEARCH_SOURCES
→ Transformar em Collapsible/Accordion
```

### 4. Seletor de Operação (Vínculos Mobile)

```
app/central/vinculos/page.tsx:538-543
→ <select> padrão
→ Em mobile, converter para botão + Drawer
```

### 5. Header/Title

```
app/layout.tsx:24 → metadata.title (NÃO MEXER)
app/dashboard/page.tsx:272 → Footer com título (considerar ocultar em mobile)
```

### 6. Cold Case Badge

```
Procurar por: "Cold Case" ou "cold-case" ou similar badge de status
→ Mudar cor de roxo para gelo (slate-700 ou cyan-950)
```

### 7. Mobile Components

```
components/mobile/MobileNavBar.tsx → já tem backdrop-blur-md
```

### 8. Dev Indicators

```
next.config.js → verificar se há config específica
→ Pode ser comportamento padrão do Turbopack em dev
→ Em PROD não deve aparecer (verificar build)
```

---

## ✅ Tasks Já Completadas (Sprint 39)

| Task | Status |
|------|--------|
| Skeleton Loading (redirect pages) | ✅ |
| Menu Backdrop Blur | ✅ |
| Dropdown Labels (documento) | ✅ |

---

## 📝 Notas para Implementação

1. **Ordem sugerida:** P0 primeiro, depois P1, depois P2
2. **Teste após cada mudança:** Mobile Chrome + Desktop
3. **Não quebrar:** Bottom Nav, Busca Global, Modais funcionais
4. **Commit frequente:** feat(ui): + descrição curta

---

*Documento gerado em 2025-12-15 15:40 BRT*
*Para execução por outro modelo/desenvolvedor*
