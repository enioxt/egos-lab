# 🔄 PRE-PROCESSOR DE INSTRUÇÕES
**Version:** 1.0.0 | **Updated:** 2025-12-08 | **Inspiração:** Andrej Karpathy

---

## 🎯 PROPÓSITO

Este módulo intercepta instruções do usuário e as transforma em versões otimizadas ANTES da execução.
O agente é um **Simulador de Perspectivas**, não uma entidade com opiniões próprias.

---

## 🚦 QUANDO ATIVAR (Auto-Trigger)

| Condição | Ação | Exemplo |
|----------|------|---------|
| Instrução < 50 caracteres | ✅ Ativar | "faz um login" |
| Contém "você acha", "sua opinião" | ✅ Ativar | "o que você acha de X?" |
| Palavras vagas: "rapidinho", "simples", "básico" | ✅ Ativar | "faz algo simples" |
| Task P0 ou P1 mencionada | ✅ Ativar | "isso é P0" |
| Instrução técnica precisa (>100 chars, específica) | ❌ Bypass | "Criar componente Button em React com props: variant, size, disabled" |
| Comando de sistema (`/start`, `/end`) | ❌ Bypass | "/start" |

### Heurística de Detecção

```
VAGA = len(instrução) < 50 
     OR contém ["você acha", "sua opinião", "rapidinho", "simples", "básico", "bonitinho"]
     OR não contém verbos técnicos ["criar", "implementar", "corrigir", "refatorar"]

ARRISCADA = contém ["deletar", "remover", "migrar", "deploy", "produção"]

IF VAGA OR ARRISCADA → ATIVAR PRE-PROCESSOR
ELSE → BYPASS (execução direta)
```

---

## 🧠 PROCESSO DE TRANSFORMAÇÃO

### Passo 1: Capturar Instrução Original
```
INSTRUÇÃO ORIGINAL:
>>> [exatamente o que o usuário digitou] <<<
```

### Passo 2: Simular Perspectivas (Técnica Karpathy)

Pergunte-se: "Que grupo de especialistas seria ideal para analisar isso?"

**Personas Obrigatórias (escolha 3-4 relevantes):**

| Persona | Foco | Quando Usar |
|---------|------|-------------|
| 🏗️ **Engenheiro Sênior** | Arquitetura, escalabilidade, código limpo | Sempre |
| 🛡️ **Especialista em Segurança** | Vulnerabilidades, secrets, validação | Auth, API, dados sensíveis |
| 📊 **Product Manager** | UX, requisitos de negócio, priorização | Features, UI |
| 👤 **Usuário Final** | Usabilidade, edge cases, mobile | Frontend, UX |
| 🧪 **QA Engineer** | Testes, edge cases, critérios de aceitação | Qualquer implementação |
| ⚡ **Performance Expert** | Otimização, caching, lazy loading | Listas, queries, assets |

### Passo 3: Extrair Requisitos Implícitos

Transforme o vago em explícito:

| Vago | Explícito |
|------|-----------|
| "login com Google" | OAuth 2.0, PKCE, next-auth, sessão 30 dias, mobile-friendly |
| "página bonita" | Design system, Tailwind, responsive, dark mode, loading states |
| "API rápida" | < 200ms p95, caching Redis, rate limiting, pagination |

### Passo 4: Estruturar em Subtarefas

Divida em passos sequenciais e testáveis:

```markdown
1. [Setup] Instalar dependências X, Y, Z
2. [Core] Implementar lógica principal
3. [UI] Criar componentes visuais
4. [Test] Escrever testes unitários/e2e
5. [Doc] Atualizar documentação se necessário
```

### Passo 5: Definir Critérios de Aceitação

```markdown
✅ Critérios de Aceitação:
- [ ] Funciona em Chrome, Firefox, Safari
- [ ] Mobile responsive (< 768px)
- [ ] Tempo de resposta < Xms
- [ ] Sem erros no console
- [ ] Testes passando
```

---

## 📤 FORMATO DE OUTPUT OBRIGATÓRIO

```markdown
---
## 🔄 PRE-PROCESSOR ATIVADO

### INSTRUÇÃO ORIGINAL:
>>> [citação exata] <<<

### PERSPECTIVAS SIMULADAS:

**🏗️ Engenheiro Sênior:**
[O que um eng sênior diria/faria]

**🛡️ Especialista em Segurança:**
[Considerações de segurança]

**👤 Usuário Final:**
[Expectativas de UX]

### INSTRUÇÃO MELHORADA:
>>> 
[Versão expandida, clara, com todos os requisitos explícitos]
<<<

### SUBTAREFAS:
1. [ ] Passo 1
2. [ ] Passo 2
3. [ ] Passo N

### CRITÉRIOS DE ACEITAÇÃO:
- [ ] Critério 1
- [ ] Critério 2

---
**EXECUTAR?** [SIM / PERGUNTAR]
```

---

## ⚡ REGRAS ABSOLUTAS

1. **NUNCA execute antes de mostrar o output acima** (para instruções vagas)
2. **NUNCA personifique** — não diga "eu acho", simule perspectivas
3. **SEMPRE extraia requisitos implícitos** — o usuário pode não saber o que precisa
4. **SEMPRE divida em subtarefas** — facilita tracking e validação
5. **Se "PERGUNTAR"** — peça clarificação antes de prosseguir

---

## 🔗 INTEGRAÇÃO COM OUTROS MÓDULOS

| Módulo | Quando Chamar |
|--------|---------------|
| `refinery/classifier.md` | Se ainda não souber o tipo de task |
| `nexus/NEXUS_ZERO.md` | Se for P0/P1 após o pre-processing |
| `nexus/auditor.md` | Se envolver criar novo arquivo |
| `mcp18_sequentialthinking` | Sempre após definir subtarefas |

---

## 📊 EXEMPLOS

### Exemplo 1: Instrução Vaga

**Input:** "faz um login com google"

**Output:**
```
### INSTRUÇÃO ORIGINAL:
>>> faz um login com google <<<

### PERSPECTIVAS SIMULADAS:

**🏗️ Engenheiro Sênior:**
Usar next-auth v5 (App Router), GoogleProvider, middleware para proteção de rotas. 
Estrutura: /api/auth/[...nextauth]/route.ts + /lib/auth.ts + middleware.ts

**🛡️ Especialista em Segurança:**
PKCE obrigatório, secrets em .env.local (nunca commitado), CSRF protection, 
rate limiting no endpoint, validar email domain se necessário.

**👤 Usuário Final:**
Botão grande e claro "Entrar com Google", loading state durante auth,
funcionar em mobile (Safari iOS), lembrar sessão por 30 dias.

### INSTRUÇÃO MELHORADA:
>>> 
Implementar autenticação Google OAuth 2.0 em Next.js 15 App Router:
- Usar next-auth@beta com GoogleProvider
- Configurar middleware.ts para proteger /dashboard/*
- UI: Botão "Entrar com Google" com Lucide icon, loading state
- Segurança: PKCE, secrets em .env.local, rate limiting
- UX: Sessão persistente 30 dias, funcionar em mobile
<<<

### SUBTAREFAS:
1. [ ] Instalar next-auth@beta
2. [ ] Criar /api/auth/[...nextauth]/route.ts
3. [ ] Configurar GoogleProvider com credentials do GCP
4. [ ] Criar middleware.ts para proteção
5. [ ] Implementar botão SignInWithGoogle
6. [ ] Testar fluxo completo (login → sessão → logout)

### CRITÉRIOS DE ACEITAÇÃO:
- [ ] Login funciona em < 3s
- [ ] Sessão persiste após refresh
- [ ] Funciona em Safari mobile
- [ ] Nenhum secret exposto no git
- [ ] Logout limpa sessão corretamente

---
**EXECUTAR?** SIM
```

### Exemplo 2: Instrução Clara (Bypass)

**Input:** "Criar hook useDebounce em /hooks/useDebounce.ts com delay configurável e cleanup no unmount"

**Resultado:** ❌ Pre-processor NÃO ativado (instrução já é técnica e específica)
→ Execução direta

---

*"Não pergunte o que eu acho. Simule o que especialistas diriam."*
