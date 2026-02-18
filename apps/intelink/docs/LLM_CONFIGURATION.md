# 🤖 Configuração de LLM - Intelink

> **IMPORTANTE:** O Intelink usa **OpenRouter** como proxy para todos os modelos de IA.
> NÃO usamos a API da OpenAI diretamente.

## Variáveis de Ambiente

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-xxx  # Obrigatório
OPENROUTER_MODEL=google/gemini-2.0-flash-001  # Modelo padrão (PAGO - sem rate limit)
```

## Endpoints Usados

### 1. Chat/Completions (Extração de Entidades)
```
POST https://openrouter.ai/api/v1/chat/completions
Model: google/gemini-2.5-flash (ou OPENROUTER_MODEL)
```

**Usado em:**
- `/api/documents/extract` - Extração de entidades de documentos
- `/api/chat` - Chat com operações

### 2. Embeddings (Cross-Investigation Intelligence)
```
POST https://openrouter.ai/api/v1/embeddings
Model: openai/text-embedding-3-small
Dimensions: 1536
```

**Usado em:**
- `/api/documents/embeddings` - Geração de vetores para similaridade
- Cross-investigation detection

## Headers Obrigatórios

```typescript
headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://intelink.app',  // Identificação do app
    'X-Title': 'Intelink Document Extraction' // Título para analytics
}
```

## Modelos Disponíveis

| Modelo | Uso | Custo |
|--------|-----|-------|
| `google/gemini-2.5-flash` | Extração de entidades | Pago |
| `google/gemini-2.0-flash-001` | Chat/extração (PADRÃO) | $0.10/1M |
| `openai/text-embedding-3-small` | Embeddings | $0.02/1M tokens |

## Arquivos Relacionados

- `apps/intelink/app/api/documents/extract/route.ts` - Extração LLM
- `apps/intelink/app/api/documents/embeddings/route.ts` - Embeddings
- `apps/intelink/app/api/chat/route.ts` - Chat com IA
- `apps/intelink/lib/prompts/` - System prompts centralizados

## Testando

```bash
# Testar extração
curl -X POST http://localhost:3001/api/documents/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "Homicídio em Patos de Minas...", "document_type": "reds"}'

# Testar embeddings
curl -X POST http://localhost:3001/api/documents/embeddings \
  -H "Content-Type: application/json" \
  -d '{"document_id": "test", "investigation_id": "test", "content": "..."}'
```

## Troubleshooting

### "OPENROUTER_API_KEY not configured"
- Verifique se `.env.local` tem a variável definida
- Reinicie o servidor Next.js após alterar `.env.local`

### "Could not find table document_embeddings"
- Execute a migração `20251205_document_embeddings.sql` no Supabase

### "401 Unauthorized"
- Verifique se a API key está correta em https://openrouter.ai/settings/keys

---

*Atualizado em: 2025-12-04*
