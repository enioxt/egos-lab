---
description: Transforms any complex real-world domain into scalable primitives, tools, and DB models (The Descript Engine).
---

# Domain-to-Solution Workflow (/domain)

Use este workflow quando quiser transformar um setor complexo ou problema de negócio em uma solução de software robusta baseada em primitivas estruturadas.

**Inspirado na arquitetura do Descript (Culture as Code / Structured Databases).**

## Passo a Passo

1. **Exploração do Domínio (Pesquisa Base):**
   - O agente usará a web para pesquisar o domínio fornecido pelo usuário.
   - Identificará as ferramentas open-source consolidadas de baixo nível que resolvem os problemas centrais (ex: FFmpeg para vídeo, Tesseract para OCR, Puppeteer para scraping).
   
2. **Extração de Primitivas:**
   - O agente quebrará o domínio em "Primitivas Core" (operações fundamentais).
   - *Regra de Ouro:* Nunca reinvente a roda. Se existe uma flag CLI para isso, essa é a primitiva.

3. **Arquitetura de Dados (SSOT):**
   - O agente criará um modelo de dados (tabelas Supabase/PostgreSQL) que represente o **estado** dessas primitivas, transformando a complexidade do domínio em um CRUD simples.

4. **Documentação:**
   - O agente salvará o resultado em `docs/domains/[nome_do_dominio].md`.

## Como Iniciar

Digite: `/domain [Nome do Domínio ou Problema]`
Exemplo: `/domain Edição de Vídeo` ou `/domain Registro de Marcas no INPI`
