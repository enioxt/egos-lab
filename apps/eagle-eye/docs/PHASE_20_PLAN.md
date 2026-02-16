# 🦅 Eagle Eye: Hyper-Local Intelligence (Phase 20 Implementation)

> **Goal:** Transform Eagle Eye from a "Gazette Reader" into a "Local Intelligence Platform".
> **Focus:** Patos de Minas (MG) -> Tourism, Events, Influencers.

## User Review Required
> [!IMPORTANT]
> **Data Privacy:** Confirm if scraping Instagram/Facebook is allowed by your Terms of Service. If not, we fall back to official public data sources.

## Proposed Changes

### 1. 🕷️ Web Scraper Upgrade (`apps/eagle-eye/src/modules/tourism`)
We will add specialized scrapers for local news portals:
#### [NEW] `scraper-patoshoje.ts`
- **Source:** patoshoje.com.br
- **Data:** Local events, tourism news.

#### [NEW] `scraper-patosja.ts`
- **Source:** patosja.com.br
- **Data:** Police reports (safety index), community events.

### 2. 🌟 Influencer Finder (`src/modules/influencers`)
Port logic from `carteira-livre` to identify local voices.
#### [NEW] `influencer-detector.ts`
- **Input:** Text content from news/gazettes.
- **Logic:** Extract names mentioned in context of "Digital Influencer", "Blogueiro", "Youtuber".
- **Enrichment:** Use `Exa.ai` to find social handles.

### 3. 📅 Recurring Event Detector (`src/modules/events`)
#### [NEW] `event-pattern-matcher.ts`
- Identify cyclical events (Fenapraça, Balaio de Arte).
- Predict next date based on historical data.

### 4. 📊 Social Sentiment (`src/modules/sentiment`)
- Analyze sentiment of specific locations (Waterfall X, Square Y).
- Tag locations as "Rising Star" or "Declining".

## Verification Plan

### Automated Tests
```bash
# Test the scrapers
bun test scraper-patoshoje

# Test the influencer logic
bun test influencer-detector
```

### Manual Verification
1.  Run the full scan: `bun eagle-eye:batch`.
2.  Check the output database for new "Influencer" rows.
3.  Verify if "Fenapraça" is detected as a recurring event.
