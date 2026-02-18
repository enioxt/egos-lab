# Nexus Market - UI Generation Prompts (Stitch/v0)

Use estas prompts no **Stitch** (Google) ou **v0** para gerar as interfaces com a estética "Vibrant Premium" que definimos.

## 1. Consumer App - Home Experience
**Prompt:**
> Design a premium, vibrant mobile home screen for a supermarket delivery app called "Nexus Market". 
> **Style:** Glassmorphism accents, lush green and vibrant orange gradients, clean white background. Modern typography (Inter/Outfit).
> **Header:** A floating search bar with a microphone icon (voice search) and a user avatar. 
> **Hero Section:** "Smart Suggestions" carousel showing products based on AI predictions (e.g., "Time to restock Milk?").
> **Categories:** Horizontal scrollable pills with 3D-style icons (Produce, Bakery, Meat, Drinks).
> **Grid:** A "Fresh Deals" section with 2-column product cards. Each card must show: High-res image, Price (large bold), "Add to Cart" button with haptic visual feedback, and a small "Eco-Score" leaf icon.
> **Bottom Nav:** Floating glass dock with Home, Search, Cart, and Profile.

## 2. Merchant Dashboard - AI Inventory Audit (Critical Feature)
**Prompt:**
> Create a sophisticated web dashboard for a Supermarket Manager, focusing on "Data Quality Audit".
> **Layout:** Sidebar on left (modern dark grey), Main content area (light grey/white).
> **Header:** "Inventory Health Score: 78/100" (Large radial progress bar). match colors to score (yellow/warning).
> **Main Table:** A smart data grid listing imported products.
> **Columns:** Product Name, Stock, Price, Validity (Date), Quality Score, Status.
> **Visual Cues:** 
> - Highlight rows with missing "Validity Date" in soft red.
> - Show a "AI Suggestion" sparkles icon next to items where AI detected a potential mismatch or category error.
> - "Action Required" buttons (pill shape) for items missing critical data (images, nutritional info).
> **Right Panel:** "AI Assistant" pane showing context for the selected row: "This product looks like 'Nestlé Milk' but has no expiration date. Detected from barcode: 7891000... Confirm?"

## 3. Product Details - Smart Enrichment
**Prompt:**
> Design a mobile product detail page that emphasizes transparency and data richness.
> **Hero:** Large product image with a parallax effect.
> **Info:** Title, Price, and a dynamic "Freshness Guarantee" badge (calculated by AI based on expiry data).
> **Nutritional AI:** A section called "AI Nutrition Analysis" summarizing health pros/cons (e.g., "High Protein", "High Sugar") in clear, colorful tags.
> **Recipes:** "Cooks well with..." horizontal scroll of related products (cross-sell).
> **Sticky Action:** "Add to Cart" bar at the bottom with quantity selector.

## 4. Import Flow - System Connector
**Prompt:**
> Design a modal/wizard for "Connect Legacy System".
> **Step 1:** Select ERP Provider (Logos for standard market ERPs, plus "Upload CSV" option).
> **Step 2:** "AI Analyzing..." loading state with animated scanning effect over rows of data.
> **Step 3:** "Import Summary". "We found 1,200 products. 850 matched perfectly. 350 need your review (Missing Validity dates)."
> **Style:** Clean, reassuring, trustworthy blue/green tones.
