# Radio Philein

> **Status:** PAUSED — Migrated from carteira-livre on 2026-02-14
> **Origin:** carteira-livre/app/api/radio/, carteira-livre/app/radio/, carteira-livre/components/radio/, carteira-livre/services/radio/

## What is this?

A community radio feature for the Carteira Livre platform. Users could suggest songs, vote on queue, and listen to a shared station. Integrated with Spotify and Telegram bot.

## DB Tables (still in Supabase)

- `volante_radio_now_playing`
- `volante_radio_queue`
- `volante_radio_stations`

## Why paused?

Feature was disabled in carteira-livre to focus on core business (lessons, payments, instructors). Will be revisited as a standalone app in egos-lab.

## Files

- `api/` — Next.js API routes (now-playing, queue, history, search, etc.)
- `pages/` — Frontend pages (philein station UI)
- `components/` — RadioManager component
- `services/` — Spotify integration service

---
## 🦅 Governance
This project follows the [Egos Standards](../../docs/STANDARDS.md).
See [Intelink](../../projects/00-CORE-intelink) for the central architecture.
