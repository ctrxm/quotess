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
    quote-detail.tsx  - Single quote view + related
    submit.tsx        - Submit quote form
    quote-maker.tsx   - Custom quote maker (text/background/font/download)
    trending.tsx      - Trending quotes page (sorted by views + likes)
    author.tsx        - Author profile page (stats + all quotes by author)
    auth.tsx          - Login/register page
    waitlist.tsx      - Waitlist signup page
    profile.tsx       - Enhanced user profile: flower balance, gift role application form, transaction history
    withdraw.tsx      - Flower withdrawal page
    topup.tsx         - Flower top-up purchase page
    admin.tsx         - Full admin panel (quotes, users, waitlist, gifts, giftroles, withdrawals, topup, betacodes, settings)
  components/
    layout.tsx        - Header/footer/nav (with user menu, Trending + Maker nav links)
    quote-card.tsx    - Card with like + give buttons + clickable author name
    give-modal.tsx    - Send gift modal
    maintenance-screen.tsx
  lib/
    auth.tsx          - AuthProvider + useAuth hook
    settings.tsx      - SettingsProvider + useSettings hook
    queryClient.ts    - TanStack Query config

server/
  index.ts           - Express app setup + session middleware
  routes.ts          - All API routes (30+ endpoints)
  storage.ts         - Database layer (all CRUD)
  auth.ts            - loadUser/requireAuth/requireAdmin middleware
  seed.ts            - Database seed (quotes, admin, gift types, withdrawal methods)

shared/
  schema.ts          - Drizzle tables, Zod schemas, types, constants
```

## Vercel Deployment

The project is configured for Vercel deployment. Files created:
- `vercel.json` — build command, output directory, and routing config
- `api/index.ts` — Vercel serverless entry point (Express wrapped for serverless)

**Deploy steps:**
1. Push code to GitHub
2. Import repo at vercel.com
3. Add environment variables in Vercel dashboard:
   - `SUPABASE_DATABASE_URL` — your Supabase database URL
   - `SESSION_SECRET` — secure random string for sessions
4. Deploy — Vercel runs `npx vite build` and serves `dist/public` from CDN

Sessions are stored in the Supabase `sessions` table (auto-created by connect-pg-simple).
The `/api/*` routes go to the serverless function; all other routes serve the SPA.

## Key Features

### User System
- Session-based auth (express-session + bcryptjs)
- User roles: admin / user
- Beta access flags, isGiveEnabled flag

### Quote Economy
- 33 seed quotes in 6 moods (galau, semangat, sindir, healing, kerja, cinta)
- Quotes linked to user accounts via userId field
- Submit requires login; choice of anonymous or username display
- Anonymous posts still track userId internally for gift routing
- Like system (toggle), share/copy buttons
- View count tracking (incremented on quote detail view)
- Quote of the Day: deterministic daily random quote (seed from date)
- Trending Quotes: sorted by views + likes score
- Custom Quote Maker: text editor with background/font/size picker + download as PNG
- Author Profile: click author name → view all their quotes with stats
- Admin approval workflow with auto-approve toggle setting

### Gift Economy (Flowers)
- isGiveEnabled flag per user (admin-activated)
- Gift types: Bunga Mawar (10), Bintang (25), Berlian (100) flowers
- Send gifts on any quote
- Flower transaction history
- Withdrawal: 100 flowers = Rp 1,000, min 1,000 flowers (Rp 10,000)
- Bank/e-wallet withdrawal methods (BCA, BRI, Mandiri, OVO, GoPay, Dana)

### Admin Panel (protected, admin role required)
- Quote moderation (approve/reject pending) + auto-approve toggle
- User management (activate/deactivate, toggle Give feature)
- Waitlist management (approve with auto-generated beta code / reject)
- Gift type management
- Withdrawal request management (approve/paid/reject)
- Site settings (maintenance mode, beta mode + access type, site name/description)

### Access Control
- Maintenance mode: shows maintenance screen to all
- Beta mode off: everyone can register
- Beta mode + "open": anyone can register
- Beta mode + "code": requires beta code
- Beta mode + "waitlist": only approved waitlist users

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection (uses Supabase)
- `SUPABASE_DATABASE_URL` - Supabase PostgreSQL URL
- `SESSION_SECRET` - Session encryption secret

## Default Credentials

- **Admin**: admin@kataviral.id / admin123

## Database Configuration

- **Dev (Replit)**: Uses `DATABASE_URL` (Replit PostgreSQL)
- **Production (Vercel)**: Set `DATABASE_URL` to Supabase connection string
- Auto-detects Supabase URLs and adds `search_path=public` for pooler compatibility
- Connection string format: `postgresql://user:pass@host:6543/postgres`

## Design System

- Neobrutalism + Playful Pastel: thick black borders, bold shadows, flat bold typography
- Primary lemon: #FFF3B0, Mint: #C1F0C1, Baby blue: #B8DBFF
- Peach: #FFD1A9, Lavender: #DDB8FF, Rose: #FFB3B3
- Background cream: #FFF8F0, Apricot: #FFD6A5

## API Endpoints

### Public
- GET /api/settings/public
- GET /api/quotes, /api/quotes/search, /api/quotes/:id, /api/quotes/:id/related
- GET /api/quotes/daily, /api/quotes/trending
- GET /api/author/:name
- GET /api/tags, /api/gifts/types, /api/withdrawal/methods
- POST /api/auth/register, /api/auth/login, /api/auth/logout, /api/waitlist
- GET /api/auth/me

### Protected (auth required)
- POST /api/quotes, /api/quotes/:id/like, /api/gifts/send
- GET /api/flowers/history
- POST /api/withdrawal/request
- GET /api/withdrawal/my

### Admin only
- GET/PATCH /api/admin/quotes, /api/admin/quotes/:id
- GET/PATCH /api/admin/users, /api/admin/users/:id
- GET/PATCH /api/admin/waitlist, /api/admin/waitlist/:id
- GET/POST/PATCH /api/admin/gifts, /api/admin/gifts/:id
- GET/PATCH /api/admin/withdrawals, /api/admin/withdrawals/:id
- GET/POST/PATCH /api/admin/withdrawal-methods, /api/admin/withdrawal-methods/:id
- GET/POST /api/admin/settings
