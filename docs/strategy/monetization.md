# Eagle Eye — Monetization & Business Strategy

## 1. Executive Summary
Eagle Eye is not just a dashboard; it is a **Government Opportunity Intelligence Platform**. The goal is to move beyond simple "alerts" to providing **actionable business intelligence** and **execution capabilities**.

## 2. Business Models

### A. SaaS Subscription (Recurring Revenue)
*Target: SMEs and Government Suppliers who want to monitor opportunities self-service.*

| Tier | Price (Monthly) | Features |
| :--- | :--- | :--- |
| **Scout** | R$ 197 | National Monitoring, Daily Email Alerts, Basic Filtering |
| **Hunter** | R$ 497 | "Eagle Eye" AI Filtering (Critical/High), Advanced Analytics, 5 Viability Reports/mo |
| **Titan** | R$ 997 | API Access, Team Seats, Unlimited Viability Reports, Competitor Tracking |

### B. On-Demand Intelligence (Transactional)
*Target: Users who find a specific opportunity and need deep diligence before bidding.*

- **Deep Viability Report (Analysis Agent)**: R$ 97 per report.
  - Deliverables: Competitor Analysis, MVP Feature List, Estimated Dev Cost, ROI Calculation, Go-to-Market Strategy.
  - *Value Prop*: "Don't waste time bidding on bad projects. Know your win probability instantly."

### C. "Done-For-You" Execution (High Ticket / Agency)
*Target: Non-technical entrepreneurs or companies who found an opportunity but can't execute.*

- **The "Builder" Partnership**:
  - We (Eagle Eye Team) build the software/MVP required by the tender.
  - **Model 1**: Fixed Dev Fee (e.g., R$ 50k - R$ 200k).
  - **Model 2**: Success Fee (We build at cost, take % of the won contract).
  - **Model 3**: Joint Venture (We become the tech partner in the SPE).

## 3. The "Viability Analyst" (AI Agent)
To support Model B and C, we are building a specialized AI Agent.

**Input:**
- Full Gazette Text / Tender Notice (Edital).
- User Profile (optional).

**Output (The Report):**
1.  **Executive Summary**: Plain Portuguese explanation of the need.
2.  **Viability Score (0-100)**: Based on timeline, budget (if known), and technical complexity.
3.  **MVP Roadmap**: "To win this, you need X, Y, Z features."
4.  **Cost Estimation**: "Estimated Dev Hours: 400h. Estimated Cost: R$ 60k."
5.  **Competitor Intel**: "Likely competitors: X, Y, Z."

## 4. Growth Strategy
1.  **Inbound**: SEO pages for every municipality (e.g., "Licitações em Patos de Minas").
2.  **Outbound**: Automatically email local dev agencies when a "Software Development" tender opens in their city. "We found a lead for you."
3.  **Marketplace**: Connect "Finders" (users of Eagle Eye) with "Builders" (our dev partners).

## 5. Next Steps
- [ ] Build `analyze_viability.ts` to generate the "Deep Viability Report".
- [ ] Add "Solicitar Análise" button to Dashboard.
- [ ] Create a "Partner Network" form for developers/agencies to sign up.
