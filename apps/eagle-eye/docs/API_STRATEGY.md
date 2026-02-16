# 🦅 Eagle Eye: Estratégia de APIs & Custos

> **Objetivo:** Maximizar a inteligência de dados com o menor custo operacional possível, usando uma arquitetura "On-Demand".

## 1. Stack Recomendada (Tourism & Scraper)

| Categoria | Provedor | Custo Estimado | Uso no Eagle Eye |
| :--- | :--- | :--- | :--- |
| **Search & Social** | **Exa.ai** (Antigo Metaphor) | $10/mês (1k searches) | Encontrar posts no Reddit, Instagram, Notícias Locais ("Social Listening"). |
| **Places & Maps** | **Google Places API** (New) | $0 - $200 (Tier Grátis generoso) | Validar existência de negócios, puxar reviews e fotos oficiais. |
| **LLM Intelligence** | **OpenRouter** (Gemini Flash 2.0) | < $5/mês (Pay-as-you-go) | Analisar sentimento, extrair dados de gazetas, conversar com cidadãos. |
| **Scraper Oficial** | **Querido Diário API** | **Grátis** (Open Source) | Monitorar diários oficiais (Licitações, Leis). |
| **Crowdsourcing** | **Eagle Eye Database** (Próprio) | Custo de Servidor (Supabase/Postgres) | Armazenar dados enviados pelos cidadãos (Fotos, Reviews). |

---

## 2. Detalhe Operacional

### 🌍 Google Maps & Places (A Base)
*   **Estratégia:** Não fazer "scan" da cidade inteira todo dia (caro).
*   **Uso:** Apenas quando um usuário submete um local OU quando o Scraper detecta uma oportunidade.
*   **Custo:** O Google dá $200 de crédito mensal grátis. Isso cobre milhares de requisições se otimizado.

### 🧠 Exa.ai (O Radar Social)
*   **Por que:** O Google Search API é caro e cheio de anúncios. O Exa é feito para AI.
*   **Query Exemplo:** `site:instagram.com "patos de minas" "cachoeira" -explore`
*   **Custo:** O plano básico ($10) é suficiente para um monitoramento diário de 30-40 tópicos.

### 🤖 LLM (O Cérebro)
*   **Modelo:** `google/gemini-2.0-flash-001` (Rápido e barato).
*   **Custo:** Centavos por milhão de tokens. Imbatível para análise em massa.

---

## 3. Gamification & Recompensas (Custo de Incentivo)
Para engajar os cidadãos, o custo não é em API, mas em **Benefícios**.

*   **Ranking:** "Guia Local" (Status Social).
*   **Parcerias:** Comércio local oferece desconto para quem está no Top 10 (Custo Zero para nós).
*   **API de Prêmios:** Futuramente, integração com sistemas de vouchers.

## 4. Integrações Futuras (Roadmap)
*   **Wikiloc (Unofficial):** Scraper (cuidado com termos de uso) para trilhas.
*   **WhatsApp API (Waha/Baileys):** Para o "Citizen Reporter" rodar no Zap (Alta conversão).
