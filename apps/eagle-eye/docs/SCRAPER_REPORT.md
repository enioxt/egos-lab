# 🦅 Eagle Eye: Relatório de Verificação (Scraper & Stitch)

> **Data:** 16/02/2026
> **Foco:** Patos de Minas (MG)

## 1. Scraper de Diários Oficiais (`eagle-eye`)
Testei a extração de dados reais focando em "Turismo", "Eventos" e "Publicidade".

### 📊 Resultados
- **Patos de Minas (ID 3148004):** ❌ **Sem dados recentes** (2025/2026) na API Querido Diário.
- **Teste Global:** ✅ **Funcional**. Encontrei +10.000 gazetas com o termo "turismo" em todo o Brasil.
    - *Exemplo Recente:* "Marília" (14/02/2026) - Abertura de Licitação para Eventos.

### 💡 Diagnóstico
O motor do Eagle Eye funciona, mas a fonte de dados (Querido Diário) parece não estar indexando Patos de Minas em tempo real.
**Sugestão:** Para demonstrações, podemos usar uma cidade "proxy" com dados ativos (ex: Marília, Belo Horizonte) ou focar na funcionalidade de **Análise de Arquivos Locais** (onde o usuário faz upload do PDF).

---

## 2. Design do Dashboard (Stitch)
Criei prompts otimizados para você gerar as telas no Google Stitch.
📄 Arquivo: [`apps/eagle-eye/docs/STITCH_PROMPTS.md`](file:///home/enio/egos-lab/apps/eagle-eye/docs/STITCH_PROMPTS.md)

### Telas Desenhadas (Conceito):
1.  **HUD Executivo:** Score da cidade + Alertas Críticos.
2.  **Inventário:** Cards visuais dos ativos (Cachoeiras, Hotéis).
3.  **Simulador de Campanha:** "Carrinho de compras" de mídia (Outdoor, LED).
4.  **Feed de Oportunidades:** Timeline estilo Twitter vinda do Scraper.
