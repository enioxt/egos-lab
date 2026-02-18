# 🧪 Checklist de Testes - Intelink

**Data:** 13/12/2025  
**Objetivo:** Verificar consistência entre banco de dados e frontend

---

## 📊 Top 10 Entidades para Teste

| # | Nome | Tipo | Conexões (DB) | Operação |
|---|------|------|---------------|----------|
| 1 | SILVA INVESTIMENTOS LTDA | ORGANIZATION | 8 | Operação Tsunami |
| 2 | CARLOS ALBERTO SILVA | PERSON | 7 | Operação Tsunami |
| 3 | Carlos Alberto Menezes | PERSON | 7 | Operação Centauro |
| 4 | OLIVEIRA IMPORTAÇÕES EIRELI | ORGANIZATION | 6 | Operação Tsunami |
| 5 | ANA PAULA SILVA | PERSON | 5 | Operação Tsunami |
| 6 | Márcia Almeida | PERSON | 5 | Operação Furacão |
| 7 | ENIO BATISTA | PERSON | 4 | Operação Teste Alpha |
| 8 | ROBERTO SILVA JUNIOR | PERSON | 4 | Operação Tsunami |
| 9 | TRANSPORTE RAPIDO SP LTDA | ORGANIZATION | 4 | Operação Tsunami |
| 10 | Paulo Rocha | PERSON | 4 | Operação Marte |

---

## ✅ Procedimento de Teste (para cada entidade)

### Passo 1: Busca Global (Cmd+K)

- [ ] Abrir GlobalSearch (Cmd+K ou ícone de busca)
- [ ] Digitar nome exato da entidade
- [ ] Verificar se aparece nos resultados
- [ ] **Esperado:** Entidade aparece com tipo correto

### Passo 2: Modal de Detalhes

- [ ] Clicar na entidade nos resultados
- [ ] Aguardar modal abrir
- [ ] **Verificar:** Número de conexões no rodapé do modal
- [ ] **Comparar:** Deve ser igual ou maior que o número no banco

### Passo 3: Página da Operação

- [ ] Navegar para a operação correspondente
- [ ] Localizar a entidade na lista de envolvidos
- [ ] Clicar para abrir modal
- [ ] **Verificar:** Mesmo número de conexões

### Passo 4: Grafo Visual

- [ ] Acessar `/graph/{investigation_id}`
- [ ] Localizar o nó da entidade
- [ ] Contar arestas (conexões visuais)
- [ ] **Comparar:** Deve corresponder ao número reportado

---

## 📋 Planilha de Resultados

### 1. SILVA INVESTIMENTOS LTDA (ORGANIZATION)

| Teste | Esperado | Obtido | Status |
|-------|----------|--------|--------|
| GlobalSearch encontra | Sim | | ⬜ |
| Modal abre | Sim | | ⬜ |
| Conexões no modal | 8 | | ⬜ |
| Conexões na página | 8 | | ⬜ |
| Conexões no grafo | 8 | | ⬜ |

### 2. CARLOS ALBERTO SILVA (PERSON)

| Teste | Esperado | Obtido | Status |
|-------|----------|--------|--------|
| GlobalSearch encontra | Sim | | ⬜ |
| Modal abre | Sim | | ⬜ |
| Conexões no modal | 7 | | ⬜ |
| Conexões na página | 7 | | ⬜ |
| Conexões no grafo | 7 | | ⬜ |

### 3. Carlos Alberto Menezes (PERSON)

| Teste | Esperado | Obtido | Status |
|-------|----------|--------|--------|
| GlobalSearch encontra | Sim | | ⬜ |
| Modal abre | Sim | | ⬜ |
| Conexões no modal | 7 | | ⬜ |
| Conexões na página | 7 | | ⬜ |
| Conexões no grafo | 7 | | ⬜ |

### 4. OLIVEIRA IMPORTAÇÕES EIRELI (ORGANIZATION)

| Teste | Esperado | Obtido | Status |
|-------|----------|--------|--------|
| GlobalSearch encontra | Sim | | ⬜ |
| Modal abre | Sim | | ⬜ |
| Conexões no modal | 6 | | ⬜ |
| Conexões na página | 6 | | ⬜ |
| Conexões no grafo | 6 | | ⬜ |

### 5. ANA PAULA SILVA (PERSON)

| Teste | Esperado | Obtido | Status |
|-------|----------|--------|--------|
| GlobalSearch encontra | Sim | | ⬜ |
| Modal abre | Sim | | ⬜ |
| Conexões no modal | 5 | | ⬜ |
| Conexões na página | 5 | | ⬜ |
| Conexões no grafo | 5 | | ⬜ |

---

## 🗺️ Mapa de Funcionalidades para Testar

```
INTELINK - Mapa de Testes
│
├── 🔍 BUSCA
│   ├── GlobalSearch (Cmd+K)
│   ├── Filtros por tipo
│   └── Histórico de buscas
│
├── 📊 VISUALIZAÇÃO
│   ├── Lista de entidades
│   ├── Modal de detalhes
│   ├── Grafo 2D (/graph/[id])
│   └── Grafo 3D (/graph/[id]/3d)
│
├── 📝 OPERAÇÕES
│   ├── Lista de operações
│   ├── Síntese auto-gerada
│   ├── Timeline/Histórico
│   └── Relatórios
│
├── 🔗 CONEXÕES
│   ├── Vínculos diretos
│   ├── Cross-case (entre operações)
│   └── Alertas de duplicidade
│
├── 📄 DOCUMENTOS
│   ├── Upload de PDF/DOC
│   ├── Extração automática
│   ├── Guardian AI review
│   └── Evidências
│
└── 🛠️ ADMIN
    ├── Membros da unidade
    ├── Permissões
    └── Qualidade de dados
```

---

## 🔄 Script de Re-verificação

Para gerar novos dados de teste:

```bash
npx tsx scripts/audit/check-top-connections.ts
```

---

*Documento gerado em 13/12/2025*
