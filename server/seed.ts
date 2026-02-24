import { db } from "./storage";
import { quotes, tags, quoteTags, giftTypes, withdrawalMethods, settings, users } from "@shared/schema";
import { randomUUID } from "crypto";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SEED_QUOTES = [
  { text: "Hidup itu bukan soal seberapa keras kamu jatuh, tapi seberapa cepat kamu bangkit.", author: "Anonim", mood: "semangat", tags: ["motivasi", "kehidupan"] },
  { text: "Kamu tidak bisa kembali dan mengubah awal, tapi kamu bisa mulai dari sekarang dan mengubah akhir.", author: "C.S. Lewis", mood: "semangat", tags: ["motivasi", "mindset"] },
  { text: "Rasa sakit itu sementara, tapi menyerah itu selamanya.", author: "Lance Armstrong", mood: "semangat", tags: ["motivasi", "produktif"] },
  { text: "Orang yang berhenti belajar adalah orang yang sudah tua, meskipun umurnya baru dua puluh tahun.", author: "Henry Ford", mood: "kerja", tags: ["mindset", "produktif"] },
  { text: "Kesuksesan bukan kunci kebahagiaan. Kebahagiaan adalah kunci kesuksesan.", author: "Albert Schweitzer", mood: "healing", tags: ["sukses", "kehidupan"] },
  { text: "Cinta itu bukan soal menemukan orang yang sempurna, tapi menerima orang yang tidak sempurna dengan sempurna.", author: "Sam Keen", mood: "cinta", tags: ["bucin", "patahhati"] },
  { text: "Galau itu lumrah, yang penting jangan sampai galau-mu menghalangi langkah-langkahmu.", author: "Fiersa Besari", mood: "galau", tags: ["patahhati", "moveon"] },
  { text: "Jangan pernah menyesal atas sesuatu yang pernah membuatmu tersenyum.", author: "Mark Twain", mood: "healing", tags: ["moveon", "kehidupan"] },
  { text: "Bukan seberapa pintar kamu, tapi seberapa kamu mau berusaha.", author: "Anonim", mood: "kerja", tags: ["produktif", "mindset"] },
  { text: "Waktu itu tidak menunggu siapapun. Mulai sekarang atau tidak sama sekali.", author: "Anonim", mood: "kerja", tags: ["produktif", "motivasi"] },
  { text: "Yang paling menyakitkan bukan ketika mereka pergi, tapi ketika kamu sadar kamu masih menunggu.", author: "Anonim", mood: "galau", tags: ["patahhati"] },
  { text: "Cinta bukan tentang berapa lama, tapi tentang seberapa dalam.", author: "Kahlil Gibran", mood: "cinta", tags: ["cinta", "bucin"] },
  { text: "Kamu tidak perlu disukai semua orang. Jadilah dirimu sendiri.", author: "Anonim", mood: "healing", tags: ["selflove", "mindset"] },
  { text: "Berhenti membandingkan hidupmu dengan orang lain. Kamu tidak tahu apa yang sudah mereka lalui.", author: "Anonim", mood: "healing", tags: ["selflove", "kehidupan"] },
  { text: "Rezeki tidak akan tertukar, jadi kenapa harus iri dengan milik orang lain?", author: "Anonim", mood: "healing", tags: ["kehidupan", "random"] },
  { text: "Kalau dia yang tepat, kamu tidak perlu berjuang sendirian.", author: "Anonim", mood: "cinta", tags: ["cinta", "patahhati"] },
  { text: "Move on bukan berarti melupakan, tapi belajar untuk hidup tanpanya.", author: "Anonim", mood: "galau", tags: ["moveon", "patahhati"] },
  { text: "Kerja keras tidak pernah bohong. Hasilnya mungkin terlambat, tapi pasti datang.", author: "Anonim", mood: "kerja", tags: ["produktif", "sukses"] },
  { text: "Senyum itu gratis, tapi nilainya luar biasa.", author: "Anonim", mood: "healing", tags: ["chill", "kehidupan"] },
  { text: "Yang dibutuhkan bukan selalu yang sempurna, tapi yang bisa hadir di saat yang tepat.", author: "Anonim", mood: "cinta", tags: ["cinta", "bucin"] },
  { text: "Jangan takut gagal, takutlah jika tidak pernah mencoba.", author: "Anonim", mood: "semangat", tags: ["motivasi", "mindset"] },
  { text: "Diam itu bukan berarti tidak punya pendapat, tapi memilih pertempuran yang tepat.", author: "Anonim", mood: "sindir", tags: ["random", "mindset"] },
  { text: "Orang-orang yang meremehkanmu hari ini, akan terpana melihatmu sukses esok hari.", author: "Anonim", mood: "sindir", tags: ["sukses", "motivasi"] },
  { text: "Beberapa orang datang dalam hidupmu sebagai berkah. Yang lain datang sebagai pelajaran.", author: "Anonim", mood: "healing", tags: ["kehidupan", "moveon"] },
  { text: "Terlalu baik kepada semua orang bukan kekuatan, itu kelemahan yang terlihat mulia.", author: "Anonim", mood: "sindir", tags: ["random", "mindset"] },
  { text: "Tidur cukup, makan teratur, olahraga rutin. Itu sudah setengah dari kesuksesan.", author: "Anonim", mood: "kerja", tags: ["produktif", "chill"] },
  { text: "Pertemanan yang baik bukan tentang seberapa sering bertemu, tapi seberapa tulus saling peduli.", author: "Anonim", mood: "healing", tags: ["friendship", "kehidupan"] },
  { text: "Sahabat terbaik adalah yang tahu seburuk apapun kamu, tapi tetap memilihmu.", author: "Anonim", mood: "healing", tags: ["friendship", "chill"] },
  { text: "Kadang doa terbaikmu bukan yang dikabulkan segera, tapi yang dijawab dengan sabar.", author: "Anonim", mood: "galau", tags: ["kehidupan", "random"] },
  { text: "Bukan soal seberapa jauh jatuhnya, tapi apakah kamu kembali berdiri.", author: "Rocky Balboa", mood: "semangat", tags: ["motivasi", "sukses"] },
  { text: "Hustle keras, tapi tetap jaga kesehatan mentalmu.", author: "Anonim", mood: "kerja", tags: ["produktif", "selflove"] },
  { text: "Yang paling bahaya adalah orang yang diam tapi menyimpan segalanya.", author: "Anonim", mood: "sindir", tags: ["random"] },
  { text: "Cemburu itu tanda sayang? Tidak. Itu tanda tidak percaya diri.", author: "Anonim", mood: "sindir", tags: ["bucin", "cinta"] },
];

const ALL_TAGS: Record<string, string> = {
  moveon: "Move On", produktif: "Produktif", sukses: "Sukses", patahhati: "Patah Hati",
  motivasi: "Motivasi", friendship: "Friendship", chill: "Chill", mindset: "Mindset",
  selflove: "Self Love", random: "Random", kehidupan: "Kehidupan", bucin: "Bucin",
};

const DEFAULT_SETTINGS: Record<string, string> = {
  maintenance_mode: "false",
  beta_mode: "false",
  beta_access_type: "open",
  site_name: "KataViral",
  site_description: "Quote Indonesia yang Bikin Viral",
};

const DEFAULT_GIFT_TYPES = [
  { name: "Bunga Mawar", icon: "rose", costFlowers: 10 },
  { name: "Bintang", icon: "star", costFlowers: 25 },
  { name: "Berlian", icon: "diamond", costFlowers: 100 },
];

const DEFAULT_WITHDRAWAL_METHODS = [
  { name: "Bank BCA", type: "bank", code: "BCA" },
  { name: "Bank BRI", type: "bank", code: "BRI" },
  { name: "Bank Mandiri", type: "bank", code: "MANDIRI" },
  { name: "OVO", type: "ewallet", code: "OVO" },
  { name: "GoPay", type: "ewallet", code: "GOPAY" },
  { name: "Dana", type: "ewallet", code: "DANA" },
];

async function ensureTable(name: string, ddl: string) {
  try {
    await db.execute(sql.raw(ddl));
  } catch (e: any) {
    console.error(`[migrate] ${name}: ${e.message}`);
  }
}

async function runMigrations() {
  await ensureTable("gift_role_applications", `
    CREATE TABLE IF NOT EXISTS gift_role_applications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type varchar NOT NULL DEFAULT 'both',
      reason text NOT NULL,
      social_link varchar,
      status varchar NOT NULL DEFAULT 'pending',
      admin_note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("beta_codes", `
    CREATE TABLE IF NOT EXISTS beta_codes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL UNIQUE,
      is_used boolean NOT NULL DEFAULT false,
      used_by uuid REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      used_at timestamptz
    )
  `);

  await ensureTable("topup_packages", `
    CREATE TABLE IF NOT EXISTS topup_packages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      flowers integer NOT NULL,
      price_idr integer NOT NULL,
      is_active boolean NOT NULL DEFAULT true
    )
  `);

  await ensureTable("topup_requests", `
    CREATE TABLE IF NOT EXISTS topup_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      package_id uuid REFERENCES topup_packages(id),
      flowers integer NOT NULL,
      price_idr integer NOT NULL,
      status varchar NOT NULL DEFAULT 'pending',
      payment_proof text,
      admin_note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("ads", `
    CREATE TABLE IF NOT EXISTS ads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL DEFAULT 'text',
      title text,
      description text,
      image_url text,
      link_url text,
      is_active boolean NOT NULL DEFAULT true,
      position text NOT NULL DEFAULT 'inline',
      bg_color text NOT NULL DEFAULT '#78C1FF',
      text_color text NOT NULL DEFAULT '#000000',
      click_count integer NOT NULL DEFAULT 0,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("quotes_user_id", `ALTER TABLE quotes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL`);
  await ensureTable("quotes_is_anonymous", `ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT true`);
  await ensureTable("quotes_view_count", `ALTER TABLE quotes ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0`);

  await ensureTable("quote_comments", `
    CREATE TABLE IF NOT EXISTS quote_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      text text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("quote_bookmarks", `
    CREATE TABLE IF NOT EXISTS quote_bookmarks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("author_follows", `
    CREATE TABLE IF NOT EXISTS author_follows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("collections", `
    CREATE TABLE IF NOT EXISTS collections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      cover_color text NOT NULL DEFAULT '#FFF3B0',
      curator_id uuid REFERENCES users(id) ON DELETE SET NULL,
      is_public boolean NOT NULL DEFAULT true,
      is_premium boolean NOT NULL DEFAULT false,
      price_flowers integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("collection_quotes", `
    CREATE TABLE IF NOT EXISTS collection_quotes (
      collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      sort_order integer NOT NULL DEFAULT 0
    )
  `);

  await ensureTable("quote_battles", `
    CREATE TABLE IF NOT EXISTS quote_battles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      quote_a_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      quote_b_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      votes_a integer NOT NULL DEFAULT 0,
      votes_b integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      ends_at timestamptz NOT NULL
    )
  `);

  await ensureTable("battle_votes", `
    CREATE TABLE IF NOT EXISTS battle_votes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      battle_id uuid NOT NULL REFERENCES quote_battles(id) ON DELETE CASCADE,
      voted_quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("user_badges", `
    CREATE TABLE IF NOT EXISTS user_badges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_type text NOT NULL,
      earned_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("user_streaks", `
    CREATE TABLE IF NOT EXISTS user_streaks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      current_streak integer NOT NULL DEFAULT 0,
      longest_streak integer NOT NULL DEFAULT 0,
      last_visit_date date
    )
  `);

  await ensureTable("referral_codes", `
    CREATE TABLE IF NOT EXISTS referral_codes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      code text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("referral_uses", `
    CREATE TABLE IF NOT EXISTS referral_uses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id uuid NOT NULL REFERENCES users(id),
      referred_id uuid NOT NULL REFERENCES users(id),
      flowers_amount integer NOT NULL DEFAULT 50,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await ensureTable("idx_quotes_status", `CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)`);
  await ensureTable("idx_quotes_mood", `CREATE INDEX IF NOT EXISTS idx_quotes_mood ON quotes(mood)`);
  await ensureTable("idx_quotes_author", `CREATE INDEX IF NOT EXISTS idx_quotes_author ON quotes(author)`);
  await ensureTable("idx_quotes_likes", `CREATE INDEX IF NOT EXISTS idx_quotes_likes ON quotes(likes_count DESC)`);
  await ensureTable("idx_quotes_views", `CREATE INDEX IF NOT EXISTS idx_quotes_views ON quotes(view_count DESC)`);
  await ensureTable("idx_quote_likes_user", `CREATE INDEX IF NOT EXISTS idx_quote_likes_user ON quote_likes(user_id, quote_id)`);
  await ensureTable("idx_quote_tags_quote", `CREATE INDEX IF NOT EXISTS idx_quote_tags_quote ON quote_tags(quote_id)`);
  await ensureTable("idx_comments_quote", `CREATE INDEX IF NOT EXISTS idx_comments_quote ON quote_comments(quote_id)`);
  await ensureTable("idx_bookmarks_user", `CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON quote_bookmarks(user_id)`);
  await ensureTable("idx_follows_user", `CREATE INDEX IF NOT EXISTS idx_follows_user ON author_follows(user_id)`);
  await ensureTable("idx_battle_votes_user", `CREATE INDEX IF NOT EXISTS idx_battle_votes_user ON battle_votes(user_id, battle_id)`);

  console.log("[migrate] Tables ensured.");
}

export async function seedDatabase() {
  await runMigrations();
  try {
    const [{ quoteCount }] = await db.select({ quoteCount: sql<number>`count(*)` }).from(quotes);
    if (Number(quoteCount) === 0) {
      console.log("[seed] Seeding quotes...");
      const tagMap = new Map<string, string>();
      for (const [slug, name] of Object.entries(ALL_TAGS)) {
        const id = randomUUID();
        await db.insert(tags).values({ id, name, slug }).onConflictDoNothing();
        tagMap.set(slug, id);
      }
      const existingTags = await db.select().from(tags);
      for (const tag of existingTags) tagMap.set(tag.slug, tag.id);

      for (const q of SEED_QUOTES) {
        const id = randomUUID();
        await db.insert(quotes).values({ id, text: q.text, author: q.author, mood: q.mood, status: "approved" });
        for (const tagSlug of q.tags) {
          let tagId = tagMap.get(tagSlug);
          if (!tagId) {
            const newTagId = randomUUID();
            await db.insert(tags).values({ id: newTagId, name: tagSlug, slug: tagSlug }).onConflictDoNothing();
            tagMap.set(tagSlug, newTagId);
            tagId = newTagId;
          }
          await db.insert(quoteTags).values({ quoteId: id, tagId }).onConflictDoNothing();
        }
      }
      console.log(`[seed] Seeded ${SEED_QUOTES.length} quotes!`);
    }

    // Seed default settings
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await db.insert(settings).values({ key, value }).onConflictDoNothing();
    }

    // Seed gift types
    const [{ giftCount }] = await db.select({ giftCount: sql<number>`count(*)` }).from(giftTypes);
    if (Number(giftCount) === 0) {
      for (const gt of DEFAULT_GIFT_TYPES) {
        await db.insert(giftTypes).values({ id: randomUUID(), ...gt }).onConflictDoNothing();
      }
    }

    // Seed withdrawal methods
    const [{ wmCount }] = await db.select({ wmCount: sql<number>`count(*)` }).from(withdrawalMethods);
    if (Number(wmCount) === 0) {
      for (const wm of DEFAULT_WITHDRAWAL_METHODS) {
        await db.insert(withdrawalMethods).values({ id: randomUUID(), ...wm }).onConflictDoNothing();
      }
    }

    // Create admin user if not exists
    const [{ adminCount }] = await db.select({ adminCount: sql<number>`count(*)` }).from(users).where(eq(users.role, "admin"));
    if (Number(adminCount) === 0) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({ id: randomUUID(), email: "admin@kataviral.id", username: "admin", passwordHash, role: "admin", hasBetaAccess: true }).onConflictDoNothing();
      console.log("[seed] Admin user created: admin@kataviral.id / admin123");
    }

    console.log("[seed] Database ready!");
  } catch (e) {
    console.error("[seed] Error:", e);
  }
}
