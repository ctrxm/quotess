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
    home.tsx          - Homepage hero + quote grid
    explore.tsx       - Filter/search quote browser
    quote-detail.tsx  - Single quote view + related
    submit.tsx        - Submit quote form
    auth.tsx          - Login/register page
    waitlist.tsx      - Waitlist signup page
    profile.tsx       - Enhanced user profile: flower balance, gift role application form, transaction history
    withdraw.tsx      - Flower withdrawal page
    topup.tsx         - Flower top-up purchase page
    admin.tsx         - Full admin panel (quotes, users, waitlist, gifts, giftroles, withdrawals, topup, betacodes, settings)
  components/
    layout.tsx        - Header/footer/nav (with user menu)
    quote-card.tsx    - Card with like + give buttons
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
- Like system (toggle), share/copy buttons
- Admin approval workflow

### Gift Economy (Flowers)
- isGiveEnabled flag per user (admin-activated)
- Gift types: Bunga Mawar (10), Bintang (25), Berlian (100) flowers
- Send gifts on any quote
- Flower transaction history
- Withdrawal: 100 flowers = Rp 1,000, min 1,000 flowers (Rp 10,000)
- Bank/e-wallet withdrawal methods (BCA, BRI, Mandiri, OVO, GoPay, Dana)

### Admin Panel (protected, admin role required)
- Quote moderation (approve/reject pending)
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

## Design System

- Neobrutalism: thick black borders, bold shadows, flat bold typography
- Primary color: #FFE34D (yellow)
- Accent colors: #A8FF78 (green), #78C1FF (blue), #FF9F78 (orange)
- Background: #FFFDF0

## API Endpoints

### Public
- GET /api/settings/public
- GET /api/quotes, /api/quotes/search, /api/quotes/:id, /api/quotes/:id/related
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
