# 🔑 Key Management & Security Best Practices

**Version:** 1.0.0
**Context:** Egos Lab (Open Source Readiness)

This document outlines the mandatory configuration standards for third-party API keys to prevent abuse, budget overruns, and security leaks.

## 1. Google Cloud Platform (GCP)
**Target:** Google Maps, Firebase, YouTube Data API.

### 🛡️ Mandatory Restrictions
Never deploy a "Unrestricted" Google Key.
1.  **Application Restriction:**
    *   **Browser/Web:** Restrict to `https://*.egos.systems/*` and `http://localhost:3000/*`.
    *   **Android:** Restrict to package name `com.egoslab.cortex` + SHA-1 Fingerprint.
    *   **iOS:** Restrict to Bundle ID.
2.  **API Restriction:**
    *   Limit the key *only* to the specific APIs it needs (e.g., "Maps JavaScript API", "Geocoding API").
    *   Do not include "Directions API" if you only render maps.

### 💰 Budget & Quotas
1.  **Quotas:** Set daily quotas (e.g., 1,000 requests/day) to prevent runaway loops.
2.  **Alerts:** Configure billing alerts at 50% and 90% of your monthly threshold (e.g., R$ 50,00).

---

## 2. OpenAI / OpenRouter / Anthropic
**Target:** LLM Inference.

### 🛡️ Usage Safety
1.  **Separate Keys:** Use distinct keys for `DEV`, `TEST`, and `PROD`.
    *   If `DEV` leaks, `PROD` stays up.
2.  **Spend Limits:**
    *   **OpenAI:** Set a "Soft Limit" and "Hard Limit" in the billing dashboard.
    *   **OpenRouter:** Use "Credits" (Pre-paid) instead of Auto-refill to physically cap losses.
3.  **Context Window:**
    *   Monitor token usage. A loop sending 100k context tokens can drain $10 in minutes.

---

## 3. General "Egos Standard"
1.  **Environment Variables:**
    *   Local: `.env.local` (GitIgnored).
    *   CI/CD: GitHub Secrets / Vercel Environment Variables.
    *   **NEVER** hardcode keys in code.
2.  **Leak Detection:**
    *   Pre-commit hooks (TruffleHog/Gitleaks).
    *   Periodic `git grep` audits (See `SECURITY_PROTOCOL.md`).
3.  **Rotation Policy:**
    *   Rotate keys every 90 days.
    *   Rotate immediately if a team member leaves or a device is lost.

## 4. Emergency Protocol
If a leak is suspected:
1.  **DELETE** the key in the provider dashboard immediately.
2.  **Check Logs** for abnormal usage/spikes.
3.  **Search Code** for the leak source.
4.  **Issue New Key** only after fixing the hole.
