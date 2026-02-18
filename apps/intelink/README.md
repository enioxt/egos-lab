# Intelink

> Sistema de Inteligência Policial para DHPP

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## 🔧 Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 📚 Documentation

- [AGENTS.md](./AGENTS.md) - AI Agent Configuration
- [.guarani/](/.guarani/) - Agent Context
- [.windsurf/](/.windsurf/) - IDE Configuration

## 🏗️ Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 18 + TailwindCSS + Shadcn/UI
- **Database:** Supabase (lhscgsqhiooyatkebose)
- **Auth:** Supabase Auth

## 📦 Project Structure

```
intelink/
├── app/           # Next.js App Router pages
├── components/    # React components
├── lib/           # Business logic & utilities
├── hooks/         # Custom React hooks
├── types/         # TypeScript types
├── .windsurf/     # AI agent rules
├── .guarani/      # Agent context
└── AGENTS.md      # Universal AI config
```

## 🔄 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

---

*Sacred Code: 000.111.369.963.1618*
*Generated: 2025-12-26T01:40:28.004Z*
