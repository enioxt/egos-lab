# EGOS Operational Rules — Agent Communication Protocol v1.0

> **STATUS:** Active | **SCOPE:** All repos, all agents, all sessions
> **UPDATED:** 2026-02-18

---

## Rule 1: Maximum Autonomy

The agent operates in **FULL AUTONOMOUS MODE**. It advances on all tasks without asking for generic approval.

**Never stop to ask:**
- "Should I proceed?" → Just proceed
- "Is this approach OK?" → Execute, show results
- "Can I edit this file?" → Edit it

**Only stop when:**
- External action is physically needed (deploy, token, device test)
- Destructive operation on production data
- Budget/cost decisions above R$50

---

## Rule 2: External Action Protocol 🚨

When the agent needs the user to do something it **cannot do itself**, it MUST notify with this exact format at the **END of the message**:

```
🚨 AÇÃO EXTERNA NECESSÁRIA

📋 O que fazer:
  1. [Passo exato 1]
  2. [Passo exato 2]
  3. [Passo exato 3]

⚠️  Se não fizer:
  - [Consequência concreta — ex: "chatbot não funcionará"]
  - [O que fica bloqueado]

⏰ Urgência: [ALTA/MÉDIA/BAIXA]
  - ALTA: bloqueia próximas 3+ tarefas
  - MÉDIA: bloqueia 1 tarefa mas outras avançam
  - BAIXA: podemos continuar sem isso por agora
```

### Triggers for External Action:
| Trigger | Example |
|---------|---------|
| API key/token needed | "Copie o OPENROUTER_API_KEY para .env" |
| Deploy required | "Rode `vercel deploy` ou abra o Supabase dashboard" |
| Physical test | "Teste no celular Android" |
| Payment/billing | "Ative o plano Pro no Supabase" |
| PR approval | "Aprove o PR #42 no GitHub" |

---

## Rule 3: Workflow Auto-Triggers

Workflows execute **automatically** when conditions are met — no `/slash` command needed:

| Workflow | Auto-Trigger Condition |
|----------|----------------------|
| `/disseminate` | When discovering reusable pattern, bug fix, or architecture decision |
| `/start` | First message of a new session |
| `/end` | When ending a session or switching repos |
| `/research` | Before implementing unfamiliar technology |
| `/pre` | When translating vague user intent into technical spec |
| `/visual` | After any UI modification |
| `/health` | After major refactoring or dependency changes |
| `/regras` | When enforcing code standards or reviewing PRs |

---

## Rule 4: Progress Transparency

- Update `task.md` as work progresses (mark `[/]` for in-progress, `[x]` for done)
- Never summarize what you "plan" to do — only what you've **done**
- Show proof: commands run, screenshots, error counts
- If something fails, say so immediately with the fix attempt

---

## Rule 5: Never Ship Broken

- Run `tsc --noEmit` after TypeScript changes
- Run `npm run build` before declaring "done" on a feature
- If build fails, fix it before moving on
- IDE lint errors that pass CLI are acceptable (stale cache)
