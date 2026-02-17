# LinkedIn Action Plan — Enio Rocha

> **Extraído de:** ChatGPT-Sistema de Pagamentos Asaas (1).md
> **Data:** 2026-02-17

---

## Perfil — Estilo "Quiet Builder"

### Headline (escolher 1)
1. `Desenvolvedor de sistemas`
2. **`Desenvolvedor de sistemas, automação e IA`** ← RECOMENDADO
3. `Desenvolvedor full stack, sistemas e IA`

### Bio "About" (5 linhas)
```
Construo sistemas e produtos digitais com IA como copiloto.
Foco em velocidade com engenharia de verdade — métricas, testes, e regras claras.
Exemplo: Carteira Livre, marketplace feito do zero com IA, do design ao backend.
Agora, estou abrindo o EGOS Lab — um repositório vivo de padrões e ferramentas.
Se você curte construir, me chama.
```

---

## Roteiro Editorial — 7 Posts

### Post 1: A Virada de Chave
**Gancho:** "Eu parei de estudar IA como assunto e passei a usar IA como ferramenta de produção."
- Quando começou (Cursor → Windsurf → Linux)
- O problema que queria resolver
- A primeira coisa real que shipou
- **Formato:** Texto curto, diário de bordo

### Post 2: Carteira Livre Como Prova
**Gancho:** "O que muda quando você constrói um produto inteiro com IA — e precisa responder por ele."
- O que o produto faz em 1 frase (marketplace de instrutores de trânsito)
- Módulos construídos (pagamentos Asaas, KYC, geolocalização, IA de moderação)
- O que deu errado e como corrigiu
- **Formato:** Case study curto

### Post 3: Ferramentas, Custos e Retorno
**Gancho:** "Hoje o custo não é só dinheiro — é ciclo de feedback."
- Stack: Windsurf IDE + Cascade AI + Linux
- Custos mensais reais de desenvolvimento
- Ganhos: tempo, qualidade, velocidade
- Onde IA falha e onde ela é absurda
- **Formato:** Lista + números

### Post 4: Migração para Linux
**Gancho:** "Troquei conforto por controle — e isso mudou meu ritmo."
- Por que migrou (performance, foco, estabilidade)
- O que melhorou
- Setup simples que recomenda
- **Formato:** Tutorial pessoal

### Post 5: EGOS Lab — Regras Públicas
**Gancho:** "Eu não quero vender mágica. Quero publicar processos."
- O que o EGOS Lab é (.guarani, .windsurfrules, agents/)
- Por que abrir as regras (Rules-as-DNA)
- O que qualquer dev pode usar hoje
- Link para GitHub
- **Formato:** Anúncio + convite

### Post 6: "Auditei 5 Repos Open Source com Agentes IA"
**Gancho:** "388 findings em 233ms. Zero custo."
- Case studies: Documenso, Cal.com, tRPC
- Como funciona o SSOT Auditor
- Convite: "Quer que eu audite o seu?"
- **Formato:** Thread técnica

### Post 7: O Futuro do Dev Solo
**Gancho:** "1 dev + IA + regras claras = produto real em semanas."
- Reflexão sobre a nova era
- Comparação: time de 5 vs dev solo com IA
- O que muda e o que não muda (design, UX, decisão de negócio)
- **Formato:** Opinião

---

## Regras de Postagem

1. **Formato diário de bordo** — contexto, decisão, tradeoff, resultado, aprendizado
2. **Sem buzzwords** — não usar "revolucionário", "game changer", "disruptivo"
3. **Sem autoelogio** — deixar os números e resultados falarem
4. **Frases curtas** — parágrafos de 1-2 linhas no máximo
5. **1 post por semana** — consistência > frequência
6. **Sempre com prova** — screenshot, link, número real
7. **CTA discreto** — "Se quiser ver mais: [link]" no final

---

## Insights Não Implementados (da Conversa)

### Agent Ops Server (P2 — Futuro)
- Control plane: **Activepieces** ou **n8n** (self-hosted)
- Agent runner: OpenAI Agents SDK ou EGOS agents nativo
- Social posting: Instagram Graph API + TikTok Content Posting API
- Analytics: Plausible + OpenTelemetry

### Marketplace-Core Architecture (P2 — Futuro)
- Generic marketplace framework extracted from Carteira Livre
- State machine: request → proposal → booking → payment → completion → review
- Event-driven analytics schema (view_list, create_request, payment_succeeded, etc)
- Ranking model: Score = a*Trust + b*Distance + c*Availability + d*PriceFit + e*ResponseRate

### Branding Updates Needed
- "Tutor IA" → "Carteira IA" or "CL Assist" (avoid educational framing)
- Disclaimer: "apoio informacional e navegação, não ensino formal"
- CONTRAN 1.020/2025: remove "2 aulas práticas obrigatórias" (varies by state)

---

*"Quiet builder. Let the work speak."*
