# Feature: Entity Synthesis (Síntese de Entidades)

## Visão Geral

O sistema Intelink possui uma feature de **síntese narrativa** que transforma dados de relacionamentos em texto narrativo, facilitando a compreensão rápida do perfil de uma entidade (pessoa, organização, veículo, etc).

A síntese é dividida em **dois graus de conexão**:

---

## 1️⃣ Conexões de 1º Grau (Síntese Narrativa)

### Componente: `EntityNarrativeSummary.tsx`

### O que faz:
Transforma os relacionamentos diretos de uma entidade em uma narrativa textual, como um investigador apresentando verbalmente o perfil.

### Exemplo de Output:
```
CARLOS ALBERTO SILVA [suspeito]
Casado(a) com ANA PAULA SILVA. Profissionalmente, sócio(a) de 
SILVA INVESTIMENTOS LTDA. Reside/frequenta: RUA AUGUSTA, 500.
Veículo(s) vinculado(s): ABC-1111. ⚠️ Aparece em 2 outra(s) operação(ões).
```

### Categorias de Relacionamentos:

| Categoria | Tipos | Exibição |
|-----------|-------|----------|
| **Cônjuge** | MARRIED_TO, CASADO_COM | "Casado(a) com [NOME]" |
| **Família** | SIBLING, IRMAO_DE, RELATIVE | "É irmão(ã) de [NOME]" |
| **Profissional** | SOCIO_DE, PARTNER, WORKS_AT | "Profissionalmente, sócio(a) de [EMPRESA]" |
| **Locais** | RESIDE_EM, RESIDES_AT | "Reside/frequenta: [LOCAL]" |
| **Veículos** | PROPRIETARIO, OWNS (VEHICLE) | "Veículo(s) vinculado(s): [PLACA]" |
| **Armas** | OWNS (WEAPON/FIREARM) | "⚠️ Arma(s) vinculada(s): [ARMA]" |

### Regras:
- **Filiação (PAI/MÃE)**: NÃO vai para síntese, vai para "Dados Básicos"
- **Todos os nomes são clicáveis** → navegam para o modal daquela entidade
- **Cross-case warning**: Se a pessoa aparece em outras operações

### Fluxo Visual:
```
┌─────────────────────────────────────────────────┐
│ 🧠 SÍNTESE DA ENTIDADE                          │
│                                                 │
│ CARLOS ALBERTO SILVA [suspeito]                 │
│ Casado(a) com [ANA PAULA] ← clicável            │
│ Sócio(a) de [SILVA INVESTIMENTOS] ← clicável    │
│ Veículo(s): [ABC-1111] ← clicável               │
│                                                 │
│ [🔗 Ver Conexões Indiretas (2º grau) →]         │
└─────────────────────────────────────────────────┘
```

---

## 2️⃣ Conexões de 2º Grau (Indiretas)

### Componente: `IndirectConnectionsModal.tsx`
### API: `/api/entity/[id]/indirect`

### O que faz:
Busca as **conexões das conexões** - ou seja, as pessoas/entidades que estão conectadas às conexões diretas.

### Conceito "Mycelium":
Como a rede de fungos que se ramifica no subsolo, as conexões indiretas mostram a "teia" expandida de relacionamentos.

```
            [CARLOS]           ← Entidade central
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼    ← 1º Grau (conexões diretas)
  [ANA]    [EMPRESA]   [ABC-1111]
    │          │          │
  ┌─┼─┐      ┌─┼─┐      ┌─┼─┐  ← 2º Grau (conexões indiretas)
  ▼ ▼ ▼      ▼ ▼ ▼      ▼ ▼ ▼
[Maria]   [Pedro]    [Roberto]
[João]    [Local]    
[End.]
```

### Estrutura do Modal:
```
┌─────────────────────────────────────────────────────┐
│ 🔗 Conexões Indiretas (2º Grau)                     │
│    Conexões das conexões de CARLOS ALBERTO SILVA   │
│                                                     │
│    [8 conexões diretas] [15 conexões indiretas]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ via → 👤 ANA PAULA SILVA (casado com)              │
│    ├── 👤 MARIA SILVA (mãe de)                     │
│    ├── 👤 JOÃO SILVA (pai de)                      │
│    └── 📍 RUA DAS FLORES 123 (reside em)           │
│                                                     │
│ via → 🏢 SILVA INVESTIMENTOS LTDA (sócio de)       │
│    ├── 👤 PEDRO SOUZA (funcionário de)             │
│    └── 📍 AV PAULISTA 1000 (localizado em)         │
│                                                     │
│ via → 🚗 ABC-1111 (proprietário de)                │
│    └── 👤 ROBERTO JUNIOR (usuário de)              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Algoritmo:

```typescript
// 1. Buscar conexões diretas
const directRels = await supabase
    .from('intelink_relationships')
    .select('source_id, target_id, type')
    .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);

// 2. Para cada conexão direta, buscar suas conexões
const indirectRels = await supabase
    .from('intelink_relationships')
    .select('source_id, target_id, type')
    .or(directIds.map(id => `source_id.eq.${id},target_id.eq.${id}`).join(','));

// 3. Filtrar: remover a entidade original e as diretas
// 4. Agrupar por "via" (entidade intermediária)
```

---

## 🎨 Design Considerations

### Cores por Tipo de Entidade:
- 👤 **Pessoa**: `text-blue-400`
- 📍 **Local**: `text-emerald-400`
- 🚗 **Veículo**: `text-pink-400`
- 🏢 **Organização**: `text-red-400`
- 🔫 **Arma**: `text-rose-400`

### UX:
- Todos os nomes são **clicáveis** → navegam para o modal
- **Navegação em cascata**: pode navegar de entidade em entidade
- **Histórico de navegação**: botão "Voltar" mantém trilha
- **Loading states**: spinner enquanto carrega dados

---

## 📊 Estrutura de Dados

### Tabela: `intelink_entities`
```sql
id UUID PRIMARY KEY
name TEXT
type TEXT  -- PERSON, VEHICLE, LOCATION, ORGANIZATION, WEAPON
metadata JSONB
investigation_id UUID
```

### Tabela: `intelink_relationships`
```sql
id UUID PRIMARY KEY
source_id UUID REFERENCES intelink_entities(id)
target_id UUID REFERENCES intelink_entities(id)
type TEXT  -- CASADO_COM, FILHO_DE, SOCIO_DE, PROPRIETARIO, etc
```

---

## 📁 Arquivos Relevantes

```
apps/intelink/
├── components/shared/
│   ├── EntityDetailModal.tsx      # Modal principal de entidade
│   ├── EntityNarrativeSummary.tsx # Síntese de 1º grau
│   └── IndirectConnectionsModal.tsx # Modal de 2º grau
├── app/api/entity/[id]/
│   ├── related/route.ts           # API de conexões diretas
│   └── indirect/route.ts          # API de conexões indiretas (2º grau)
```

---

## 🚀 Próximos Passos (Melhorias Potenciais)

1. **3º Grau de Conexões**: Expandir ainda mais a teia
2. **Visualização em Grafo**: Link para página de grafo visual
3. **Análise de Centralidade**: Destacar entidades "ponte" (betweenness)
4. **Timeline**: Mostrar quando cada conexão foi identificada
5. **Força do Vínculo**: Peso/relevância de cada conexão
