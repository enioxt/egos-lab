---
description: "Intent Refinery — Translate vague instructions into precise technical prompts"
auto_trigger: "When user gives vague/ambiguous instructions that need technical clarification"
---

# /pre — Intent Refinery (v2.0)

> **Auto-triggers:** When user intent is ambiguous or high-level

---

## Process

```
⚠️ AI AGENT: When receiving a vague instruction:

1. PARSE the user's intent:
   - What is the GOAL? (business outcome)
   - What is the SCOPE? (which files, which feature)
   - What are the CONSTRAINTS? (time, tech, budget)

2. TRANSLATE to technical spec:
   - List specific files to create/modify
   - Define inputs and outputs
   - Identify dependencies
   - Estimate effort (S/M/L)

3. VALIDATE — Ask yourself:
   - Can I execute this WITHOUT asking the user? → Do it
   - Do I need external info/access? → Use 🚨 External Action format
   - Is there genuine ambiguity? → Ask ONE specific question

4. OUTPUT: A clear task list that could be handed to any developer
```

## Anti-Patterns (NEVER DO)

- ❌ "Should I proceed?" → Just proceed
- ❌ "Which approach do you prefer?" → Pick the best one and explain why
- ❌ "Let me know if you want me to..." → Just do it
- ❌ Asking 5 questions at once → Ask max 1, infer the rest
