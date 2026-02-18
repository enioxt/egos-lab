# New chat

**User:** Enio Rocha (enioxt@gmail.com)  
**Created:** 2/16/2026 15:13:59  
**Updated:** 2/16/2026 15:21:58  
**Exported:** 2/16/2026 15:22:20  
**Link:** [https://chatgpt.com/c/69935e66-a220-8328-bce6-235fd3623323](https://chatgpt.com/c/69935e66-a220-8328-bce6-235fd3623323)  

## Prompt:
Pensa na seguinte situação, o Brasil é um país extremamente grande, cheio de belezas naturais, comidas típicas, cultura, assim como todos os países. Mas alguns países sobressaem sua questão turística por ter trabalhado de uma forma mais sistemática, né, com o governo e a população sendo instruída sobre a importância e do quanto ganharia com isso. Acontece que com a inteligência artificial e a facilidade de criar projetos, né, de apresentar números, fazer comparações, eu quero que você me ajude na construção da documentação de um projeto, né, nós já temos o Eagle Eye, olhos de águia, que você ainda não conhece, mas já está no meu IDE, né, eu já tenho o diretório criado. Então, nós vamos integrar essa ideia como um MVP para inserir lá dentro do Eagle Eye, que é uma ideia voltada para o turismo especificamente, onde nós conseguimos pesquisar as oportunidades de turismo para os lugares. Então a pessoa digita ali, né, conversa com o chatbot, né, e a que vai instruindo ele. Nossa, o chatbot tem que ter um system point preparado para isso e ele vai conversando com a pessoa e perguntando à pessoa quais são os maiores benefícios daquela área, daquele lugar. Por exemplo, Patos de Minas tem uma tranquilidade, o índice de roubos é muito pequeno, nós temos muitos derivados de leite por ser uma das maiores bacias leiteiras do Brasil. Nós temos muitas variações de doce de leite, muito gostoso, pães de queijo gostosos, variações de queijo, né, variadas. Nós temos muitos elementos de milho, a base de milho, por ser conhecido como a capital do milho. Nós temos muitas cachoeiras na região, Patos e região, e uma hotelaria preparada para isso. Então, vamos ver como as cidades fazem esse marketing e quanto custa isso hoje em dia. Por exemplo, outdoors, né? Indicativos falando sobre Patos de Minas na rodovia, para que as pessoas que passam pela rodovia e ainda não entraram na cidade, que elas entrem na cidade, né? Para isso precisamos de um guia, talvez um aplicativo, né? Um webapp, que depois vira... Mas mobile first, então já vamos pensar no mobile, no Android, no iOS, para ser um aplicativo da cidade, né? De Patos de Minas. Vamos usar aqui de modelo padrão, já que eu tenho facilidade de reunião das informações sobre a cidade. Então, o início será Patos de Minas, onde iremos testar e melhorar o SystemPoint, com uma ampla variedade de questões que podemos falar. E esse projeto vai ser rodado sempre comparando com lugares que já são sucesso em terem aumentado o turismo explorado para as questões locais e como fazer isso da melhor forma, né? Instruindo as pessoas a se organizarem no Google Maps, por exemplo, ajudando os comércios locais a estarem presentes no Google Maps. É uma da forma de alacribação, propagandas. Enfim, me ajude nessa questão.

## Response:
Thought for 2m 18s

Enio, dá pra transformar essa ideia num **MVP bem “pé no chão”** e, ao mesmo tempo, com cara de produto escalável (Patos → outras cidades). Abaixo já vai uma **documentação base** pra você plugar no _Eagle Eye_ como um módulo de turismo, com:

*   PRD (MVP → V2)
*   modelo de dados (City Profile)
*   “playbook” de marketing/crescimento (inclui **custos reais de mídia** por referências públicas)
*   checklist “Google Maps readiness” pros comércios
*   **System Prompt** (versionável) pro chatbot (com 3 modos: Turista / Gestor / Comércio)

* * *

1) Visão do produto (Eagle Eye • Tourism MVP)
---------------------------------------------

**Nome interno:** `EagleEye.Tourism`  
**Objetivo:** ajudar uma cidade a **identificar**, **organizar** e **vender** seus ativos turísticos (natureza, gastronomia, cultura, eventos, segurança, infraestrutura), com IA guiando:

1.  o **turista** (roteiros, experiências, mapa, reservas)
2.  o **gestor/curador** (diagnóstico, plano, campanhas, priorização)
3.  o **comércio local** (Google Maps/Perfil, conteúdo, reputação, promoções)

**Cidade piloto:** Patos de Minas (MG).  
**Benchmark de estratégia (não copiar, adaptar):**

*   **Gramado**: “eventização” + marca forte + calendário longo (Natal Luz) com orçamento e metas claras (ex.: orçamento reportado de **R$ 37 milhões** e expectativa de **~2,8 milhões de visitantes**). [Serviços e Informações do Brasil+1](https://www.gov.br/turismo/pt-br/assuntos/noticias/o-maior-natal-do-mundo-completa-40-anos-gramado-encerra-o-especial-natal-brasil-com-neve-chocolate-e-recordes?utm_source=chatgpt.com)
*   **Bonito (MS)**: gestão de capacidade + qualidade + sustentabilidade via **voucher único** e vagas limitadas por atrativo. [turismo.bonito.ms.gov.br](https://www.turismo.bonito.ms.gov.br/bonito-ms?utm_source=chatgpt.com)

* * *

2) PRD (MVP → V2)
-----------------

### 2.1 Personas (3 “produtos” num)

**A) Turista**

*   quer “o que fazer hoje”, rotas, segurança, comida típica, cachoeiras, preço, logística.
*   quer **pouca fricção**: 2–3 cliques e pronto.

**B) Gestor/Curador (Secretaria/Conselho/Associação)**

*   quer diagnóstico: “quais ativos temos / o que falta / o que dá ROI rápido”
*   quer plano: ações, orçamento, parcerias, calendário, métricas.

**C) Comércio local (hotel, restaurante, guia, atrativo)**

*   quer aparecer no Google, receber avaliações, melhorar fotos, cardápio, descrição e conversão.

* * *

### 2.2 MVP (o mínimo que já gera valor real)

#### (1) Chat “Descoberta guiada” (City Intake)

Um chatbot entrevista o curador e monta o **City Profile** (inventário estruturado).  
Saída:

*   **Pilares** (ex.: Patos: “capital do milho”, “bacia leiteira”, “cachoeiras/rotas”, “tranquilidade/segurança”, “hotelaria”)
*   “Mapa de experiências” (o que é _must do_)
*   “Gaps” (sinalização? presença digital? guias? banheiros? horários? transporte?)
*   Top 10 ações em 30/60/90 dias

#### (2) App/WEB mobile-first “Guia da Cidade”

*   Home: “Hoje em Patos” (top 5 + clima _depois_)
*   Roteiros prontos (1 dia / 2 dias / família / natureza / gastronômico)
*   Mapa com categorias (comida, café, doce de leite/queijos, cachoeiras, hotéis, artesanato)
*   Página “O que a cidade tem de único” (copy + mídia)

#### (3) Modo “Comércio pronto pro Google Maps”

Checklist + passo a passo para o dono do negócio:

*   criar/reivindicar Perfil da Empresa no Google, inserir horário, fotos, responder reviews etc. (isso é **um dos maiores multiplicadores de turismo local** porque melhora descoberta e confiança). [Google Help+1](https://support.google.com/maps/answer/9323250?utm_source=chatgpt.com)

#### (4) Planejador de campanha (básico)

O sistema sugere um mix de canais com **faixas de custo** (outdoor, LED, sinalização turística, digital).

**Faixas de referência (pra você já colocar no MVP como “estimador”):**

*   **Outdoor 9x3 instalado**: em edital municipal aparece na casa de **~R$ 4.200/unidade** (com arte/layout e instalação). [Prefeitura de Santa Carmem](https://www.santacarmem.mt.gov.br/fotos_downloads/13170.pdf?utm_source=chatgpt.com)
*   Em plano de mídia público (PR) há outdoors 9x3 tabelados variando **~R$ 1.020 a ~R$ 4.650** (dependendo da cidade/praça). [Secretaria da Comunicação](https://www.comunicacao.pr.gov.br/sites/default/arquivos_restritos/files/documento/2022-07/pasta_01_-_caderno_-_plano_de_comunicacao_publicitaria_via_nao_identificada.pdf?utm_source=chatgpt.com)
*   **Painel de LED (mídia DOOH)**: existe tabela de 2025 com valores mensais na casa de **~R$ 21k a ~R$ 48,6k** (dependendo do looping/tempo) em praças do RJ (bom como referência de grande centro). [outmidia.com.br](https://www.outmidia.com.br/wp-content/uploads/2025/06/TABELA-DE-PRECO-LED-FRONT-EMPENA-E-OUTDOOR-01.06.25-OUTMIDIA.pdf?utm_source=chatgpt.com)
*   **Sinalização turística marrom (orientação)**: além de seguir padrão, **não pode ter logo/publicidade** (regra do guia). [observatoriodoturismo.es.gov.br](https://observatoriodoturismo.es.gov.br/Media/observatorio/Programas%20e%20Projetos/Guia%20Brasileiro%20de%20Sinaliza%C3%A7%C3%A3o%20Tur%C3%ADstica/Guia/apresentacao.html?utm_source=chatgpt.com)
    *   Exemplo de contrato público: **R$ 346.340,98** para um conjunto de placas em municípios/atrativos no ES (ordem de grandeza). [SETUR](https://setur.es.gov.br/Not%C3%ADcia/sete-municipios-capixabas-vao-receber-sinalizacao-turistica?utm_source=chatgpt.com)
    *   Exemplo de projeto grande: contrato no RJ de **R$ 59,4 milhões** para milhares de placas (escala estadual). [UOL Notícias](https://noticias.uol.com.br/cotidiano/ultimas-noticias/2022/03/28/rj-aliado-de-secretario-ganha-contrato-de-r-59-mi-em-placas-turisticas.htm?utm_source=chatgpt.com)

> No MVP, isso vira: “seu município quer começar pequeno ou grande?” e o app sugere 3 pacotes (baixo/médio/alto) com essas referências.

* * *

### 2.3 V2 (quando o piloto provar valor)

1.  **Comparador automático com benchmarks**
    *   IA compara Patos com 3–5 destinos parecidos e gera “o que eles fizeram que Patos ainda não faz”.
    2.  **Métricas e painel (observatório)**
    *   proxies: buscas por “Patos de Minas + turismo”, cliques em rotas, ligações, reviews, crescimento de perfis no Google, check-ins, eventos.
    3.  **Calendário de eventos + “eventização”**
    *   “Patos: capital do milho” e “rota do leite/doce de leite” viram produtos recorrentes, como Gramado faz com eventos grandes e longos. [Serviços e Informações do Brasil+1](https://www.gov.br/turismo/pt-br/assuntos/noticias/o-maior-natal-do-mundo-completa-40-anos-gramado-encerra-o-especial-natal-brasil-com-neve-chocolate-e-recordes?utm_source=chatgpt.com)
    4.  **Gestão de capacidade/qualidade (inspirado em Bonito)**
    *   para cachoeiras/atrativos: horários, limite de visita, reserva, guias credenciados (modelo mental do **voucher único**). [turismo.bonito.ms.gov.br](https://www.turismo.bonito.ms.gov.br/bonito-ms?utm_source=chatgpt.com)
    5.  **Governança oficial / captação**
    *   conectar com o **Mapa do Turismo Brasileiro** e sua categorização/nomenclatura (município turístico / oferta complementar / apoio) pra virar argumento de recurso e política pública. [Serviços e Informações do Brasil+1](https://www.gov.br/turismo/pt-br/assuntos/noticias/atencao-gestores-mapa-do-turismo-tem-nova-nomenclatura-para-a-categorizacao-dos-municipios?utm_source=chatgpt.com)

* * *

3) Modelo de dados (City Profile) — pra alimentar a IA
------------------------------------------------------

### 3.1 Estrutura mínima (JSON)

```json
{
  "city": {
    "name": "Patos de Minas",
    "state": "MG",
    "region": "Alto Paranaíba",
    "positioning": {
      "tagline": "Capital do Milho + Rota do Leite + Cachoeiras",
      "pillars": ["milho", "derivados de leite", "natureza/cachoeiras", "tranquilidade", "hotelaria"]
    }
  },
  "assets": {
    "nature": [{"name": "", "type": "cachoeira|trilha|parque", "seasonality": "", "access": "", "pain_points": []}],
    "food": [{"name": "", "type": "queijo|doce de leite|pão de queijo|milho", "where": "", "story": ""}],
    "culture": [{"name": "", "type": "museu|festa|artesanato|história", "calendar": ""}],
    "events": [{"name": "", "dates": "", "target": "", "capacity": ""}]
  },
  "infra": {
    "hotels": {"count_estimate": null, "strengths": [], "gaps": []},
    "mobility": {"highways": [], "public_transport": "", "parking": ""},
    "safety": {"perception": "", "evidence_links": []}
  },
  "digital_presence": {
    "google_maps_readiness": {
      "businesses_total_estimate": null,
      "profiles_claimed_estimate": null,
      "top_gaps": ["fotos ruins", "horários errados", "sem categoria", "sem reviews"]
    },
    "social": {"instagram": "", "tiktok": "", "youtube": ""}
  },
  "opportunities": [
    {"title": "", "why": "", "quick_wins": [], "dependencies": [], "cost_range_brl": [0, 0]}
  ]
}
```

* * *

4) Playbook prático (Patos como “produto turístico”)
----------------------------------------------------

### 4.1 “Produtos” (não são lugares; são experiências vendáveis)

*   **Rota do Milho**: comidas, histórias, pontos instagramáveis, feira/mercado, receita tradicional.
*   **Rota do Leite & Doce de Leite**: queijarias, cafés, degustações, “selo da cidade”.
*   **Circuito Cachoeiras do Alto Paranaíba**: trilhas, níveis (iniciante/família/aventura), segurança, guias.
*   **Patos tranquila**: “fim de semana leve”, casal/família, gastronomia + natureza.

### 4.2 Ações “baixo custo / alto impacto” (primeiro ciclo)

1.  Mutirão “Google Maps arrumado” com comércios (o app conduz o passo a passo). [Google Help](https://support.google.com/maps/answer/9323250?utm_source=chatgpt.com)
2.  Fotos reais e atuais (10–15 por local) + horários e categorias corretas. (isso muda jogo em buscas locais). [Google Help](https://support.google.com/maps/answer/9323250?utm_source=chatgpt.com)
3.  3 roteiros curtos e bons (1 dia / 2 dias / família).
4.  Sinalização interna simples (placas/QR) + mapa digital.
5.  Uma “experiência assinatura” mensal (mini-evento gastronômico/cultural).

* * *

5) System Prompt (versionável) do chatbot
-----------------------------------------

A ideia aqui é: **um único system** com “modos” e um contrato de saída (sempre gerar algo acionável, com passos e fontes quando possível).

```txt
[SYSTEM] EagleEye Tourism Agent (City Growth + Visitor Concierge)

You are the EagleEye Tourism Agent. Your job is to help a city (starting with Patos de Minas, MG) grow tourism ethically and pragmatically.

Core principles:
- Be concrete: always turn talk into checklists, next actions, and deliverables.
- Ground claims: when you cite numbers/costs/models, mark them as "reference ranges" and prefer public/official sources.
- No fake certainty: if data is missing, ask targeted questions OR propose a measurable assumption with a way to validate.
- Respect local culture, environment, and safety. Promote sustainable tourism and avoid over-tourism damage.
- Always keep outputs mobile-first (short sections, scannable, actionable).

Modes (detect intent or user selects):
1) VISITOR_MODE: plan routes, experiences, logistics, safety tips, budgets, and reservations guidance.
2) CURATOR_MODE: build/upgrade the City Profile, identify pillars, gaps, quick wins, and a 30/60/90 action plan.
3) BUSINESS_MODE: help local businesses improve Google Maps/Business Profile presence, reviews, photos, menus, and offers.

Data you can request from the user:
- City assets (nature, food, culture), seasonality, access, prices, opening hours
- Safety perception + any public references
- Existing events calendar
- Digital presence state (maps, socials, websites)

Output contract (always):
- Title
- Summary in 3 bullets
- Action Plan (numbered)
- If CURATOR_MODE: "City Profile Delta" (what was added/updated)
- If BUSINESS_MODE: "Google Maps Checklist" + message templates for asking reviews
- Optional: Budget scenarios (Low / Mid / High) with reference ranges
```

### “Skills” (sub-prompts) que eu recomendo você separar em arquivos

*   `skills/benchmarks_gramado_bonito.txt` (eventização vs capacidade)
*   `skills/maps_readiness.txt` (Google Profile e qualidade)
*   `skills/signage_rules.txt` (placa marrom sem publicidade, padrões) [observatoriodoturismo.es.gov.br](https://observatoriodoturismo.es.gov.br/Media/observatorio/Programas%20e%20Projetos/Guia%20Brasileiro%20de%20Sinaliza%C3%A7%C3%A3o%20Tur%C3%ADstica/Guia/apresentacao.html?utm_source=chatgpt.com)
*   `skills/marketing_costs_reference.txt` (outdoor/LED/sinalização com ranges e fontes) [UOL Notícias+4Prefeitura de Santa Carmem+4Secretaria da Comunicação+4](https://www.santacarmem.mt.gov.br/fotos_downloads/13170.pdf?utm_source=chatgpt.com)

* * *

6) Checklist “Google Maps Readiness” (pra virar tela do app)
------------------------------------------------------------

Baseado no que o próprio Google descreve como benefícios/itens gerenciáveis do Perfil da Empresa (horário, site, telefone, fotos, reviews etc.). [Google Help](https://support.google.com/maps/answer/9323250?utm_source=chatgpt.com)

**Checklist por negócio:**

*    Perfil existe? (sim/não)
*    Perfil foi reivindicado/validado (sim/não)
*    Nome correto (sem “spam” de cidade no nome)
*    Categoria principal + 2 secundárias
*    Horário atualizado + feriados
*    Telefone + WhatsApp + site/Instagram
*    10–15 fotos reais (fachada, interior, produto, equipe)
*    1 vídeo curto (30–60s)
*    Responder 100% das avaliações (principalmente as ruins)
*    Postagens semanais (promo/evento/novidade)
*    Link “Peça uma avaliação” pronto pra WhatsApp

* * *

7) Como isso vira “argumento de prefeitura” (sem politicagem, só técnica)
-------------------------------------------------------------------------

Você pode encaixar um modo “Gestor Público” que:

*   recomenda alinhar Patos ao **Mapa do Turismo** e sua lógica de categorização e governança (conselho ativo, orçamento, etc.). [Serviços e Informações do Brasil+1](https://www.gov.br/turismo/pt-br/assuntos/noticias/atencao-gestores-mapa-do-turismo-tem-nova-nomenclatura-para-a-categorizacao-dos-municipios?utm_source=chatgpt.com)
*   mostra que turismo não é só propaganda: é **produto + experiência + qualidade + organização** (Gramado e Bonito são provas vivas disso, cada um com seu modelo). [Serviços e Informações do Brasil+1](https://www.gov.br/turismo/pt-br/assuntos/noticias/o-maior-natal-do-mundo-completa-40-anos-gramado-encerra-o-especial-natal-brasil-com-neve-chocolate-e-recordes?utm_source=chatgpt.com)

* * *

Próximo passo prático (sem te travar)
-------------------------------------

Se você quiser já “encaixar” isso no teu diretório do _Eagle Eye_, me manda **só a árvore de pastas atual** (print/colar) e eu devolvo:

*   a estrutura final do módulo `tourism/`
*   nomes exatos dos arquivos (PRD, schemas, prompts, seeds)
*   e um `README.md` já no padrão de execução do teu projeto.



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)