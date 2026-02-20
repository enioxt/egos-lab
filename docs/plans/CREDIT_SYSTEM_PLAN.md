# Credit System Plan — Pay-Per-Process AI Infrastructure

> **VERSION:** 1.0.0 | **DATE:** 2026-02-20
> **ORIGIN:** GayTaoUai Gateway (EGOSv2) → evolved into universal credit system
> **STATUS:** Planning

## 1. Core Concept

Users buy credits with any payment method. Credits are consumed when they trigger AI processing.
No human involvement needed — fully automated purchase → use → deplete flow.

```
User → Buys Credits (PIX/Card/Crypto) → Credits in Account → Uses AI Features → Credits Deducted
```

## 2. Credit Architecture

### Purchase Flow

| Method | Provider | Status |
|--------|----------|--------|
| PIX | Asaas API (already integrated in Carteira Livre) | Ready to adapt |
| Credit/Debit Card | Asaas API or Stripe | Ready to adapt |
| Boleto | Asaas API | Ready to adapt |
| Crypto (BTC/ETH/USDT) | Coinbase Commerce or BTCPay Server | New integration |
| International Card | Stripe | New integration |

### Credit Pricing

| Credit Pack | Price (BRL) | Credits | Discount |
|-------------|-------------|---------|----------|
| Starter | R$ 19,90 | 100 | — |
| Pro | R$ 49,90 | 300 | 20% |
| Enterprise | R$ 149,90 | 1.000 | 33% |
| Custom | API | N | Volume |

### Cost Per Operation

| Operation | Credits | Estimated AI Cost |
|-----------|---------|-------------------|
| Entity extraction (1 document) | 5 | ~$0.002 |
| Relationship graph generation | 10 | ~$0.005 |
| Full PDF OCR + Analysis | 20 | ~$0.01 |
| Behavioral pattern detection | 15 | ~$0.008 |
| Cross-reference report (per entity) | 10 | ~$0.005 |
| Export PDF/CSV report | 2 | ~$0.001 |
| Pramana confidence scoring | 5 | ~$0.002 |

### Database Schema

```sql
-- Credit ledger (immutable, append-only)
CREATE TABLE credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL, -- positive = purchase, negative = consumption
  balance_after INTEGER NOT NULL,
  operation TEXT NOT NULL, -- 'purchase', 'consume', 'refund', 'bonus'
  description TEXT,
  reference_id TEXT, -- payment_id or operation_id
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Credit purchases
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'BRL',
  credits_granted INTEGER NOT NULL,
  payment_method TEXT, -- 'pix', 'card', 'crypto', 'boleto'
  payment_provider TEXT, -- 'asaas', 'stripe', 'btcpay'
  external_payment_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Technical Implementation

### Webhook Flow (Asaas/Stripe)

```
1. User clicks "Buy 300 Credits"
2. Frontend calls POST /api/credits/purchase { pack: 'pro', method: 'pix' }
3. API creates Asaas charge → returns PIX QR code
4. User pays
5. Asaas webhook → POST /api/webhooks/credits
6. Webhook validates → inserts into credit_ledger (+300)
7. User's balance updates in real-time (Supabase Realtime)
```

### Credit Consumption

```
1. User clicks "Analyze this document" (costs 20 credits)
2. Frontend calls POST /api/analysis/run { doc_id, type: 'full_ocr' }
3. API checks: user.balance >= 20?
4. If yes → deduct 20, run AI, return results
5. If no → return { error: 'insufficient_credits', balance: user.balance }
```

## 4. Lineage from GayTaoUai

The GayTaoUai Gateway (EGOSv2) pioneered this concept with:
- **x402 middleware**: Pay-per-API-call pattern
- **ETHIK token**: Internal currency for micro-transactions
- **Universal Payment Gateway**: Multi-currency support
- **Sacred Math scoring**: Engagement-based pricing (simplified here to flat credits)

What we keep: The credit ledger, webhook-based purchase, multi-currency support.
What we simplify: Remove sacred math complexity, use standard credit packs instead of x402.

## 5. First Application: Open Epstein Network

The credit system's first public use case:
- Free tier: Browse the graph, view public entities (0 credits)
- Paid tier: AI analysis, cross-reference reports, PDF processing, behavioral patterns
- This proves the model before scaling to other datasets/use cases
