# LinkedIn Posts — Prontos para Publicar

> **Data:** 2026-02-17
> **Estilo:** Quiet builder. Diário de bordo. Sem buzzwords.

---

## POST 1: Carteira Livre — O Produto

**Texto:**

Construí um marketplace inteiro com IA como copiloto. Do zero. Sozinho.

Carteira Livre conecta alunos a instrutores de trânsito autônomos. O que parece simples por fora tem:

- 222 APIs (todas com rate limiting)
- 139 mil linhas de TypeScript
- 498 testes automatizados
- 100 tabelas no banco
- 7 agentes de IA internos (moderação, extração de CNH, SEO, tutor)
- Pagamentos reais via Asaas (PIX, Boleto, Cartão)
- KYC com extração automática de CNH por IA
- Cobertura em 27 estados brasileiros
- OAuth com Google e Facebook
- Dashboard completo para instrutor, aluno e admin

Ferramentas: Next.js 15, React 19, Supabase, Windsurf IDE + Cascade AI.

Tempo: ~40 sessões de desenvolvimento.

Não é protótipo. Tem instrutores reais, aulas pagas, webhooks de pagamento funcionando.

O que aprendi: IA não substitui engenharia. Ela acelera quem já sabe o que está fazendo. Sem regras claras, IA gera lixo rápido.

Link: https://carteiralivre.com
Código: privado (mas os padrões estão abertos no EGOS Lab)

#desenvolvimento #ia #marketplace #startup #solodev

---

## POST 2: EGOS Lab — As Regras Por Trás

**Texto:**

Depois de construir um produto de 139 mil linhas com IA, percebi que o valor não estava no código.

Estava nas regras.

Regras que dizem ao agente de IA:
- O que ele pode e não pode fazer
- Onde buscar contexto antes de agir
- Como commitar, testar e documentar
- Quando parar e perguntar

Então abri tudo.

EGOS Lab é um repositório open-source com:

- 8 agentes autônomos (SSOT Auditor, Auth Checker, Code Reviewer, Security Scanner...)
- Pre-commit automático com 5 verificações de governança
- Pre-push que bloqueia deploys quebrados
- Auditoria de segurança automatizada (10 migrations de RLS no Supabase)
- Case studies reais: auditei Documenso (1.012 findings), Cal.com (1.469), tRPC (388), Medusa (2.427)

O SSOT Auditor roda em qualquer repo TypeScript. Zero configuração. Resultado em segundos.

A ideia: se você tem regras boas, qualquer agente (humano ou IA) produz código melhor.

Rules govern agents. Agents enforce rules.

Link: https://github.com/enioxt/egos-lab
Site: https://egos.ia.br

#opensource #ia #devtools #agentes #engenharia

---

## POST 3: A Jornada — De Cursor a Linux

**Texto:**

Em 2025, eu era um dev que estudava IA como assunto.

Em 2026, eu uso IA como ferramenta de produção. Todo dia. Em tudo.

A timeline:
- Comecei com Cursor IDE (bom, mas limitado)
- Migrei para Windsurf + Cascade AI (melhor integração)
- Troquei Windows por Linux (performance, foco, controle)
- Construí Carteira Livre: marketplace real, pagamentos reais, usuários reais
- Extraí os padrões e abri o EGOS Lab

O que mudou não foi a ferramenta. Foi o método.

Regras claras > prompts elaborados.
Commits frequentes > sessões longas.
Testes > confiança cega.
Perguntar antes > refazer depois.

Números reais:
- 1 desenvolvedor
- ~40 sessões de trabalho
- 139 mil linhas de código
- 222 APIs
- 498 testes
- 8 agentes autônomos
- Valuation estimado: R$ 7M (COCOMO II + IP)

Não estou vendendo curso. Estou documentando o processo.

Se você constrói com IA e quer trocar ideia, me chama.

Carteira Livre: https://carteiralivre.com
EGOS Lab: https://github.com/enioxt/egos-lab

#solodev #ia #linux #desenvolvimento #builder

---

## Dados de Apoio (para referência, não publicar)

### Features Construídas no Carteira Livre (completas)
- **Auth:** Google/Facebook OAuth, email login, role-based routing
- **Payments:** Asaas integration (PIX, Boleto, Card), webhook tracking, commission splitting
- **KYC:** CNH extraction via AI, credential verification, multi-state support
- **AI Agents:** 7 agents (moderation, document extraction, SEO, tutor, analytics, influencer, instructor-tutor)
- **AI Orchestrator:** 12/14 routes migrated, centralized logging
- **Notifications:** WhatsApp, email, Telegram queue, preference-based dispatch
- **Growth:** Referral system (69 wallets), ambassador program, points/gamification
- **Admin:** Full admin panel (24k LOC), observability dashboard, user management
- **Student flow:** CEP search, instructor cards, booking, LADV guide with progress tracking
- **Instructor flow:** Dashboard with AI tips, availability calendar, pricing, vehicles, earnings
- **SEO:** 27 state landing pages, sitemap, structured metadata
- **Security:** 221/222 APIs rate-limited, RLS on all tables, pre-commit secret scanning
- **Testing:** 498 tests (Vitest), 12 quality checks pre-commit

### Features Construídas mas Sem Tração (honestidade)
- Referral codes: 0 usos
- Vouchers: 0 criados
- Agent referrals: 0
- Reviews: 0 (gated on lesson completion, only 1 lesson completed)
- Radio Philein: paused, moved to egos-lab

### Aprendizados Chave
1. IA gera código 10x mais rápido, mas bugs 10x mais rápido também
2. Regras (.windsurfrules, .guarani/) são mais importantes que o modelo de IA
3. Pre-commit hooks salvam mais do que testes unitários
4. SSOT (Single Source of Truth) é obrigatório — sem ele, o agente de IA contradiz a si mesmo
5. Deploy discipline: cada push = deploy = custo. Batch changes.
6. Features sem usuários = dívida técnica disfarçada
