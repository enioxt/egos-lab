# Ferramenta de Análise de Gastos

**User:** Enio Rocha (enioxt@gmail.com)  
**Created:** 2/11/2026 9:07:24  
**Updated:** 2/11/2026 13:26:56  
**Exported:** 2/12/2026 22:58:48  
**Link:** [https://chatgpt.com/c/698c70fb-d308-832c-93fd-51804da5d1bf](https://chatgpt.com/c/698c70fb-d308-832c-93fd-51804da5d1bf)  

## Prompt:
Me ajude com a seguinte questão: sobre o Portal da Transparência, vamos focar em Minas Gerais. Tem como usarmos, seja API, webscraper, para construir uma ferramenta que verifica todos os dados públicos de gastos do governo, mostrando categorização por área de todos os gastos e avaliando ali a importância de acordo com o sentimento da população e do governo e dos dados também de IDH, econômicos e outros, para vermos onde tem gap, onde está indo o dinheiro que talvez não deveria e onde falta dinheiro. Meu objetivo principal é, por exemplo, pegar setores que estão defasados, muito defasados, e mostrar a importância de um olhar para aquele setor, às vezes simplesmente remanejando parte dos gastos de outros lugares, obedecendo claramente a questão da legislação, da destinação exclusiva para alguns lugares, mas mesmo assim, acho que conseguimos ter um panorama melhor se tivermos uma ferramenta dessa que categoriza tudo e pegue os dados públicos ali, trate eles da melhor forma num dashboard visual, com pesquisas fáceis por áreas, com números, indicadores, insights, com camadas de inteligência artificial em todas as etapas, usando, por exemplo, a API da OpenRouter em um modelo rápido e barato como o Gemini 2.0 Pro da versão paga ou outros, já que a API, o custo é barato, podemos usar até modelos melhores para isso. Já desenhe toda a documentação para mim.

## Response:
Thought for 3m 54s

Enio, dá sim — e em Minas Gerais dá pra fazer **bem melhor que webscraper**, porque o próprio Governo de MG publica **bases abertas estruturadas** (CKAN) que alimentam o Portal da Transparência.

A boa notícia: o dataset **“Despesa pública”** do Portal de Dados Abertos de MG já vem como **modelo dimensional** (fato + dimensões), documentado em padrão Frictionless, e cobre despesas **empenhadas, liquidadas e pagas, ano a ano**. [dados.mg.gov.br](https://dados.mg.gov.br/it/dataset/despesa)  
E o portal expõe **API CKAN (Action API + DataStore)** com endpoints de consulta. [dados.mg.gov.br+1](https://www.dados.mg.gov.br/id/api/1/util/snippet/api_info.html?resource_id=b59c1d45-71d3-46dc-bbcc-79f678970500&utm_source=chatgpt.com)

Abaixo vai uma documentação “de projeto”, já no nível de você copiar pro repositório e começar a executar.

* * *

1) Visão do produto
-------------------

### Nome (placeholder)

**Radar do Gasto MG** (pode renomear depois)

### Objetivo

Criar uma plataforma que:

1.  **ingere e normaliza** dados públicos de gasto do Estado de MG (planejado e executado)
2.  **categoriza** em áreas (saúde, educação, segurança, infraestrutura etc.) usando classificação oficial + enriquecimento por IA
3.  cruza com **indicadores socioeconômicos** (IDH/IDHM, renda, mortalidade, violência, escolarização etc.)
4.  estima “**gap de prioridade**” (necessidade vs gasto)
5.  produz **dashboard + busca** + **insights explicáveis** (com números e rastreabilidade), evitando acusação/hallucinação.

> Filosofia: **LLM não decide** nem “julga”. LLM ajuda a **rotular, resumir, explicar e facilitar busca**. O cálculo de gap e métricas é determinístico.

* * *

2) Fontes de dados (Minas Gerais + Brasil)
------------------------------------------

### 2.1. Execução orçamentária / despesas (MG)

**Portal de Dados Abertos MG (CKAN)**

*   Dataset: **Despesa pública** (empenho/liquidação/pagamento)
*   Licença CC-BY-4.0 (exigir atribuição no app) [dados.mg.gov.br](https://dados.mg.gov.br/it/dataset/despesa)
*   Estrutura: modelo dimensional (tabelas fato + dimensões) [dados.mg.gov.br](https://dados.mg.gov.br/it/dataset/despesa)
*   Acesso: download (CSV/JSON) e/ou API CKAN/DataStore [dados.mg.gov.br+1](https://www.dados.mg.gov.br/id/api/1/util/snippet/api_info.html?resource_id=b59c1d45-71d3-46dc-bbcc-79f678970500&utm_source=chatgpt.com)

### 2.2. Planejamento orçamentário (MG)

A SEPLAG divulgou recentemente conjuntos de dados que conectam **planejamento → execução**, com origem no **Armazém SIAFI (despesas realizadas)** e **SISOR (planejamento)**, com **atualização diária** segundo publicação oficial. [Gov Innovation Services](https://www.mg.gov.br/planejamento/noticias/governo-de-minas-amplia-transparencia-e-divulga-novos-dados-orcamentarios-no-portal-de-dados-abertos)  
Isso é ouro pro seu caso: permite comparar “prometido vs entregue”.

### 2.3. Indicadores socioeconômicos (Brasil)

*   **IDHM e +200 indicadores (Atlas/UNDP)** (há base para download) [UNDP+1](https://www.undp.org/pt/brazil/atlas-dos-municipios?utm_source=chatgpt.com)
*   **IBGE – API de dados agregados (SIDRA)** pra população, PIB, séries etc. [IBGE+1](https://servicodados.ibge.gov.br/api/docs/agregados?versao=3)

### 2.4. Regras/amarrações legais (pra “remanejamento responsável”)

Seu motor de “sugestão de realocação” tem que respeitar **vinculações e limites**. Exemplos bem típicos:

*   Educação: CF art. 212 (mínimo de aplicação) [JusBrasil](https://www.jusbrasil.com.br/topicos/10649122/artigo-212-da-constituicao-federal-de-1988?utm_source=chatgpt.com)
*   Saúde: LC 141/2012 (regras de mínimo e apuração) [Planalto](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp141.htm?utm_source=chatgpt.com)
*   Limites de despesa com pessoal (LRF): referência prática usada em controle de contas públicas [Serviços e Informações do Brasil](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2024/dezembro/rio-grande-do-norte-e-minas-gerais-ultrapassam-limite-de-despesa-com-pessoal-no-segundo-quadrimestre-de-2024?utm_source=chatgpt.com)

> Importante: isso não substitui parecer jurídico/contábil; a plataforma só **classifica risco/rigidez** e explica o “porquê”.

* * *

3) Estratégia de coleta: API primeiro, scraper só como fallback
---------------------------------------------------------------

### 3.1. Por que evitar webscraper?

*   Portais mudam HTML, têm paginação dinâmica e bloqueios
*   você perde rastreabilidade e escala

### 3.2. Caminho “certo”: CKAN Action API / DataStore

O CKAN oferece:

*   Action API para metadados/catálogo [docs.ckan.org](https://docs.ckan.org/en/2.9/api/?utm_source=chatgpt.com)
*   DataStore API para consultas (quando o recurso estiver no DataStore), incluindo `datastore_search` e `datastore_search_sql` [dados.mg.gov.br](https://www.dados.mg.gov.br/id/api/1/util/snippet/api_info.html?resource_id=b59c1d45-71d3-46dc-bbcc-79f678970500&utm_source=chatgpt.com)

### 3.3. Quando usar download (CSV/JSON)

Para cargas grandes históricas (2002–2025), normalmente é melhor:

*   baixar recursos por ano (CSV)
*   transformar em Parquet particionado
*   carregar num warehouse/OLAP

O dataset lista recursos por ano (ex.: “Empenho Despesa 2025 CSV”, “Despesa 2025 CSV”) e dimensões auxiliares (ex.: Ação Orçamentária, Categoria Econômica etc.). [dados.mg.gov.br](https://dados.mg.gov.br/it/dataset/despesa)

* * *

4) Arquitetura (MVP pragmático + evolução)
------------------------------------------

### 4.1. Visão em camadas

**Ingestão**

*   Conector CKAN (MG) + conector IBGE + conector Atlas IDHM
*   Agendador (daily)

**Lake / Staging**

*   Armazenar bruto: `raw/` (CSV/JSON)
*   Normalizar: `silver/` (Parquet)

**Warehouse / OLAP**

*   Postgres (MVP) → ClickHouse/DuckDB/MotherDuck (escala)

**Serviços**

*   API (FastAPI/Node) para métricas, filtros, busca
*   Serviço IA (OpenRouter) para rotulagem, resumo, Q&A com guardrails

**Frontend**

*   Dashboard (Next.js) + mapas + tabelas + “investigação” (drill-down)

### 4.2. Componentes (repositório sugerido)

```
/apps
  /web            # Next.js dashboard
  /api            # FastAPI (ou Nest) - métricas e buscas
/packages
  /ingestors      # CKAN/IBGE/IDHM connectors
  /transform      # dbt/sqlmesh + regras de qualidade
  /scoring        # gap score, rigidez legal, outliers
  /ai             # rotulagem, embeddings, prompts, eval
/docs
  /specs          # esta documentação versionada
  /data-dicts     # dicionário e taxonomias
```

* * *

5) Modelagem de dados (o coração)
---------------------------------

### 5.1. Entidades principais

**Fato de Despesa (transacional)**

*   `id_lancamento` (ou chave composta)
*   `data`
*   `valor_empenhado`, `valor_liquidado`, `valor_pago`
*   `orgao`, `unidade_gestora`
*   `funcao`, `subfuncao`, `programa`, `acao`
*   `categoria_economica`, `grupo_natureza`, `elemento`
*   `fonte_recurso`
*   `fornecedor` (quando existir)
*   `municipio_execucao` (quando existir)

**Dimensões**

*   Calendário
*   Órgão/UG
*   Classificação funcional/programática
*   Natureza da despesa
*   Fonte de recurso
*   Território (município/região)

> O dataset de MG explicitamente diz que é dimensional (fato + dimensões). [dados.mg.gov.br](https://dados.mg.gov.br/it/dataset/despesa)

### 5.2. Taxonomia “Área de Política Pública”

Você vai ter dois níveis:

1.  **Oficial**: função/subfunção/programa/ação
2.  **Humana (produto)**: “Saúde”, “Educação”, “Segurança”, “Infra”, “Assistência social”, etc.

Mapeamento inicial:

*   regra determinística (ex.: função/subfunção → área)
*   depois refino por IA em casos ambíguos (ver seção IA)

* * *

6) Motor de “gap” (necessidade vs gasto)
----------------------------------------

### 6.1. Indicadores de necessidade (Need Index)

Você define um índice composto por território (município/região) e por área, ex.:

*   Saúde: mortalidade infantil, cobertura atenção básica, leitos/1k hab (se tiver), etc.
*   Educação: escolarização, abandono, IDEB (se integrar)
*   Segurança: crimes por 100k (se integrar)
*   Vulnerabilidade: renda, saneamento, IDHM etc. [UNDP+1](https://www.undp.org/pt/brazil/atlas-dos-municipios?utm_source=chatgpt.com)

**Normalização**

*   z-score ou min-max por indicador
*   pesos por área (editáveis e transparentes)

### 6.2. Indicadores de gasto (Spend Index)

*   gasto per capita (por área e território)
*   crescimento YoY
*   share do orçamento
*   planejado vs executado (quando tiver SISOR/SIAFI) [Gov Innovation Services](https://www.mg.gov.br/planejamento/noticias/governo-de-minas-amplia-transparencia-e-divulga-novos-dados-orcamentarios-no-portal-de-dados-abertos)

### 6.3. Gap Score

Exemplo simples e bom:

*   `Gap = NeedIndex - SpendIndex`
*   sinaliza:
    *   **Gap positivo alto**: “necessidade alta vs gasto baixo”
    *   **Gap negativo alto**: “gasto alto vs necessidade baixa” (não é “errado”, é só alarme pra investigação)

### 6.4. “Rigidez legal” (para sugestões responsáveis)

Classifique cada bloco de gasto em:

*   **Não-discricionário / rígido** (pessoal, dívida, vinculações etc.)
*   **Parcialmente flexível**
*   **Discricionário**

Regras (heurísticas):

*   Natureza/elemento + fonte + órgão + histórico
*   e um “score de rigidez” com justificativa

Você cita no app que há mínimos e limites legais relevantes (educação/saúde/pessoal), com referência normativa. [JusBrasil+2Planalto+2](https://www.jusbrasil.com.br/topicos/10649122/artigo-212-da-constituicao-federal-de-1988?utm_source=chatgpt.com)

* * *

7) Camadas de IA (OpenRouter) — onde faz sentido
------------------------------------------------

### 7.1. Modelos: barato no grosso, forte no fino

Na OpenRouter, você consegue usar modelos como:

*   `google/gemini-2.0-flash-001` (rápido/mais barato) [OpenRouter](https://openrouter.ai/google/gemini-2.0-flash-001?utm_source=chatgpt.com)
*   `google/gemini-2.5-pro` (melhor raciocínio pra relatórios narrativos) [OpenRouter](https://openrouter.ai/google/gemini-2.5-pro?utm_source=chatgpt.com)  
    E tem catálogo/Models API pra listar tudo programaticamente. [OpenRouter](https://openrouter.ai/docs/guides/overview/models?utm_source=chatgpt.com)

> Eu faria: Flash/Lite pra rotulagem em massa + 2.5 Pro pra “relatórios premium”.

### 7.2. Tarefas ideais pra IA

1.  **Enriquecimento semântico**
    *   pegar descrições (programa/ação/objeto) e propor tags (“atenção básica”, “obras escolares”, “patrulhamento”, etc.)
2.  **Desambiguação de categoria**
    *   quando regra determinística falhar
3.  **Busca em linguagem natural (NL→SQL)**
    *   com sandbox: só SELECT, limite, whitelists
4.  **Narrativas explicáveis**
    *   “Por que essa área aparece com gap alto?” (sempre citando números e fontes internas)

### 7.3. Regras anti-hallucinação

*   IA só pode usar dados vindos do seu banco (RAG com “tabelas agregadas”)
*   saída sempre com:
    *   métricas citadas (valores)
    *   período
    *   nível geográfico
    *   “confiança” e “limitações”

### 7.4. Prompt base (exemplo curto)

```text
Você é um analista de políticas públicas. Use SOMENTE os dados fornecidos em JSON.
Tarefa: explicar por que um GapScore é alto e sugerir hipóteses verificáveis.
Responda em PT-BR. Proíba acusações de ilegalidade. Traga 3 próximos passos de investigação.
Saída em JSON com campos: resumo, sinais, hipóteses, próximos_passos, limitações.
```

* * *

8) Dashboard e UX (o que o usuário vê)
--------------------------------------

### 8.1. Telas principais

1.  **Visão geral (Estado)**
    *   cards: gasto total (empenhado/liquidado/pago), top áreas, variação YoY
2.  **Mapa / Território**
    *   gap por região/município (com filtros)
3.  **Área (ex.: Saúde)**
    *   gasto per capita por território
    *   indicadores de necessidade
    *   ranking de gaps
4.  **Explorador de despesas**
    *   tabela filtrável (órgão, função, fornecedor, elemento…)
    *   drill-down até o lançamento
5.  **Planejado vs Executado**
    *   LOA/SISOR vs SIAFI (quando integrados) [Gov Innovation Services](https://www.mg.gov.br/planejamento/noticias/governo-de-minas-amplia-transparencia-e-divulga-novos-dados-orcamentarios-no-portal-de-dados-abertos)
6.  **Relatórios IA**
    *   “Resumo executivo” + “hipóteses” + “perguntas de auditoria”

### 8.2. Busca

*   campo único: “gastos com hospital regional em 2024”
*   sugestões automáticas (facetas)
*   “salvar consulta” (link compartilhável)

* * *

9) Scraper (fallback) — quando usar e como não dar ruim
-------------------------------------------------------

Use apenas se:

*   alguma informação existe no Portal da Transparência mas **não saiu em dados abertos**
*   ou você quer capturar metadados de páginas específicas

Boas práticas:

*   respeitar robots/limites
*   cache + ETag
*   logs completos
*   modo “headless” só se necessário

Mas: o seu core (despesas) já está bem coberto via CKAN. [dados.mg.gov.br+1](https://dados.mg.gov.br/it/dataset/despesa)

* * *

10) Governança, ética e risco (bem importante)
----------------------------------------------

*   **Sem “caça às bruxas”**: gaps e outliers são _sinais_, não prova de desvio.
*   **Explicabilidade**: tudo tem que voltar a números, categorias e fonte do dado.
*   **LGPD**: mesmo sendo “público”, trate fornecedor/pessoa física com cuidado (ex.: mascarar CPF, mostrar agregados).
*   **Auditoria do próprio sistema**: versionar taxonomias, pesos, prompts e modelos.

* * *

11) Roadmap (prático)
---------------------

### MVP (2–4 semanas, se focar)

*   Ingestão CKAN “Despesa pública” (últimos 5 anos primeiro) [dados.mg.gov.br+1](https://dados.mg.gov.br/it/dataset/despesa)
*   Warehouse + agregações (por área/órgão/território/tempo)
*   Dashboard básico + explorador
*   GapScore simples (NeedIndex com IDHM + população IBGE) [UNDP+1](https://www.undp.org/pt/brazil/desenvolvimento-humano/painel-idhm?utm_source=chatgpt.com)

### V1

*   Planejado vs executado (SISOR/SIAFI) [Gov Innovation Services](https://www.mg.gov.br/planejamento/noticias/governo-de-minas-amplia-transparencia-e-divulga-novos-dados-orcamentarios-no-portal-de-dados-abertos)
*   Rigidez legal por categoria (heurísticas + explicação)
*   IA: rotulagem + relatórios (Flash/Lite + Pro) [OpenRouter+1](https://openrouter.ai/google/gemini-2.0-flash-001?utm_source=chatgpt.com)

### V2

*   Detecção de anomalias (séries temporais, change points)
*   “Cenários de realocação” (somente em blocos discricionários)
*   trilha de investigação (checklist) e export de evidências

* * *

12) Checklist de implementação (pra você já sair fazendo)
---------------------------------------------------------

1.  **Descobrir recursos CKAN automaticamente**
    *   `package_show(id="despesa")` (pega resource\_ids)
2.  **Baixar CSV por ano** (bulk) e transformar em Parquet particionado
3.  **Criar modelo dimensional no warehouse**
4.  **Criar agregações canônicas**
    *   por função/subfunção/órgão/território/mês
5.  **Ingerir IDHM + população**
6.  **Implementar NeedIndex + SpendIndex + Gap**
7.  **Construir UI com 3 modos**
    *   overview / mapa / explorador
8.  **IA só depois que as métricas estiverem estáveis**
    *   rotulagem → busca → relatórios

* * *

Se você quiser, Enio, no próximo passo eu já te entrego **um “pacote inicial de repo”** (estrutura de pastas + contracts + exemplos de queries CKAN + schemas SQL + endpoints da API + wireframe textual das telas). Eu não preciso de mais nada pra isso — só vou assumir Next.js + FastAPI e um warehouse (Postgres no MVP) e já mando o kit.



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)