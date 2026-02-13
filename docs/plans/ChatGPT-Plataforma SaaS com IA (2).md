# Plataforma SaaS com IA

**User:** Enio Rocha (enioxt@gmail.com)  
**Created:** 2/8/2026 17:55:44  
**Updated:** 2/8/2026 20:06:02  
**Exported:** 2/12/2026 22:59:17  
**Link:** [https://chatgpt.com/c/6988f81a-ba24-8328-b309-b3772207b48d](https://chatgpt.com/c/6988f81a-ba24-8328-b309-b3772207b48d)  

## Prompt:
Notei que várias pessoas têm grupos de criadores de SaaS, S-A-A-S, principalmente agora com o desenvolvimento auxiliado por inteligência artificial. Pensei em criar uma plataforma, um site, onde as pessoas, né? Esses desenvolvedores insiram ali os seus portfólios e a gente faça uma leitura, crie um sistema com um system prompt e uma IA lendo todos os repositórios do GitHub das pessoas e também o LinkedIn e redes sociais, se ele quiser que sejam analisadas, e também os sites que podem ter os seus portfólios, né? Além disso, eles podem complementar ali, escrevendo de fato o que eles fazem. Para isso, vamos permitir que marque ali um checklist, né? Com um checkbox já sugerindo várias áreas para ele se lembrar e marcar. Dessa forma, a gente conseguir retirar insight e criar união, né? Unir pessoas que insiram os dados e às vezes querem parcerias, querem ajuda com algo, querem apenas se conectar. Então, desenhe todo esse plano pra gente da melhor forma possível. Já compare com as plataformas que fazem isso, mas vamos fazer um diferencial de ser algo bem inteligente e livre para as pessoas incluírem ali e se comunicarem. Elas devem poder inserir redes sociais e tudo mais para termos o máximo de informações possíveis que elas quiserem compartilhar para uma rede social de desenvolvedores de SaaS, digamos assim, mas bem focada, com todos esses filtros, com inteligência artificial em todas as camadas para conseguir, né? Que as pessoas realmente se conectem e se encontrem, né? Apenas ao abrir ali e selecionar as preferências da pessoa ela já consiga ter mostrada pra ela quais outros, né? Outras pessoas que também estão compartilhando, né? Principalmente com foco em projetos abertos, open source ou side projects de outras pessoas, enfim. Para que através desses projetos que as pessoas gostam de divulgar aconteça essa união, né? Esse vínculo.

## Response:
Thought for 1m 2s

Enio, a ideia é bem forte — porque une **“prova de trabalho” (GitHub/projetos)** com **intenção de conexão** (parceria/ajuda/cofounder/OSS) e ainda coloca a IA como _cola_ pra transformar um monte de sinais soltos em **perfil vivo + match explicável**.

Abaixo vai um desenho completo (produto + IA + dados + arquitetura + diferenciais), já comparando com plataformas parecidas.

* * *

1) Tese do produto (o “porquê” que vira diferencial)
----------------------------------------------------

**Problema real hoje:** a galera até tem portfólio, GitHub, LinkedIn, posts… mas isso fica espalhado e **não vira conexão prática** (“quem encaixa comigo pra esse projeto?” / “quem topa contribuir?” / “quem tá no mesmo estágio?”).

**Proposta:** uma rede focada em criadores de SaaS/side projects/OSS em que:

1.  o usuário **conecta fontes** (principalmente GitHub) e escolhe o que quer expor,
2.  a IA transforma isso em **perfil estruturado + narrativa**,
3.  o sistema cria um **grafo de compatibilidade** e recomenda pessoas e projetos com explicação (“por que vocês combinam”),
4.  a comunicação acontece em cima de **projetos/necessidades**, não só “networking genérico”.

* * *

2) Comparativo rápido com o que já existe (e onde você passa na frente)
-----------------------------------------------------------------------

### “Proof of work” / portfólio agregador

*   **Peerlist**: junta provas (GitHub etc) e vira perfil/portfólio bem feito. [Peerlist+2Google Play+2](https://peerlist.io/?utm_source=chatgpt.com)
*   **Polywork**: mais “linha do tempo da vida profissional”, muito bom pra multi-atividades. [polywork-2023.webflow.io+2DEV Community+2](https://polywork-2023.webflow.io/?utm_source=chatgpt.com)
*   **Contra**: portfólios e rede freelancer, com proposta “AI-powered portfolio”. [contra.com+1](https://contra.com/?utm_source=chatgpt.com)

**O seu diferencial aqui:** não só “mostrar” — é **entender os repos** (stack, maturidade, padrão de código, domínio, necessidades) e converter isso em **matching + colaboração orientada a projetos**.

### Comunidades SaaS / founders

*   **Indie Hackers**: comunidade/grupos muito forte pra SaaS, mas o matchmaking é mais “manual + fórum”. [Indie Hackers+1](https://www.indiehackers.com/groups?utm_source=chatgpt.com)

**Seu diferencial:** você cria um “**radar**” automático de pessoas/projetos compatíveis e facilita _intros_ sem depender de postar e torcer.

### Match de cofounder / networking por IA

*   **YC Co-Founder Matching**: filtros e intenção clara de achar cofundador. [Y Combinator+2Y Combinator+2](https://www.ycombinator.com/cofounder-matching?utm_source=chatgpt.com)
*   **Lunchclub**: faz conexões via IA (introduções 1:1). [lunchclub.com+1](https://lunchclub.com/?utm_source=chatgpt.com)

**Seu diferencial:** o match não é só “perfil + conversa” — é **perfil + provas + projetos + necessidades concretas** (ex.: “preciso de front pra X”, “procuro parceiro pra validação”, “quero contribuir em OSS de fintech”).

* * *

3) Experiência do usuário (fluxo simples e poderoso)
----------------------------------------------------

### Onboarding em 5 minutos

1.  **Conta** (email/GitHub OAuth)
2.  **Conectar fontes** (começa com GitHub + site pessoal; outras são opcionais)
3.  **Escolher o que entra** (repos/páginas/links) + nível de visibilidade
4.  **Checklist guiado** (stack, áreas, objetivos, disponibilidade, interesses)
5.  **Gerar “Builder Card”** (perfil IA) + primeiros matches

### O que o usuário ganha imediatamente

*   **Resumo “quem sou eu”** (para bio, pitch, post de recrutamento)
*   **Mapa de stack** (hard skills inferidas + confiança por evidência)
*   **Mapa de projetos** (side projects/OSS, status, maturidade)
*   **Sugestões do que melhorar** (README, issues boas pra abrir, docs faltando)
*   **Matches + explicação** (“por que você deveria falar com X”)

* * *

4) Dados & consentimento (sem treta com scraping)
-------------------------------------------------

Aqui é crítico ser “clean” e confiável.

### Fontes (prioridade MVP)

*   **GitHub (OAuth / GitHub App)**: repositórios, README, linguagens, tópicos, issues/PRs, contribuições.
*   **Sites/portfólios**: somente **URLs que o usuário fornecer** (crawl permitido e controlado).
*   **Redes sociais**: campos de link + import manual (ex.: colar textos/descrições ou upload).

**LinkedIn:** eu evitaria “varrer LinkedIn” via scraping. Melhor:

*   (a) **import manual** (PDF do perfil / texto colado), ou
*   (b) integração só se houver **API oficial/permite** no seu caso de uso.  
    Isso reduz risco jurídico e te posiciona como plataforma ética desde o dia 1.

* * *

5) Taxonomia (o checklist que vira “linguagem comum”)
-----------------------------------------------------

Você quer um checklist que lembre o usuário e padronize o banco de dados.

Sugestão de categorias (cada uma vira filtro + embedding):

*   **Papel**: Founder / Dev / Designer / PM / Growth / Data / DevRel
*   **Stack**: Front (React/Next/Vue), Back (Node/Python/Go), Mobile, Infra, Data, AI
*   **Domínios**: Fintech, Health, Educação, DevTools, B2B, Creator economy, etc.
*   **Objetivo agora**: cofundador, parceiro técnico, contribuidor OSS, mentoria, contratar, ser contratado, beta testers
*   **Disponibilidade**: horas/semana, fuso, idioma, “modo sprint”
*   **Estágio de projeto**: ideia, MVP, early users, receita, scale
*   **Preferências de parceria**: equity/paid, curto/longo prazo, async/sync
*   **Estilo de trabalho**: documentação, testes, entrega rápida, pesquisa, produto

* * *

6) Camadas de IA (onde ela entra “em tudo” sem virar firula)
------------------------------------------------------------

### Camada A — Ingestão + normalização

*   Parser de README/docs
*   Extração de stack por sinais (package.json, requirements, Dockerfile, etc.)
*   Classificação de domínio do projeto (ex.: “é um devtool?”)

### Camada B — “Profile Intelligence” (gera o perfil estruturado)

Outputs em JSON + texto humano:

*   skills inferidas **com evidência** (repo X, arquivo Y, frequência)
*   “assinatura” do builder (tendências: frontend-heavy, infra, ML, produto)
*   resumo em 1 linha / 5 linhas / bio longa
*   pontos fortes + lacunas sugeridas

### Camada C — Matching engine (o coração)

Combina:

*   **filtros duros** (idioma, disponibilidade, objetivo, stack mínima)
*   **similaridade vetorial** (interesses, domínio, estilo)
*   **complementaridade** (um é forte em produto, outro em back, etc.)
*   **sinais de execução** (consistência de commits, releases, issues fechadas — com cuidado pra não virar métrica tóxica)

E sempre devolve:  
**Match Score + “Por que combinam” + “Próximo passo sugerido”**.

### Camada D — Comunicação assistida

*   sugestões de primeira mensagem (contextual)
*   “brief de parceria”: objetivos, regras, próximos passos
*   geração de “collab spec” (mini PRD / backlog) se os dois aceitarem

* * *

7) System prompt (esqueleto que eu usaria)
------------------------------------------

A ideia é ter **prompts pequenos e especializados**, não um prompt monolítico.

**Prompt 1 — Extractor (strict JSON)**

*   Entrada: README + metadados GitHub + seleção do usuário
*   Saída: JSON com `stack`, `domain`, `maturity`, `needs`, `highlights`, `evidence[]`

**Prompt 2 — Profile Writer**

*   Entrada: JSON do extractor + checklist do usuário
*   Saída: bio curta/média/longa + “Builder Card” + bullets objetivos

**Prompt 3 — Matcher**

*   Entrada: perfil A + preferências A + perfil B
*   Saída: score + justificativa + riscos/alertas + icebreakers

**Guardrails obrigatórios**

*   não inventar dados (se não viu, marca como “não evidenciado”)
*   transparência: “inferido de X”
*   privacidade: não expor nada fora do que o usuário marcou como público

* * *

8) Features de rede (o que cria “união” de verdade)
---------------------------------------------------

Além de perfil e busca, o que cola comunidade:

1.  **Project Pages** (cada projeto tem “procurando ajuda em…”, “good first issues”, “roadmap”)
2.  **Requests/Asks** (um feed de pedidos estruturados: “preciso de…”)
3.  **Collab Rooms** (chat + checklist de alinhamento + tarefas rápidas)
4.  **Reputação por contribuição** (não por hype): badges por PRs, revisões, docs, suporte
5.  **Descoberta por intenção**: “quero contribuir 2h/semana em OSS de educação” → lista pronta

* * *

9) MVP pragmático (pra sair do papel rápido sem perder a visão)
---------------------------------------------------------------

### MVP (primeiras 4–8 semanas)

*   Login com GitHub
*   Importar repos (selecionar quais entram)
*   Checklist de intenção/stack/tempo
*   Gerar Builder Card + busca com filtros
*   Matching básico + “por que”
*   Página pública do perfil (link compartilhável)

### V1 (depois)

*   Project pages + feed de asks
*   DMs / collab rooms
*   Embeddings + matching mais sofisticado (complementaridade)
*   Import de site/portfólio via URL

### V2

*   Times / squads
*   Eventos (sprints/hack weeks)
*   API pública / export de perfil (portabilidade)

* * *

10) Arquitetura sugerida (AI-first, mas escalável e barata)
-----------------------------------------------------------

*   **Frontend**: Next.js
*   **Backend**: Node ou Python (FastAPI)
*   **DB**: Postgres + **pgvector** (pra embeddings sem depender de outro banco)
*   **Queue**: Redis + worker (ingestão assíncrona)
*   **Index**: full-text + vector + filtros (facets)
*   **LLM**: pipelines curtos (extract → profile → match)
*   **Observabilidade**: logs + tracing (principalmente no custo de IA)

**Estratégia de custo:**

*   só reprocessar repos quando mudar (ETag/updated\_at)
*   embeddings por projeto, não por arquivo inteiro
*   resumo incremental (README + estrutura + poucos arquivos “sinalizadores”)

* * *

11) Ética, LGPD e confiança (isso vira diferencial de marca)
------------------------------------------------------------

*   Tudo **opt-in** e com controles claros de visibilidade
*   Exportar e apagar dados fácil (“download my data” / delete account)
*   Não coletar dados “surpresa”
*   Explicar inferências (e permitir o usuário corrigir)
*   Moderação: spam, golpes, assédio (com rate limit + denúncias)

* * *

12) O “pulo do gato” (minha opinião)
------------------------------------

Se você quiser um diferencial _real_ e memorável, faça o produto girar em torno de:

**“Conexões por projeto + prova de execução + intenção explícita”**  
e não “mais uma rede social profissional”.

Ou seja: o usuário entra e em **30 segundos** tem:

*   10 pessoas compatíveis
*   5 projetos onde ele pode contribuir hoje
*   3 pedidos de ajuda onde ele encaixa perfeitamente  
    com explicação clara.

* * *

Se você curtir, eu já continuo em modo prático e te entrego na próxima mensagem (sem enrolação):

1.  **um PRD enxuto** (MVP → V2),
2.  **o esquema do banco (tabelas + campos)**,
3.  **os 3 prompts base (extract/profile/match) em formato versionável** pra você plugar no teu codebase.

## Prompt:
ja me entregue isso: Se você curtir, eu já continuo em modo prático e te entrego na próxima mensagem (sem enrolação):

um PRD enxuto (MVP → V2),

o esquema do banco (tabelas + campos),

os 3 prompts base (extract/profile/match) em formato versionável pra você plugar no teu codebase.

## Response:
Thought for 9s

Perfeito, Enio. Vou te entregar **3 artefatos “plugáveis”**: (1) PRD enxuto (MVP→V2), (2) esquema de banco (Postgres + pgvector), (3) 3 prompts base (extract/profile/match) **versionáveis**.

* * *

1) PRD enxuto (MVP → V2)
------------------------

```md
# PRD — SaaS Builder Graph (nome provisório)
Versão: 0.1.0
Owner: Enio
Data: 2026-02-08

## 1. Visão
Plataforma de perfis e conexão focada em criadores de SaaS/side projects/OSS.
O usuário conecta fontes (principalmente GitHub) + adiciona links/infos opcionais.
A IA gera um perfil estruturado com evidências + recomenda pessoas e projetos compatíveis com explicação.

## 2. Objetivos (Outcomes)
- Reduzir o custo de encontrar parceiros/colaboradores em projetos (cofounder, contribuidor, freelancer, mentor).
- Converter “prova de trabalho” em sinal legível (stack, domínio, maturidade, necessidades) sem virar rede social genérica.
- Permitir descoberta por intenção: “quero contribuir 2h/semana em OSS de edu” → recomendações acionáveis.

## 3. Público-alvo
- Devs/builders indie (SaaS, side projects, OSS)
- Founders early-stage procurando parcerias
- Contribuidores OSS buscando projetos com fit
- Pessoas que querem “ser encontradas” por quem precisa da sua stack

## 4. Proposta de valor
- Perfil vivo gerado por IA com transparência (“inferido de X”)
- Matching com explicação (por similaridade e complementaridade)
- Rede orientada a projetos e necessidades (asks), não a status/hype

## 5. Princípios do produto
- Opt-in e privacidade por padrão
- Evidência > opinião: inferências sempre com fonte
- Zero scraping agressivo: só dados conectados via OAuth/API ou URLs fornecidas pelo usuário

## 6. Escopo por fases

### MVP (4–8 semanas)
#### Features
1) Auth + Onboarding
- Login via GitHub OAuth (obrigatório)
- Captura de preferências: objetivo, disponibilidade, idioma, stack, domínios
- Controle de visibilidade (perfil público/privado, quais repos entram)

2) Importação GitHub (seleção)
- Listar repos do usuário e permitir marcar quais entram
- Coletar metadados: descrição, tópicos, linguagens, README, stats básicos, links

3) IA: Extract + Profile
- Pipeline: EXTRACT (JSON) → PROFILE (texto + JSON)
- Gerar Builder Card:
  - bio curta/média/longa
  - stack principal (com evidências)
  - projetos em destaque (resumo, domínio, maturidade)
  - “o que estou buscando” (a partir do checklist)

4) Descoberta + Busca
- Diretório com filtros: stack, domínio, objetivo, disponibilidade, idioma
- Página de perfil compartilhável (URL pública)

5) Matching v0
- Recomendar usuários compatíveis (top N)
- Explicação do match: 3–7 bullets + próximos passos sugeridos
- “Salvar”/favoritar match

#### Métricas (MVP)
- Activation: % que conecta GitHub + seleciona ≥1 repo + completa checklist
- Time-to-value: tempo até ver 5 matches relevantes
- Connection intent: % que salva match / clica em contato (link) / inicia DM (se existir)

#### Fora do escopo (MVP)
- Chat interno completo (pode ser “contato via links”)
- Scraping de LinkedIn (evitar)
- Times/squads, eventos, reputação complexa

### V1 (8–16 semanas)
- Project Pages (por repo selecionado): status, necessidades, “good first tasks”
- Feed de Asks estruturados (preciso de X para Y)
- Mensagens/DMs básicas + templates de primeiro contato
- Matching por complementaridade (ex.: designer + dev, growth + dev)
- Import por URL (site/portfólio) com crawl controlado

### V2 (16–32 semanas)
- Collab Rooms (mini workspace): objetivos, checklist de alinhamento, tarefas rápidas
- Reputação por contribuição (docs/PR/review) com cuidado anti-métrica tóxica
- Times/Squads + convites
- API/Export de perfil (portabilidade) + webhooks
- Moderação e anti-spam avançados

## 7. Requisitos funcionais (MVP) — critérios de aceite
1) Usuário consegue logar com GitHub e ver lista de repos.
   - Aceite: mostra pelo menos nome, descrição, linguagem dominante, updated_at.

2) Usuário marca repos que entram no perfil.
   - Aceite: somente repos marcados são processados pela IA.

3) Sistema gera Builder Card em até X segundos após ingestão (assíncrono aceitável).
   - Aceite: status de processamento + resultado final persistido.

4) Busca por usuários com filtros funciona.
   - Aceite: filtros combináveis e paginação.

5) Recomendações de match aparecem e têm explicação.
   - Aceite: cada match retorna score + bullets + “próximo passo”.

## 8. Requisitos não-funcionais
- Privacidade: tudo opt-in + logs de consentimento
- Confiabilidade: não “alucinar” (toda inferência com evidência ou flag de baixa confiança)
- Escalabilidade: ingestão assíncrona com filas
- Custo: reprocessar apenas quando repo muda (updated_at/etag)

## 9. Riscos & mitigação
- Risco legal (scraping): restringir a OAuth/API e URLs do usuário.
- Risco de “métricas tóxicas”: evitar ranking por commits; focar em fit e intenção.
- Risco de spam: rate limits + moderação + verificação por GitHub.

## 10. APIs (MVP) — mínimo
- POST /auth/github/callback
- GET /me
- GET /me/repos
- POST /me/repos/select
- POST /me/profile/generate
- GET /directory?filters...
- GET /users/:id
- GET /me/matches
- POST /me/matches/:id/save

```

* * *

2) Esquema do banco (Postgres + pgvector)
-----------------------------------------

Abaixo vai um schema “MVP-first”, mas já preparado para V1/V2. Dá pra aplicar em migrations (Prisma/Drizzle/Flyway/etc).

```sql
-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enums (opcional)
DO $$ BEGIN
  CREATE TYPE visibility_level AS ENUM ('private','unlisted','public');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('github','website','manual','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE objective_type AS ENUM ('cofounder','collab','oss_contrib','mentor','hire','get_hired','network');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ingest_status AS ENUM ('pending','processing','success','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- Core
-- =========================

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handle            TEXT UNIQUE,               -- @enio, opcional
  display_name      TEXT,
  email             TEXT UNIQUE,
  locale            TEXT DEFAULT 'pt-BR',
  timezone          TEXT DEFAULT 'America/Sao_Paulo',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_identities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,             -- 'github'
  provider_user_id  TEXT NOT NULL,
  access_token_enc  TEXT,                      -- se armazenar (ideal: vault)
  refresh_token_enc TEXT,
  scopes            TEXT[],
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_user_id)
);

-- Preferências / checklist (MVP)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  visibility        visibility_level NOT NULL DEFAULT 'public',
  objectives        objective_type[] NOT NULL DEFAULT ARRAY[]::objective_type[],
  availability_hpw  INTEGER,                   -- hours per week
  languages_spoken  TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'pt-BR','en'
  work_style        TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'async','docs','tests','fast-ship'
  preferred_domains TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'fintech','edtech'
  preferred_stack   TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'nextjs','python','go'
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links públicos que o usuário adiciona
CREATE TABLE IF NOT EXISTS user_links (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label             TEXT NOT NULL,             -- 'LinkedIn','X','Site','Blog'
  url               TEXT NOT NULL,
  is_public         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- Fontes & Ingestão
-- =========================

CREATE TABLE IF NOT EXISTS sources (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              source_type NOT NULL,
  external_id       TEXT,                      -- ex: github username, url, etc
  display_name      TEXT,
  status            ingest_status NOT NULL DEFAULT 'pending',
  last_ingested_at  TIMESTAMPTZ,
  last_error        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GitHub account (separado pra facilitar)
CREATE TABLE IF NOT EXISTS github_accounts (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  github_login      TEXT NOT NULL,
  github_user_id    BIGINT NOT NULL UNIQUE,
  profile_url       TEXT,
  avatar_url        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Repositórios (apenas os que o usuário selecionou)
CREATE TABLE IF NOT EXISTS repositories (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL DEFAULT 'github',
  repo_full_name    TEXT NOT NULL,             -- owner/name
  repo_url          TEXT NOT NULL,
  is_selected       BOOLEAN NOT NULL DEFAULT false,
  is_public         BOOLEAN NOT NULL DEFAULT true, -- visibilidade no seu app
  default_branch    TEXT,
  description       TEXT,
  topics            TEXT[] DEFAULT ARRAY[]::TEXT[],
  primary_language  TEXT,
  languages_json    JSONB,                     -- {"TypeScript":12345,...}
  stars             INTEGER,
  forks             INTEGER,
  open_issues       INTEGER,
  pushed_at         TIMESTAMPTZ,
  updated_at_src    TIMESTAMPTZ,               -- updated_at do GitHub
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, repo_full_name)
);

-- Snapshot do conteúdo que a IA leu (MVP: README + metadados)
CREATE TABLE IF NOT EXISTS repo_documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id     UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  doc_type          TEXT NOT NULL,             -- 'readme','about','website_page'
  source_url        TEXT,
  content_text      TEXT,                      -- cuidado com tamanho; pode mover p/ storage
  content_sha256    TEXT,
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- IA: extração, perfil e embeddings
-- =========================

-- Resultado do EXTRACT por repo (JSON estrito com evidências)
CREATE TABLE IF NOT EXISTS repo_ai_extracts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id     UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  model             TEXT NOT NULL,
  prompt_version    TEXT NOT NULL,
  extract_json      JSONB NOT NULL,            -- output do extractor
  confidence        NUMERIC(4,3),              -- 0-1
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(repository_id, prompt_version)
);

-- Perfil IA consolidado do usuário (Builder Card + estrutura)
CREATE TABLE IF NOT EXISTS user_ai_profiles (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  model             TEXT NOT NULL,
  prompt_version    TEXT NOT NULL,
  profile_json      JSONB NOT NULL,            -- estrutura do perfil
  bio_short         TEXT,
  bio_medium        TEXT,
  bio_long          TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Embeddings (para busca/match)
-- Dimensão depende do modelo; aqui exemplo 1536.
CREATE TABLE IF NOT EXISTS embeddings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type        TEXT NOT NULL,             -- 'user','repo','ask'
  owner_id          UUID NOT NULL,
  embed_model       TEXT NOT NULL,
  vector_1536       vector(1536),
  text_basis_sha256 TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_type, owner_id, embed_model)
);

-- =========================
-- Matching (MVP: recomendação + explicação)
-- =========================

CREATE TABLE IF NOT EXISTS user_matches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score             NUMERIC(6,3) NOT NULL,     -- 0-100 ou 0-1 (definir e manter)
  rationale_json    JSONB NOT NULL,            -- explicação + evidências
  is_saved          BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- =========================
-- V1+: Asks / necessidades por projeto
-- =========================

CREATE TABLE IF NOT EXISTS asks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repository_id     UUID REFERENCES repositories(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  body              TEXT,
  tags              TEXT[] DEFAULT ARRAY[]::TEXT[],
  visibility        visibility_level NOT NULL DEFAULT 'public',
  status            TEXT NOT NULL DEFAULT 'open',  -- open/closed
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auditoria de consentimento/privacidade (recomendado)
CREATE TABLE IF NOT EXISTS consent_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action            TEXT NOT NULL,             -- 'connect_github','select_repo','publish_profile'
  details           JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_repos_user_selected ON repositories(user_id, is_selected);
CREATE INDEX IF NOT EXISTS idx_matches_user_score ON user_matches(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_asks_status ON asks(status, created_at DESC);

-- (Opcional) Índice vetorial (pgvector)
-- Escolha ivfflat/hnsw conforme sua versão/estratégia.
-- Exemplo (ivfflat):
-- CREATE INDEX ON embeddings USING ivfflat (vector_1536 vector_cosine_ops) WITH (lists = 100);
```

**Nota prática**: no MVP, dá pra armazenar `content_text` do README no banco, mas eu recomendo mover textos grandes para storage (S3/R2/etc) e manter no banco só `sha + url + trechos`, senão você vai pagar caro em I/O e backup.

* * *

3) 3 prompts base (extract/profile/match) — versionáveis
--------------------------------------------------------

Vou te entregar em **YAML** com: `id`, `version`, `system`, `user_template`, `output_schema`.  
A ideia é você colocar isso em algo tipo:

*   `prompts/extract.repo.v1.yaml`
*   `prompts/profile.user.v1.yaml`
*   `prompts/match.user_user.v1.yaml`

### 3.1 EXTRACT (por repositório → JSON estrito com evidências)

```yaml
id: extract.repo
version: "1.0.0"
purpose: "Extrair sinais estruturados de um repositório (README + metadados) com evidências e confiança."
model_recommendation: "gpt-4.1-mini ou equivalente para extração; usar modelo maior se README for complexo"
output_format: "json_strict"
system: |
  Você é um analisador de repositórios de software. Sua tarefa é extrair informações estruturadas e verificáveis
  a partir de: (1) metadados do repositório, (2) conteúdo de README e documentos fornecidos.
  
  Regras:
  - NÃO invente. Se algo não estiver evidenciado, marque como "unknown" ou omita.
  - Sempre que afirmar algo relevante (stack, domínio, maturidade, necessidades), inclua EVIDÊNCIAS.
  - Evidência deve apontar para uma fonte fornecida: "repo_metadata", "readme", ou "doc:<nome>".
  - Retorne APENAS JSON válido conforme o schema. Nada de markdown.
  - Seja conciso e útil para matching de pessoas/projetos.
user_template: |
  INPUT:
  repo_metadata:
    full_name: "{{repo.full_name}}"
    url: "{{repo.url}}"
    description: "{{repo.description}}"
    topics: {{repo.topics_json}}
    primary_language: "{{repo.primary_language}}"
    languages_json: {{repo.languages_json}}
    stars: {{repo.stars}}
    forks: {{repo.forks}}
    open_issues: {{repo.open_issues}}
    pushed_at: "{{repo.pushed_at}}"
    updated_at: "{{repo.updated_at}}"

  readme_text:
  """
  {{repo.readme_text}}
  """

  additional_docs:
  {{repo.additional_docs_block}}

  TASK:
  Extraia um resumo estruturado do repositório seguindo o schema.
output_schema:
  type: object
  additionalProperties: false
  required:
    - repo
    - summary
    - classification
    - stack
    - maturity
    - needs
    - evidence
    - confidence
  properties:
    repo:
      type: object
      additionalProperties: false
      required: [full_name, url]
      properties:
        full_name: { type: string }
        url: { type: string }
    summary:
      type: object
      additionalProperties: false
      required: [one_liner, what_it_does]
      properties:
        one_liner: { type: string }
        what_it_does: { type: string }
    classification:
      type: object
      additionalProperties: false
      required: [domain, category]
      properties:
        domain:
          type: string
          description: "Ex: fintech, edtech, devtools, health, ecommerce, unknown"
        category:
          type: string
          description: "Ex: SaaS, library, CLI, template, API, mobile_app, unknown"
    stack:
      type: object
      additionalProperties: false
      required: [languages, frameworks, infra, data_ai]
      properties:
        languages:
          type: array
          items: { type: string }
        frameworks:
          type: array
          items: { type: string }
        infra:
          type: array
          items: { type: string }
        data_ai:
          type: array
          items: { type: string }
    maturity:
      type: object
      additionalProperties: false
      required: [stage, has_users, has_revenue, docs_quality]
      properties:
        stage:
          type: string
          description: "idea, prototype, mvp, production, oss_mature, unknown"
        has_users: { type: string, description: "yes/no/unknown" }
        has_revenue: { type: string, description: "yes/no/unknown" }
        docs_quality: { type: string, description: "poor/ok/good/unknown" }
    needs:
      type: object
      additionalProperties: false
      required: [seeking, good_first_tasks, help_wanted]
      properties:
        seeking:
          type: array
          items: { type: string }
          description: "Ex: frontend, backend, designer, growth, docs, testers"
        good_first_tasks:
          type: array
          items: { type: string }
        help_wanted:
          type: array
          items: { type: string }
    evidence:
      type: array
      description: "Lista de evidências rastreáveis"
      items:
        type: object
        additionalProperties: false
        required: [claim, source, excerpt]
        properties:
          claim: { type: string }
          source: { type: string, description: "repo_metadata | readme | doc:<name>" }
          excerpt: { type: string, description: "Trecho curto (<= 200 chars)" }
    confidence:
      type: number
      minimum: 0
      maximum: 1
```

* * *

### 3.2 PROFILE (consolidar user → Builder Card + JSON)

```yaml
id: profile.user
version: "1.0.0"
purpose: "Consolidar perfil do usuário a partir de checklist + extrações dos repos, gerando Builder Card e estrutura para busca/match."
model_recommendation: "modelo médio/maior (qualidade de texto + coerência)."
output_format: "json_strict"
system: |
  Você é um gerador de perfil profissional para builders de SaaS/OSS.
  Use apenas os dados fornecidos: preferências do usuário, links e extrações de repositórios.
  
  Regras:
  - NÃO invente experiência, empregos ou resultados.
  - Destaque skills e áreas com base em evidência (repositórios e checklist).
  - Se houver conflito entre checklist e evidência, descreva como "declared" (declarado) vs "evidenced" (evidenciado).
  - Retorne APENAS JSON válido conforme o schema.
user_template: |
  INPUT:
  user:
    display_name: "{{user.display_name}}"
    handle: "{{user.handle}}"
    locale: "{{user.locale}}"
    timezone: "{{user.timezone}}"

  preferences:
    objectives: {{prefs.objectives_json}}
    availability_hpw: {{prefs.availability_hpw}}
    languages_spoken: {{prefs.languages_spoken_json}}
    preferred_domains: {{prefs.preferred_domains_json}}
    preferred_stack: {{prefs.preferred_stack_json}}
    work_style: {{prefs.work_style_json}}
    notes: "{{prefs.notes}}"

  links:
    {{user.links_block}}

  repo_extracts:
    {{user.repo_extracts_json}}

  TASK:
  Gere um perfil consolidado e acionável para matching.
output_schema:
  type: object
  additionalProperties: false
  required:
    - headline
    - builder_card
    - skills
    - domains
    - projects
    - collaboration
    - evidence_summary
  properties:
    headline:
      type: string
      description: "Uma linha: quem é + foco atual"
    builder_card:
      type: object
      additionalProperties: false
      required: [bio_short, bio_medium, bio_long]
      properties:
        bio_short: { type: string, description: "<= 180 chars" }
        bio_medium: { type: string, description: "3-5 linhas" }
        bio_long: { type: string, description: "8-12 linhas" }
    skills:
      type: object
      additionalProperties: false
      required: [evidenced, declared, gaps]
      properties:
        evidenced:
          type: array
          items:
            type: object
            additionalProperties: false
            required: [skill, strength, evidence]
            properties:
              skill: { type: string }
              strength: { type: string, description: "low/medium/high" }
              evidence:
                type: array
                items:
                  type: object
                  additionalProperties: false
                  required: [repo, claim]
                  properties:
                    repo: { type: string }
                    claim: { type: string }
        declared:
          type: array
          items: { type: string }
        gaps:
          type: array
          items: { type: string }
          description: "lacunas sugeridas (com cuidado, sem julgamento)"
    domains:
      type: array
      items:
        type: object
        additionalProperties: false
        required: [domain, confidence]
        properties:
          domain: { type: string }
          confidence: { type: number, minimum: 0, maximum: 1 }
    projects:
      type: array
      items:
        type: object
        additionalProperties: false
        required: [repo, one_liner, category, stage, tags]
        properties:
          repo: { type: string }
          one_liner: { type: string }
          category: { type: string }
          stage: { type: string }
          tags: { type: array, items: { type: string } }
    collaboration:
      type: object
      additionalProperties: false
      required: [objectives, availability_hpw, best_fit, do_not_want]
      properties:
        objectives: { type: array, items: { type: string } }
        availability_hpw: { type: integer }
        best_fit:
          type: array
          items: { type: string }
          description: "tipos de parceria que combinam"
        do_not_want:
          type: array
          items: { type: string }
          description: "limites (se informado)"
    evidence_summary:
      type: object
      additionalProperties: false
      required: [top_repos, key_signals]
      properties:
        top_repos: { type: array, items: { type: string } }
        key_signals: { type: array, items: { type: string } }
```

* * *

### 3.3 MATCH (user↔user → score + explicação + próximos passos)

```yaml
id: match.user_user
version: "1.0.0"
purpose: "Calcular compatibilidade entre dois usuários com base em intenção, stack, domínio, disponibilidade e evidências."
model_recommendation: "modelo médio; usar maior para explicações mais finas."
output_format: "json_strict"
system: |
  Você é um motor de matching para builders de SaaS/OSS.
  Compare dois perfis estruturados e explique o fit de forma útil, respeitosa e acionável.

  Regras:
  - Não invente informações. Use só o que está nos perfis.
  - Diferencie similaridade (mesmos interesses) de complementaridade (skills que se completam).
  - Penalize conflitos claros: objetivos incompatíveis, disponibilidade muito diferente, preferências divergentes.
  - Retorne apenas JSON válido conforme o schema.
user_template: |
  INPUT:
  seeker_profile_json:
  {{seeker.profile_json}}

  target_profile_json:
  {{target.profile_json}}

  TASK:
  Gere score e explicação do match.
output_schema:
  type: object
  additionalProperties: false
  required:
    - score
    - fit_type
    - reasons
    - risks
    - suggested_next_steps
    - icebreakers
  properties:
    score:
      type: number
      minimum: 0
      maximum: 100
    fit_type:
      type: string
      description: "similarity | complementary | mixed | low_fit"
    reasons:
      type: array
      description: "3-7 bullets explicando por que combinam"
      items:
        type: object
        additionalProperties: false
        required: [reason, evidence_refs]
        properties:
          reason: { type: string }
          evidence_refs:
            type: array
            items: { type: string }
            description: "refs do tipo 'seeker.skills.evidenced[0]' ou 'target.projects[1]'"
    risks:
      type: array
      description: "0-4 itens: alertas de desalinhamento"
      items: { type: string }
    suggested_next_steps:
      type: array
      description: "passos concretos (ex: revisar repo X, alinhar objetivo Y, propor micro-task)"
      items: { type: string }
    icebreakers:
      type: array
      description: "2-5 mensagens curtas para iniciar contato"
      items: { type: string }
```

* * *

### Extra (bem útil): “contrato de integração” no seu codebase

Se você quiser padronizar no EGOS/codebase, eu sugiro que **todo prompt tenha**:

*   `id`, `version`, `output_schema`
*   e que o runtime sempre valide JSON na saída (e re-tente com “repair” local se quebrar).

* * *

Se você já for começar a codar isso agora, eu posso te entregar também (em seguida, no mesmo nível de plug-and-play):

*   um **pipeline de ingestão** (workers + estratégia de reprocessamento por `updated_at/sha`),
*   e um **ranking híbrido** (filtros duros + embeddings + LLM só pra explicação final).



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)