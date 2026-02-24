# KataViral

Quote-sharing website Indonesia dengan desain Neobrutalism. Platform untuk berbagi, menyukai, dan merayakan kata-kata inspiratif berbahasa Indonesia.

## Tech Stack

- **Frontend**: React + Vite, Wouter (routing), TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: Supabase PostgreSQL (via SUPABASE_DATABASE_URL, fallback to DATABASE_URL)
- **Auth**: express-session + bcryptjs (session-based)
- **Font**: Space Grotesk

## Project Structure

```
client/src/
  pages/
    home.tsx          - Homepage hero + quote of the day + quote grid
    explore.tsx       - Filter/search quote browser
    quote-detail.tsx  - Single quote view + comments section + related
    submit.tsx        - Submit quote form
    quote-maker.tsx   - Custom quote maker (text/background/font/download)
    trending.tsx      - Trending quotes page (sorted by views + likes)
    author.tsx        - Author profile page (stats + follow button + all quotes)
    collections.tsx   - Collections browse + single collection detail (dual view)
    battle.tsx        - Quote Battle (head-to-head voting, 24hr rounds)
    leaderboard.tsx   - Top authors ranked by likes + views score
    referral.tsx      - Referral code + invite link + use referral code
    embed.tsx         - Widget embed code generator + preview
    auth.tsx          - Login/register page
    waitlist.tsx      - Waitlist signup page
    profile.tsx       - User profile: badges, streak, bookmarks tab, flower balance, gift role
    withdraw.tsx      - Flower withdrawal page
    topup.tsx         - Flower top-up purchase page
    admin.tsx         - Full admin panel
  components/
    layout.tsx        - Header/footer/nav (Beranda, Jelajahi, Trending, Battle, Koleksi, Top)
    quote-card.tsx    - Card with like + bookmark + comment + give + copy + share buttons
    give-modal.tsx    - Send gift modal
    maintenance-screen.tsx
  lib/
    auth.tsx          - AuthProvider + useAuth hook
    settings.tsx      - SettingsProvider + useSettings hook
    queryClient.ts    - TanStack Query config

server/
  index.ts           - Express app setup + session middleware
  routes.ts          - All API routes (60+ endpoints)
  storage.ts         - Database layer (all CRUD)
  auth.ts            - loadUser/requireAuth/requireAdmin middleware
  seed.ts            - Database seed + migrations (all tables + indexes)
  email.ts           - Brevo SMTP email utility (sends beta code on waitlist approval)

shared/
  schema.ts          - Drizzle tables, Zod schemas, types, constants, badge definitions
```

## Key Features

### Core Features (Batch 1)
- Quote of the Day (deterministic daily random)
- Like system with toggle
- View count tracking (incremented on detail view)
- Trending Quotes (sorted by views + likes)
- Custom Quote Maker (text/background/font + PNG download)
- Author Profiles with stats (click author name to view)

### Social Features (Batch 2)
- **Comments**: Add/delete comments on any quote, shown in quote detail
- **Bookmarks**: Toggle bookmark on any quote, view bookmarked quotes in profile
- **Follow Authors**: Follow/unfollow authors, follower count on author page
- **Collections**: Create/browse curated quote collections with cover colors
- **Quote Battle**: Daily head-to-head battles, vote for favorite, 24hr rounds
- **Badges/Achievements**: 10 badge types (first_quote, quote_10, streak_7, etc.)
- **Leaderboard**: Top authors ranked by total likes + views
- **Daily Streak**: Login streak tracking with longest streak record
- **Referral System**: Unique referral code, 50 flowers bonus per referral
- **Widget Embed**: Copy-paste HTML/JS widget for external websites
- **Username Display Fix**: Quotes show username instead of "Anonim" when non-anonymous

### User System
- Session-based auth (express-session + bcryptjs)
- User roles: admin / user
- Beta access flags, isGiveEnabled flag

### Gift Economy (Flowers)
- isGiveEnabled flag per user (admin-activated)
- Gift types: Bunga Mawar (10), Bintang (25), Berlian (100) flowers
- Send gifts on any quote
- Flower transaction history
- Withdrawal: 100 flowers = Rp 1,000, min 1,000 flowers
- Referral bonus: 50 flowers for both referrer and referred

### Admin Panel
- Quote moderation + auto-approve toggle
- User management
- Waitlist management
- Gift type / withdrawal methods management
- Site settings (maintenance, beta, notifications)
- Ads management, Beta codes

### Access Control
- Maintenance mode, Beta mode (open/code/waitlist)

## Database Tables

### Core
- users, quotes, tags, quote_tags, quote_likes, settings
- waitlist, beta_codes

### Gift Economy
- gift_types, gift_transactions, flower_transactions
- withdrawal_methods, withdrawal_requests
- topup_packages, topup_requests

### Social Features (Batch 2)
- quote_comments, quote_bookmarks, author_follows
- collections, collection_quotes
- quote_battles, battle_votes
- user_badges, user_streaks
- referral_codes, referral_uses

### Other
- gift_role_applications, ads

## Environment Variables

- `DATABASE_URL` / `SUPABASE_DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Session encryption secret

## Default Credentials

- **Admin**: admin@kataviral.id / admin123

## Design System

- Neobrutalism + Playful Pastel: thick black borders, bold shadows, flat bold typography
- Primary lemon: #FFF3B0, Mint: #C1F0C1, Baby blue: #B8DBFF
- Peach: #FFD1A9, Lavender: #DDB8FF, Rose: #FFB3B3
- Background cream: #FFF8F0

## API Endpoints

### Public
- GET /api/settings/public
- GET /api/quotes, /api/quotes/search, /api/quotes/:id, /api/quotes/:id/related
- GET /api/quotes/daily, /api/quotes/trending
- GET /api/quotes/:id/comments
- GET /api/author/:name
- GET /api/tags, /api/gifts/types, /api/withdrawal/methods
- GET /api/collections, /api/collections/:id
- GET /api/battles/active
- GET /api/leaderboard
- GET /api/embed/random
- POST /api/auth/register, /api/auth/login, /api/auth/logout, /api/waitlist
- GET /api/auth/me

### Protected (auth required)
- POST /api/quotes, /api/quotes/:id/like, /api/quotes/:id/bookmark
- POST /api/quotes/:id/comments, DELETE /api/comments/:id
- POST /api/author/:name/follow, GET /api/author/:name/following
- POST /api/collections, /api/collections/:id/quotes
- POST /api/battles/:id/vote
- GET /api/badges, /api/streak, POST /api/streak/update
- GET /api/referral, POST /api/referral/use
- GET /api/bookmarks
- POST /api/gifts/send, GET /api/flowers/history
- POST /api/withdrawal/request

### Admin only
- All /api/admin/* endpoints
