# KataViral - Website Share Quote Indonesia

## Overview
KataViral adalah website berbagi quote berbahasa Indonesia dengan desain neobrutalism. Users dapat membaca, mencari, memfilter, berbagi, dan submit quote. Ada juga admin panel untuk moderasi.

## Tech Stack
- **Frontend**: React + TypeScript + Wouter (routing) + TanStack Query
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Replit built-in) via Drizzle ORM
- **Styling**: Tailwind CSS + neobrutalism design system
- **Font**: Space Grotesk

## Features
- Home feed dengan quote terbaru, filter mood, dan search
- Explore page dengan filter mood dan tag
- Detail halaman quote (/q/:id) dengan related quotes dan share URL
- Submit form untuk UGC dengan rate limiting (5 submit/10 menit)
- Admin panel untuk moderasi quote pending

## Routes
- `/` — Home (feed quote)
- `/explore` — Filter by mood & tag
- `/q/:id` — Detail quote (shareable)
- `/submit` — Submit quote
- `/admin` — Admin panel (protected by ADMIN_SECRET)

## Data Model
- **quotes**: id, text, author, mood, status (pending/approved/rejected), created_at
- **tags**: id, name, slug
- **quote_tags**: quote_id, tag_id (junction)

## Moods
galau, semangat, sindir, healing, kerja, cinta

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (auto-configured)
- `ADMIN_SECRET` — (optional) Secret for admin panel access

## Running
```
npm run dev
```

## Database
- Schema managed via Drizzle ORM
- Run `npm run db:push` to sync schema
- Seed data: 33 Indonesian quotes auto-seeded on first run
