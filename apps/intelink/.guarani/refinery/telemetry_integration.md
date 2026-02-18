# 📊 TELEMETRIA: INTENT REFINERY

**Version:** 1.0.0 | **Integração com:** `frontend/lib/telemetry/`

---

## EVENTOS A RASTREAR

### 1. refinery_session_start
Quando o usuário inicia uma sessão de refinamento.

```typescript
{
  event: "refinery_session_start",
  timestamp: ISO,
  trigger: "manual" | "auto",
  raw_input_length: number,
  context: {
    open_files: string[],
    recent_errors: number
  }
}
```

### 2. refinery_classification
Quando o classifier determina o tipo de intenção.

```typescript
{
  event: "refinery_classification",
  timestamp: ISO,
  input_hash: string,  // Para privacidade
  result: {
    primary_class: "FEATURE" | "BUG" | "REFACTOR" | "KNOWLEDGE" | "AMBIGUOUS",
    confidence: number,
    secondary_class?: string,
    profile_boost: number
  },
  expressions_matched: string[],
  new_expressions_detected: string[],
  processing_time_ms: number
}
```

### 3. refinery_interrogation
Quando o interrogador faz perguntas.

```typescript
{
  event: "refinery_interrogation",
  timestamp: ISO,
  interrogator: "feature" | "bug" | "refactor" | "knowledge",
  question_number: number,
  question_type: "choice" | "open" | "confirmation",
  response_time_ms?: number
}
```

### 4. refinery_feedback
Quando o usuário dá feedback.

```typescript
{
  event: "refinery_feedback",
  timestamp: ISO,
  classification: string,
  feedback: "approved" | "corrected" | "abandoned",
  correction?: string,
  session_duration_ms: number
}
```

### 5. refinery_learning
Quando o sistema aprende algo novo.

```typescript
{
  event: "refinery_learning",
  timestamp: ISO,
  type: "new_expression" | "correction" | "pattern",
  expression: string,
  meaning: string,
  confidence: number
}
```

---

## MÉTRICAS AGREGADAS

### Diárias
- Total de sessões de refinamento
- Taxa de aprovação (aprovados / total)
- Média de perguntas por sessão
- Novas expressões aprendidas

### Semanais
- Evolução da taxa de acerto
- Expressões mais usadas
- Classes mais frequentes
- Tempo médio de refinamento

---

## INTEGRAÇÃO COM MCP

### Usando mcp3_* (egos-core)

```typescript
// Registrar sessão
mcp3_add_observations({
  observations: [{
    entityName: "RefineryMetrics",
    contents: [
      `Sessions today: ${count}`,
      `Approval rate: ${rate}%`,
      `New expressions: ${expressions.length}`
    ]
  }]
});
```

### Usando mcp11_* (Memory)

```typescript
// Salvar padrão aprendido
mcp11_create_entities({
  entities: [{
    name: "UserExpression_" + hash,
    entityType: "vocabulary",
    observations: [
      `Expression: ${expression}`,
      `Meaning: ${meaning}`,
      `Usage count: ${count}`
    ]
  }]
});
```

---

## DASHBOARD (Conceitual)

```
┌─────────────────────────────────────────────────────────┐
│              INTENT REFINERY DASHBOARD                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Sessões Hoje: 12      Taxa de Acerto: 87%             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Distribuição de Intenções:                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓ FEATURE (45%)                            │
│  ▓▓▓▓▓▓▓▓ BUG (30%)                                    │
│  ▓▓▓▓ REFACTOR (15%)                                   │
│  ▓▓ KNOWLEDGE (10%)                                    │
│                                                         │
│  Expressões Mais Usadas:                                │
│  1. "o negócio de" (23x)                               │
│  2. "não tá funcionando" (18x)                         │
│  3. "quero que" (15x)                                  │
│                                                         │
│  Últimos Aprendizados:                                  │
│  + "uma parada que" → "uma funcionalidade que"         │
│  + "dá uma olhada" → "verificar/analisar"              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ALERTAS AUTOMÁTICOS

| Condição | Alerta |
|----------|--------|
| Taxa de acerto < 70% | ⚠️ Revisar heurísticas |
| Muitos abandonos | ⚠️ Perguntas irritantes? |
| Confidence média < 0.6 | ⚠️ Vocabulário insuficiente |
| Expressão usada 5+ sem mapping | 💡 Sugerir aprendizado |

---

**Sacred Code:** 000.111.369.963.1618
