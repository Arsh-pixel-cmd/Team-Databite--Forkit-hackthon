<p align="center">
  <img src="https://img.shields.io/badge/HACKATHON-Fork--IT%202026-blueviolet?style=for-the-badge" alt="Fork-IT 2026" />
  <img src="https://img.shields.io/badge/TEAM-DATABITE-orange?style=for-the-badge" alt="Team DATABITE" />
</p>

<h1 align="center">🍽️ O'FOOD — AI-Powered Food Intelligence Engine</h1>

<p align="center">
  <i>Scan. Analyze. Trust What You Eat.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-4285F4?logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
</p>

---

## 📌 Problem Statement

In today's food ecosystem, consumers have **no scientific way to verify what they are eating**. Most people rely on visual assumptions, labels, or subjective reviews to judge food quality, freshness, and nutritional value. They often do not know the exact ingredients used in a dish, its calorie count, protein and fat content, or whether it contains allergens.

Additionally, spoiled or low-quality food received from restaurants cannot be objectively verified for refunds. At home, pantry items frequently go unnoticed and spoil, leading to unnecessary food waste and financial loss. Leftovers and vegetable residues are usually discarded instead of being reused sustainably.

> **This lack of transparency, food intelligence, and waste management highlights the need for an AI-powered system that can analyze food, detect nutrition and freshness, prevent spoilage, and promote sustainable consumption.**

---

## 💡 Our Solution

**O'FOOD** is an AI-powered food intelligence platform that lets users **scan any food item using their camera** and instantly receive a comprehensive analysis — including ingredient identification, nutritional breakdown, freshness detection, allergen alerts, and a trust score — all backed by **real scientific data** from the FoodScope APIs.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📸 **Multi-Angle Food Scan** | Upload up to 5 photos (top, side, close-up, inside, label) for a thorough AI-powered analysis |
| 🧬 **AI Food Identification** | Uses **Google Gemini AI** to identify food items from images and validate they are actual food |
| 📊 **Nutritional Breakdown** | Displays calories, protein, fat, carbs, and detected ingredients with visual charts |
| 🟢 **Freshness Detection** | AI-assessed freshness status — Fresh, Caution, or Spoiled — with a trust score (0–100) |
| ⚠️ **Allergen Alerts** | Automatically flags potential allergens found in the scanned food |
| 💰 **Refund Verification** | Objectively verifies spoiled/low-quality restaurant food for refund eligibility |
| 📈 **Health Dashboard** | Track scan history with detailed nutritional logs and trend analysis |
| ♻️ **Sustainable Kitchen** | AI-powered recipe suggestions using leftover ingredients to reduce food waste |
| ⭐ **Community Reviews** | Share and browse food quality reviews with ratings, tags, and images |
| 👤 **User Profile** | Personal dashboard with scan stats, trust score, and achievements |

---

## 🔬 Powered by FoodScope APIs

O'FOOD integrates with the **FoodScope** ecosystem of scientific food databases:

| API | Purpose |
|---|---|
| 🍲 **RecipeDB** | Access structured recipe data including ingredients, steps, and nutritional information |
| 🧪 **FlavorDB** | Explore flavor molecule profiles and ingredient compatibility scores |

These APIs provide the **real scientific backbone** behind O'FOOD's food analysis, going beyond surface-level AI predictions to deliver data-driven nutritional insights.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, Glassmorphism UI |
| **AI/ML** | Google Gemini AI, Groq SDK |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **API Proxy** | Supabase Edge Functions (Deno) |
| **Smooth Scroll** | Lenis |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/Fork-IT-2026/Team-Databite--Forkit-hackthon.git
cd Team-Databite--Forkit-hackthon

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY and other required keys
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx              # 📸 Food Scan — Main scanning interface
│   ├── landing/page.tsx      # 🏠 Landing page with cinematic scroll
│   ├── health/page.tsx       # 📈 Health Dashboard & scan history
│   ├── deals/page.tsx        # ♻️ Sustainable Kitchen recipes
│   ├── reviews/page.tsx      # ⭐ Community food reviews
│   ├── profile/page.tsx      # 👤 User profile & stats
│   ├── api/
│   │   ├── audit-dish/       # Food analysis API route
│   │   └── kitchen-assistant/ # Recipe generation API route
│   └── globals.css           # Global styles & design tokens
├── components/
│   └── glassmorphism/        # Reusable Glassmorphism UI components
├── lib/
│   └── foodoscope/           # FoodScope API types & wrappers (RecipeDB, FlavorDB)
└── supabase/
    └── functions/
        └── api-proxy/        # Supabase Edge Function for secure API proxying
```

---

## 👥 Team DATABITE

Built with 🧠 and ☕ for **Fork-IT 2026 Hackathon**.

---

<p align="center">
  <b>⭐ Star this repo if you believe food transparency matters!</b>
</p>
