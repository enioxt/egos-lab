## Grok Replied:

[https://x.com/i/status/2000888141096616330](https://x.com/i/status/2000888141096616330)

Extraia o conteúdo deste thread, me fale o quão real isso é quando precisa migrar do supabase pra outro

---

## Grok Replied:

Aqui está o conteúdo completo do thread no X (antigo Twitter) que você linkou: [https://x.com/i/status/2000888141096616330](https://x.com/i/status/2000888141096616330?referrer=grok.com)

### Post principal (de @vivoplt, 16 de dezembro de 2025):

O texto é um thread longo explicando por que usar o Supabase pode ser "enganador" no longo prazo. Resumindo o conteúdo principal:

Você está construindo um app e escolhe o Supabase porque ele resolve tudo: Postgres pronto, auth, storage, realtime, sem gerenciar servidores ou APIs. Você shipa rápido e parece que o backend "sumiu".

Mas quando o app cresce (mais usuários, dados, features importantes), problemas aparecem: queries retornam vazio sem erro, RLS bloqueia dados inesperadamente, realtime fica lento, queries ruins afetam tudo.

O autor explica que o Supabase **não é "sem backend"**, mas sim:

*   Um Postgres gerenciado exposto diretamente ao client.
*   Access control (RLS) dentro do banco.
*   Lógica de negócio em SQL, triggers, functions.

Isso significa que o banco vira a API, o lugar de permissões e performance. Você ainda precisa:

*   Entender execução de queries no Postgres.
*   Projetar tabelas e índices bem.
*   Monitorar queries lentas.
*   Gerenciar RLS corretamente.

O Supabase facilita o início, mas o trabalho de banco de dados continua com você. O post termina com: "Supabase faz você começar rápido. O resto ainda depende de você."

Há uma imagem anexada (um meme ou gráfico ilustrando isso), e o post tem 1.3k likes, 74k views e muitos replies positivos.

### Replies principais:

*   Vários devs concordam e adicionam: "Isso vale para qualquer ferramenta 'no X' — a complexidade não some, só muda de lugar."
*   Um dev não-técnico diz que leu e ficou ansioso, mas confirmou que não fez atalhos ruins.
*   Outros mencionam que é ótimo para MVP, mas para escala real, otimize o banco desde o início.
*   Ninguém discorda fortemente; o tom é de alerta útil, não de crítica pesada.

### Quão real isso é? Quando você precisa migrar do Supabase para outro banco?

O post é **muito real e baseado em experiências comuns**. Muitos devs (em Reddit, blogs e fóruns) relatam exatamente isso: Supabase é incrível para protótipos e MVPs, mas quando o app escala, a exposição direta do banco ao client + RLS + lógica em SQL vira um pesadelo se não for bem projetado.

**Pontos positivos do Supabase (não é lock-in total):**

*   É baseado em Postgres padrão → você pode exportar tudo com pg\_dump e migrar para qualquer outro Postgres (Neon, Render, AWS RDS, self-hosted).
*   Armazenamento (storage) é S3-compatível.
*   Auth e realtime são open-source e podem ser migrados (embora Auth exija mais trabalho para recriar senhas/hashes).
*   Muitos devs migram para um backend tradicional (ex.: Node/Express + Prisma) mantendo o mesmo banco, ou para self-hosted Supabase.
*   Supabase é projetado para **mínimo vendor lock-in** (diferente do Firebase, que é mais fechado).

**Quando a migração realmente vira necessária e difícil:**

*   Se você abusar de features como RLS pesada, triggers, stored procedures e edge functions → muita lógica no banco → migrar exige reescrever tudo em código (ex.: backend server-side).
*   Realtime e storage: precisam ser substituídos (ex.: por Pusher, Cloudinary).
*   Auth: migrar usuários (senhas) é possível, mas requer exportar hashes e recriar no novo provider (Clerk, Auth0).
*   Experiência real: empresas como Val Town migraram para um Postgres simples no Render porque o Supabase era "overkill" e difícil de dev local (CLI bugado, muitos containers).
*   No Reddit, devs dizem: "Migrei tudo exceto auth, e usei Prisma + Fastify. Banco continua no Supabase por enquanto."

**Resumo prático:**

*   Para MVPs e apps pequenos/médios → Supabase é ótimo e barato.
*   Se crescer muito → migração é **viável** (mais fácil que Firebase), mas **custa tempo** se você dependeu muito de features "mágicas" (RLS, edge functions, etc.).
*   Dica: use ORMs (Prisma, Drizzle) desde o início para abstrair queries, e evite colocar lógica crítica só no banco.

Se quiser mais detalhes ou links específicos de migrações reais, me avise!

![Web page favicon](https://imgs.search.brave.com/CCE91mFCHT0FBTXf4_YPuUoMsDMI2luQsculyEq80X8/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvZmZhODZjMjE4/M2QwZTIzYThiMDky/NGYxNWQwYmEyNDkx/ODQyMmQ2ZTdlMDhi/MGU2Mjg5Mjc1ZTVj/Y2ZkMzM1Ni9zdXBh/YmFzZS5jb20v)

![Web page favicon](https://imgs.search.brave.com/CCE91mFCHT0FBTXf4_YPuUoMsDMI2luQsculyEq80X8/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvZmZhODZjMjE4/M2QwZTIzYThiMDky/NGYxNWQwYmEyNDkx/ODQyMmQ2ZTdlMDhi/MGU2Mjg5Mjc1ZTVj/Y2ZkMzM1Ni9zdXBh/YmFzZS5jb20v)

![Web page favicon](https://imgs.search.brave.com/EtKsK7FaaDPdlzpDZjziu1XWiINb9YWzo5R3rQTy9ZQ/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvZGIyYTQ4ZDVi/ZDRkODQ2NmEzMTNi/MWNlNDhiNjFhOTBk/ZTQ0ZGYyMmIyNjI5/NmMzMTk0YTY0MGRj/Yzg0NmI0Mi9ibG9n/LnZhbC50b3duLw)

47 sources

---

## Grok Replied:

E quando realmente precisa migrar do supabase pra um customizado? De qual escala estamos falando? Quantos usuários simultâneos?

---

## Grok Replied:

**A migração para um backend customizado (ou self-hosted Postgres + seu próprio servidor/API) geralmente acontece quando o Supabase "vira um problema" em vez de ajudar.** Isso não é sobre um número mágico de usuários — é sobre o tipo de app, como você usa as features e o volume de carga.

### Quando a migração realmente vira necessária (e difícil)

*   **Complexidade da lógica no banco** — Se você abusou de RLS pesada, triggers, stored procedures, edge functions ou queries complexas diretamente do client, migrar exige reescrever muita coisa em código server-side (ex.: Node/Express + Prisma/Drizzle). Isso é o principal motivo de migrações reais (como no caso da Val Town, que migrou para Render porque o Supabase era "overkill" e difícil de dev local).
*   **Performance e custo em escala alta** — Supabase escala bem para apps normais (com compute upgrades), mas se você precisa de tuning fino (sharding, custom extensions, zero-latency), self-hosted ou AWS RDS/Neon vira melhor.
*   **Requisitos específicos** — Compliance (ex.: GDPR rigoroso), latência baixa, multi-region, ou querer controlar tudo (sem vendor lock-in).

### Escala típica: Quantos usuários simultâneos?

Não há um limite fixo, mas aqui vai um breakdown realista baseado em relatos de devs (Reddit, GitHub, cases da Supabase):

| Plano/Instância | Concurrentes (Realtime + DB) | Usuários ativos mensais (MAU) | Exemplos reais / Quando problemas começam |
| --- | --- | --- | --- |
| Free | ~200 concurrentes (Realtime) | Até ~50k MAU | Bom para hobby/MVP. Problemas: pausar inativo, limites de storage/bandwidth. |
| Pro (padrão, ~$25/mo) | 500–1k concurrentes (base) + pooler | 100k–500k MAU | Muitos apps rodam bem com 10k–50k usuários/dia. Upgrade compute (Small/Large) lida com 1k–5k concurrentes. |
| Pro + upgrades (Large/2XL) | 5k–10k+ concurrentes (com replicas) | 500k–milhões MAU | Apps como Resend, Mobbin escalaram para 1M+ usuários sem migrar. Problemas raros: queries lentas se mal otimizadas. |
| Enterprise/Custom | Milhões concurrentes | Milhões+ | Empresas grandes usam (ex.: Phoenix Energy migrou apps com alto volume). |

*   **Apps reais que escalaram bem no Supabase**:
    *   Apps com 100k–1M MAU: Muitos (ex.: casos oficiais da Supabase mostram 1M usuários em 7 meses com Auth).
    *   10k–50k usuários/dia: Tranquilo no Pro + compute upgrade (~$100–300/mo).
    *   Problemas comuns em 5k–10k concurrentes: Realtime lento se muitos subscriptions, ou DB bottleneck se RLS pesada (cada mudança checa 100x por usuário).
*   **Quando devs migram de verdade**:
    *   50k–200k MAU: Se o app é realtime-heavy (chat, multiplayer) ou tem queries ruins → migram para self-hosted ou backend custom.
    *   > 500k MAU: Alguns migram para custo menor (ex.: Hetzner self-hosted ~$5–50/mo vs Supabase $800+).
        
    *   Val Town (exemplo clássico): Migrou cedo porque local dev era péssimo, não por escala (milhares de usuários).
    *   Outros: Apps que viram "muito" lógica no banco e precisavam de controle total.

### Resumo prático

*   **Até ~100k–500k MAU / 1k–5k concurrentes**: Supabase é ótimo e barato. Foque em otimizar queries, índices e RLS desde o início.
*   **Acima disso ou se precisar de custom**: Migre para self-hosted Supabase (Docker) ou backend full custom (ex.: Fastify/Prisma + Postgres no Render/AWS). É viável, mas custa tempo (especialmente Auth e Realtime).
*   **Dica**: Use ORM (Prisma/Drizzle) + backend server-side desde o começo → migração fica fácil (banco continua Postgres).

Se o seu app for um SaaS normal, chat simples ou tool, o Supabase aguenta bem até escalar muito. Conte mais sobre o seu caso (tipo de app, realtime?) que eu ajudo a estimar melhor! 🚀

![Web page favicon](https://imgs.search.brave.com/CCE91mFCHT0FBTXf4_YPuUoMsDMI2luQsculyEq80X8/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvZmZhODZjMjE4/M2QwZTIzYThiMDky/NGYxNWQwYmEyNDkx/ODQyMmQ2ZTdlMDhi/MGU2Mjg5Mjc1ZTVj/Y2ZkMzM1Ni9zdXBh/YmFzZS5jb20v)

![Web page favicon](https://imgs.search.brave.com/CCE91mFCHT0FBTXf4_YPuUoMsDMI2luQsculyEq80X8/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvZmZhODZjMjE4/M2QwZTIzYThiMDky/NGYxNWQwYmEyNDkx/ODQyMmQ2ZTdlMDhi/MGU2Mjg5Mjc1ZTVj/Y2ZkMzM1Ni9zdXBh/YmFzZS5jb20v)

![Web page favicon](https://imgs.search.brave.com/CCE91mFCHT0FBTXf4_YPuUoMsDMI2luQsculyEq80X8/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvZmZhODZjMjE4/M2QwZTIzYThiMDky/NGYxNWQwYmEyNDkx/ODQyMmQ2ZTdlMDhi/MGU2Mjg5Mjc1ZTVj/Y2ZkMzM1Ni9zdXBh/YmFzZS5jb20v)

70 sources

---

