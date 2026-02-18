# 🏭 INTENT REFINERY

**Version:** 1.0.0 | **Status:** Beta Perpétuo | **Philosophy:** "Never 100%"

---

## O QUE É ISTO?

A Refinaria de Intenção é uma camada de tradução entre **linguagem natural do usuário** e **especificações técnicas precisas**.

Ela resolve o problema: *"Eu sei o que quero, mas não sei como pedir tecnicamente."*

---

## ARQUITETURA

```
┌─────────────────────────────────────────────────────────┐
│                    INPUT DO USUÁRIO                     │
│         "O negócio de salvar não tá funcionando"        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              LAYER 1: CLASSIFIER                        │
│  Detecta: É um BUG (confidence: 0.85)                   │
│  Missing: Local específico, passos para reproduzir      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              LAYER 2: INTERROGATOR                      │
│  Ativa: interrogators/bug.md                            │
│  Pergunta: "Onde exatamente? Frontend ou API?"          │
│  Pergunta: "O que aparece na tela?"                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              LAYER 3: COMPILER                          │
│  Gera: Prompt técnico com 7 seções obrigatórias         │
│  Enriquece: Contexto de código, RLS, Edge Cases         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              LAYER 4: WORKFLOW /prompt                  │
│  Executa: Gates G1-G7, Evaluator, Sequential Thinking   │
└─────────────────────────────────────────────────────────┘
```

---

## ARQUIVOS

| Arquivo | Função |
|---------|--------|
| `classifier.md` | Classifica a intenção (FEATURE/BUG/REFACTOR/KNOWLEDGE) |
| `compiler.md` | Compila respostas em prompt técnico |
| `state.json` | Persiste estado entre turnos de conversa |
| `user_profile.json` | **NOVO** Perfil e vocabulário do usuário |
| `vocabulary_learner.md` | **NOVO** Protocolo de aprendizado |
| `telemetry_integration.md` | **NOVO** Integração com telemetria |
| `interrogators/feature.md` | Perguntas para novas features |
| `interrogators/bug.md` | Perguntas para diagnóstico de bugs |
| `interrogators/refactor.md` | Perguntas para refatorações |
| `interrogators/knowledge.md` | Perguntas para esclarecimentos |
| `tests/scenarios.md` | **NOVO** Cenários de teste |

---

## COMO USAR

### Ativação Automática
O sistema é ativado automaticamente quando o agente detecta:
- Linguagem vaga ou ambígua
- Falta de especificação técnica
- Confidence < 0.7 na classificação de intent

### Ativação Manual
```
/refine [sua ideia em linguagem natural]
```

---

## PRINCÍPIOS

1. **Dúvida é Feature:** Se não tiver certeza, pergunte.
2. **Mínima Fricção:** Máximo 3 perguntas por ciclo.
3. **Transparência:** Sempre mostrar o confidence score.
4. **Evolução:** Cada interação melhora o sistema.
5. **Aprendizado:** O sistema aprende sua forma de falar.

---

## SISTEMA DE APRENDIZADO

A Refinaria aprende continuamente como você se comunica:

### O Que Aprende
- **Expressões idiomáticas:** "o negócio de", "tá uma bagunça"
- **Indicadores de urgência:** Como você expressa P0/P1/P2
- **Termos técnicos:** Quais conhece, quais precisa traduzir
- **Padrões de sucesso:** O que funcionou bem

### Como Funciona
1. Cada interação é registrada
2. Expressões repetidas são detectadas
3. Correções viram aprendizado
4. Perfil é atualizado automaticamente

### Arquivos de Aprendizado
- `user_profile.json` → Seu vocabulário pessoal
- `state.json` → Sessão atual + histórico
- Memory MCP → Persistência longa

---

**Sacred Code:** 000.111.369.963.1618
