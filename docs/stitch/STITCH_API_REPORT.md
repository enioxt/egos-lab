# 🕵️ Relatório: Viabilidade de Geração de UI via "Stitch API"

## 1. O que encontramos
Não existe uma "API do Stitch" oficial (Google Stitch é geralmente uma ferramenta interna de design). O que encontramos no seu computador (`carteira-livre`) é o serviço **Nano Banana**, que usa o **OpenRouter** para acessar modelos capazes de gerar imagens de UI.

**Arquivo encontrado:** `/home/enio/carteira-livre/services/nano-banana.ts`
**Modelo utilizado:** `google/gemini-3-pro-image-preview` (ou `google/gemini-2.0-flash-001` para texto).

## 2. Custo Estimado (OpenRouter)
O modelo `google/gemini-2.0-flash-001` é extremamente barato.
O modelo de imagem (`preview`) varia, mas geralmente segue a linha de baixo custo do Google.

| Recurso | Modelo | Custo Estimado |
|---------|--------|----------------|
| **Texto/Prompts** | `gemini-2.0-flash` | ~$0.10 / 1M tokens (Irrisório) |
| **Geração Imagem** | `gemini-pro-vision` | ~$0.004 - $0.04 / imagem (Estimativa) |

**Custo para gerar as 7 telas do EGOS Lab (3 variações cada):**
- 7 telas x 3 variações = 21 imagens.
- Custo total estimado: **Menos de US$ 1.00**.

## 3. Plano de Ação (Recomendado)
Podemos portar o `nano-banana.ts` para o `egos-lab` como um agente (`agent:ui-designer`) que:
1. Lê o arquivo `docs/stitch/ALL_PLATFORM_PROMPTS.md`.
2. Envia para o OpenRouter.
3. Salva os mockups em `docs/stitch/mockups/`.

**Você aprova portar o serviço Nano Banana para o EGOS Lab agora?**
