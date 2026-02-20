# Architecture Decision: Shift from x402 to BYOK (Bring Your Own Key)

## Context
The original monetization strategy for the EGOS M2M API involved complex crypto smart contracts (x402 protocol on Solana) and dynamic `$ETHIK` reputation score discounts based on Sacred Math (Fibonacci/Phi). The goal was to build a robust payment tier for AI Agents.

## Decision
On 2026-02-19, it was decided to radically simplify the Day 1 architecture by removing the `x402` payment interception and fully adopting a **BYOK (Bring Your Own Key)** model for the primary "Zero Friction" tier.

## Justification
* **Time-to-Market:** Implementing dynamic L402 macaroon verification, wallet management (via Coinbase Developer Platform), and fractional distribution (Genki Dama pool) added extreme friction to the API execution flow.
* **Developer UX:** For developers and AI Agents trying to adopt EGOS, the simplest and most trusted hook is passing their existing `x-openrouter-key`. Since inferencing costs fall directly on the user's OpenRouter account, EGOS platform costs approach zero for this tier.
* **Trust & Security:** We do not persist or log user keys. The code explicitly passes the user's key to the ephemeral Sandboxed worker and destroys the payload.

## Implications
* `/api/run-audit` now explicitly checks for the `x-openrouter-key` header instead of the `L402` or `Authorization` crypto headers.
* `llms.txt` has been rewritten to advertise the BYOK "Free Tier".
* The `$ETHIK` scaling and gamification complexity is deferred to a future phase, to be replaced immediately with a much simpler Database-level referral mechanic (+10 free audits for referring a developer).

## Metadata
- **Tags:** #architecture, #monetization, #api, #byok, #mvp
- **Status:** Implemented
- **Author:** EGOS Sentinel (Auto-Dissemination)
