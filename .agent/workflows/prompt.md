---
description: "Prompt creation: Architect → Evaluator → Optimizer"
auto_trigger: "When creating AI system prompts, chatbot prompts, or agent instructions"
---

# /prompt — Prompt Engineering Pipeline (v2.0)

> **Auto-triggers:** When building AI prompts for chatbots, agents, or system instructions

---

## Pipeline

### Phase 1: Architect
```
⚠️ AI AGENT:
1. Define the persona (who is the AI?)
2. Define the audience (who talks to it?)
3. Define capabilities (what can it DO?)
4. Define constraints (what it must NOT do)
5. Define tone (formal, casual, technical?)
6. Define escalation rules (when to hand off)
```

### Phase 2: Evaluator
```
Rate the prompt on:
1. Clarity (1-10): Can any LLM follow this?
2. Completeness (1-10): Are edge cases covered?
3. Safety (1-10): Can it be jailbroken easily?
4. Efficiency (1-10): Is it concise enough?

Minimum passing score: 7 average
```

### Phase 3: Optimizer
```
1. Remove redundant instructions
2. Add few-shot examples for complex behaviors
3. Structure with XML tags or markdown headers
4. Test with adversarial inputs mentally
5. Version the prompt (v1.0, v1.1...)
```
