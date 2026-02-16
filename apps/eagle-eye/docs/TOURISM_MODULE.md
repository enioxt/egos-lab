# 🦅 Eagle Eye: Tourism Module (MVP)

> **Source:** [ChatGPT Conversation](file:///home/enio/Downloads/compiladochats/ChatGPT-New%20chat.md) (Feb 16, 2026)  
> **Pilot City:** Patos de Minas, MG

## Overview
This module transforms Eagle Eye into a dual-purpose agent for city tourism growth:
1.  **Visitor Concierge:** Helps tourists plan trips, find assets, and navigate safely.
2.  **City Growth Engine:** Helps managers (public/private) identify gaps, improve digital presence, and plan marketing.

## Core Components
Located in `src/modules/tourism/`:

### 1. City Profile (`types.ts`)
A structured JSON schema to model a city's tourism assets.
- **Pillars:** Unique selling points (e.g., "Capital do Milho", "Rota do Queijo").
- **Assets:** Nature, Food, Culture, Events.
- **Infra:** Hotels, Mobility, Safety.
- **Digital Presence:** Google Maps readiness scores.

### 2. Google Maps Readiness (`checklist.ts`)
A logic engine to score local businesses on their Google Maps presence.
- **High Impact Actions:** Claiming profile, Photos (10+), responding to reviews.
- **Scoring:** 0-100 scale based on weighted checklist items.

### 3. Campaign Estimator (`campaign.ts`)
Provides *order-of-magnitude* cost estimates for marketing actions based on real market data (2025/2026 references).
- **Outdoor (9x3):** ~R$ 1k - 4.6k / unit
- **LED Panel:** ~R$ 21k - 48k / month
- **Tourist Signage:** R$ 50k+ (projects)

### 4. System Prompt (`system-prompt.ts`)
A specialized persona (`EagleEye Tourism Agent`) with 3 modes:
- `VISITOR_MODE`: Concierge.
- `CURATOR_MODE`: Strategic planning and profiling.
- `BUSINESS_MODE`: Tactical Google Maps optimization for local owners.

## Usage
Import the module to access the prompt and logic:

```typescript
import { EAGLE_EYE_TOURISM_PROMPT, calculateReadinessScore, estimateCampaign } from './modules/tourism';

// 1. Get the System Prompt
const prompt = EAGLE_EYE_TOURISM_PROMPT;

// 2. Score a business
const score = calculateReadinessScore({
  profileExists: true,
  claimed: false, // Critical gap
  ...
});

// 3. Estimate a campaign
const budget = estimateCampaign([
  { channel: 'outdoor_9x3', quantity: 5 }
]);
```

## Future Roadmap (V2)
- Automated benchmarking vs other cities.
- Real-time scrape of TripAdvisor/Google Reviews.
- Integration with `marketplace-core` for booking experiences.
