# 🦅 Eagle Eye: Pacote de Design Final (Stitch)

> **Resumo:** Coleção completa de prompts para gerar a interface do sistema Eagle Eye no Google Stitch.
> **Tema:** Futurista (Admin) & Comunitário (App Cidadão).

---

## 🖥️ Painel do Gestor (Admin)

### 1. Dashboard Principal (HUD)
> **Foco:** Visão executiva para o Secretário de Turismo.
```text
A modern, dark-mode analytics dashboard for a city tourism manager. 
Header: "Eagle Eye - Patos de Minas (MG)".
Top cards: 
- "Tourism Readiness Score" (31/100, Critical, Red color).
- "Active Opportunities" (12 detected this week).
- "Est. Marketing ROI" (+15% projected).
Main section: A 2-column layout. 
Left: "Critical Actions Checklist" list items (Claim Google Profile, Update Hours, Respond to Reviews). 
Right: "Recent Gazette Signals" feed (cards showing "Edital Cultural", "Licitação Eventos").
Style: Clean, futuristic, data-heavy but readable. High contrast. Neon accents.
```

### 2. Inventário de Ativos
> **Foco:** Catálogo de Cachoeiras, Hotéis, Eventos.
```text
A detailed inventory page for city tourism assets.
Grid layout of cards representing assets (Waterfalls, Events, Hotels).
Each card has an image placeholder, status badge ("Verified", "Needs Update"), and a "Potential Score" bar.
Sidebar: Filtering by category (Nature, Culture, Business, Events).
Highlight a "Featured Asset" at the top: "Cachoeira do Prata" with a "Google Maps Gap" warning overlay nicely integrated.
Style: Premium travel app meets admin dashboard.
```

### 3. Simulador de Campanhas
> **Foco:** Planejamento de custos de mídia.
```text
A marketing campaign simulation builder.
Top: "Campaign Budget Estimator".
Center: A drag-and-drop or list builder interface where user adds media types ("Outdoor 9x3", "LED Panel", "Instagram Ads").
Right side: Floating summary card showing "Total Estimated Range: R$ 26k - R$ 71k" with a dynamic breakdown chart.
Cards for media types should show icons and unit price ranges.
Style: E-commerce checkout vibe but for B2G media planning. Minimalist and trustworthy.
```

---

## 📱 App do Cidadão (Mobile)

### 4. Feed de Oportunidades & Notícias
> **Foco:** Informação rápida vinda do Scraper.
```text
A real-time intelligence feed.
List of "Signals" detected from Official Gazettes.
Each item is a card with:
- Date & Source badge ("Diário Oficial - 2h ago").
- Title ("Abertura de Licitação - Shows Expomilho").
- AI Summary text.
- "Action" buttons: "Generate Proposal", "Share", "Ignore".
- Urgency indicator (Red dot for expiring soon).
Layout: timeline vertical list.
```

### 5. Gamification & Leaderboard
> **Foco:** Engajamento e Competição Saudável.
```text
A gamified community hub for citizen contributors.
Header: "Eagle Eye Community - Patos de Minas".
Top Section: User's Profile Card ("Nível 5 - Explorador Local", Progress Bar to next level, 450 Points).
Main Content: "Top Contributors" Leaderboard (List of avatars with ranks and points).
Cards for "Active Missions": 
- "📸 Photo Mission: Take a photo of 'Praça do Coreto' (+50 pts)"
- "🗺️ Mapper Mission: Confirm hours for 'Padaria Central' (+20 pts)"
Style: Fun, engaging, mobile-first design. Badges and gold/silver/bronze accents.
```

### 6. Impacto Social & Recompensas
> **Foco:** Retorno tangível e moral para o voluntário.
```text
A "Social Impact" dashboard within the app.
Header: "My Impact - [User Name]".
Cards:
- "Referral Code": A large card with the code "JOAO-8821" and a "Share" button. "Campaign: Jovens do Futuro".
- "Community Stats": 
  - "👥 12 Friends Invited".
  - "🎁 3 Rewards Received (1 Coffee, 200 pts)".
  - "💡 5 Suggestions Implemented".
- "Recent Rewards": A list of "Thank You" cards from merchants ("Padaria do Zé sent you a Coffee Voucher for your suggestion!").
Style: Warm, community-focused, using soft colors (e.g., teal, amber).
```

### 7. Quick Capture (Câmera Mágica)
> **Foco:** Input sem fricção (aponta e cadastra).
```text
A mobile-first camera interface for "Quick Capture".
Full-screen camera view.
Overlay: 
- "Detecting..." bracket around a landmark/building.
- Bottom sheet: "Looks like 'Praça do Coreto'. Want to add a photo? (+50 pts)"
- Big "Shutter" button.
- "Voice Note" microphone icon ("Tell us about this place").
Style: Like Instagram Stories or Pokemon Go. Immersive and fast.
```

### 8. Viral Share (Stories)
> **Foco:** Marketing viral orgânico gerado pelo usuário.
```text
A vertical "Story-ready" share card generated after an achievement.
Visual: 
- Center: User's Avatar with a shiny "Explorador Local" badge.
- Text: "I just leveled up to Explorer in Patos de Minas!"
- Stats: "📍 12 Places Mapped | 📸 50 Photos".
- Bottom: "Eagle Eye - Join the mission." (App Store badges).
Background: Blurred photo of one of the user's submissions.
### 9. Digital Growth Engine (Fábrica de SEO)
> **Foco:** Automação de marketing local para pequenos negócios "Blue Collar".
```text
A unified dashboard for "Local SEO Automation".
Header: "Growth Engine - [Business Name]".
Top Cards (Metrics):
- "Search Visibility": +15% (Graph going up).
- "Calls from Google": 23 (This week).
- "Pending Reviews": 2 (Action required).
Main Section "Content Factory":
- "Today's Mission": "Post a photo of your latest repair job (+40 pts)".
- "AI Drafts": 
  - "Google Post (Ready)": "Promoção de Terça: 10% off..." [Button: Copy/Post].
  - "Instagram Caption (Ready)": "Problema resolvido no Centro..." [Button: Copy].
Sidebar "Keyword Operations":
- List of accurate keywords: "Encanador Patos de Minas", "Desentupidora 24h".
Style: Professional, tool-like, high contrast, actionable. "HubSpot for local pros".
```
