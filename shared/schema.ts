import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer, boolean, decimal, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS ───────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  hasBetaAccess: boolean("has_beta_access").notNull().default(false),
  flowersBalance: integer("flowers_balance").notNull().default(0),
  isGiveEnabled: boolean("is_give_enabled").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true, role: true, isActive: true, hasBetaAccess: true, flowersBalance: true, isGiveEnabled: true, isVerified: true });
export const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username min 3 karakter").max(30, "Username max 30 karakter").regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore"),
  password: z.string().min(6, "Password min 6 karakter"),
  betaCode: z.string().optional(),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password wajib diisi"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PublicUser = Omit<User, "passwordHash">;

// ─── WAITLIST ─────────────────────────────────────────────
export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  status: text("status").notNull().default("pending"),
  betaCode: text("beta_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type Waitlist = typeof waitlist.$inferSelect;

// ─── SETTINGS ─────────────────────────────────────────────
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type Setting = typeof settings.$inferSelect;

// ─── QUOTES ──────────────────────────────────────────────
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  author: text("author"),
  mood: text("mood").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  status: text("status").notNull().default("approved"),
  likesCount: integer("likes_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const quoteTags = pgTable("quote_tags", {
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const quoteLikes = pgTable("quote_likes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ─── GIFTS ───────────────────────────────────────────────
export const giftTypes = pgTable("gift_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("flower"),
  costFlowers: integer("cost_flowers").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
});
export type GiftType = typeof giftTypes.$inferSelect;

export const giftTransactions = pgTable("gift_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: uuid("sender_id").notNull().references(() => users.id),
  receiverId: uuid("receiver_id").notNull().references(() => users.id),
  giftTypeId: uuid("gift_type_id").notNull().references(() => giftTypes.id),
  quoteId: uuid("quote_id").references(() => quotes.id),
  message: text("message"),
  flowersAmount: integer("flowers_amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type GiftTransaction = typeof giftTransactions.$inferSelect;

// ─── FLOWER TRANSACTIONS ──────────────────────────────────
export const flowerTransactions = pgTable("flower_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type FlowerTransaction = typeof flowerTransactions.$inferSelect;

// ─── WITHDRAWAL ──────────────────────────────────────────
export const withdrawalMethods = pgTable("withdrawal_methods", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  code: text("code").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});
export type WithdrawalMethod = typeof withdrawalMethods.$inferSelect;

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  methodId: uuid("method_id").notNull().references(() => withdrawalMethods.id),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  flowersAmount: integer("flowers_amount").notNull(),
  idrAmount: integer("idr_amount").notNull(),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

// ─── TOPUP PACKAGES ──────────────────────────────────────
export const topupPackages = pgTable("topup_packages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("🌸"),
  description: text("description"),
  flowersAmount: integer("flowers_amount").notNull(),
  priceIdr: integer("price_idr").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});
export type TopupPackage = typeof topupPackages.$inferSelect;

// ─── TOPUP REQUESTS ──────────────────────────────────────
export const topupRequests = pgTable("topup_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  packageId: uuid("package_id").notNull().references(() => topupPackages.id),
  flowersAmount: integer("flowers_amount").notNull(),
  priceIdr: integer("price_idr").notNull(),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  invoiceId: text("invoice_id"),
  paymentUrl: text("payment_url"),
  finalAmount: integer("final_amount"),
  paymentExpiry: timestamp("payment_expiry", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type TopupRequest = typeof topupRequests.$inferSelect;

// ─── DONATIONS ──────────────────────────────────────────
export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  donorName: text("donor_name").notNull().default("Anonim"),
  message: text("message"),
  amount: integer("amount").notNull(),
  invoiceId: text("invoice_id"),
  paymentUrl: text("payment_url"),
  finalAmount: integer("final_amount"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type Donation = typeof donations.$inferSelect;

// ─── GIFT ROLE APPLICATIONS ──────────────────────────────
export const giftRoleApplications = pgTable("gift_role_applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("both"), // "giver", "receiver", "both"
  reason: text("reason").notNull(),
  socialLink: text("social_link"),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type GiftRoleApplication = typeof giftRoleApplications.$inferSelect;
export const insertGiftRoleApplicationSchema = createInsertSchema(giftRoleApplications).omit({ id: true, userId: true, status: true, adminNote: true, createdAt: true, updatedAt: true });

// ─── ADS ─────────────────────────────────────────────────
export const ads = pgTable("ads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull().default("text"), // "text" | "image"
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  isActive: boolean("is_active").notNull().default(true),
  position: text("position").notNull().default("inline"), // "inline" | "bottom"
  bgColor: text("bg_color").notNull().default("#B8DBFF"),
  textColor: text("text_color").notNull().default("#000000"),
  clickCount: integer("click_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type Ad = typeof ads.$inferSelect;
export const insertAdSchema = createInsertSchema(ads).omit({ id: true, clickCount: true, createdAt: true });

// ─── BETA CODES ──────────────────────────────────────────
export const betaCodes = pgTable("beta_codes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  isUsed: boolean("is_used").notNull().default(false),
  usedBy: uuid("used_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  usedAt: timestamp("used_at", { withTimezone: true }),
});
export type BetaCode = typeof betaCodes.$inferSelect;

// ─── COMMENTS ───────────────────────────────────────────
export const quoteComments = pgTable("quote_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type QuoteComment = typeof quoteComments.$inferSelect;
export type QuoteCommentWithUser = QuoteComment & { username: string };

// ─── BOOKMARKS ──────────────────────────────────────────
export const quoteBookmarks = pgTable("quote_bookmarks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type QuoteBookmark = typeof quoteBookmarks.$inferSelect;

// ─── AUTHOR FOLLOWS ─────────────────────────────────────
export const authorFollows = pgTable("author_follows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type AuthorFollow = typeof authorFollows.$inferSelect;

// ─── COLLECTIONS ────────────────────────────────────────
export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  coverColor: text("cover_color").notNull().default("#FFF3B0"),
  curatorId: uuid("curator_id").references(() => users.id, { onDelete: "set null" }),
  isPublic: boolean("is_public").notNull().default(true),
  isPremium: boolean("is_premium").notNull().default(false),
  priceFlowers: integer("price_flowers").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type Collection = typeof collections.$inferSelect;
export type CollectionWithMeta = Collection & { quoteCount: number; curatorUsername?: string };

export const collectionQuotes = pgTable("collection_quotes", {
  collectionId: uuid("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── QUOTE BATTLES ──────────────────────────────────────
export const quoteBattles = pgTable("quote_battles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteAId: uuid("quote_a_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  quoteBId: uuid("quote_b_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  votesA: integer("votes_a").notNull().default(0),
  votesB: integer("votes_b").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
});
export type QuoteBattle = typeof quoteBattles.$inferSelect;
export type QuoteBattleWithQuotes = QuoteBattle & { quoteA: QuoteWithTags; quoteB: QuoteWithTags; myVote?: string | null };

export const battleVotes = pgTable("battle_votes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  battleId: uuid("battle_id").notNull().references(() => quoteBattles.id, { onDelete: "cascade" }),
  votedQuoteId: uuid("voted_quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ─── BADGES ─────────────────────────────────────────────
export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeType: text("badge_type").notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type UserBadge = typeof userBadges.$inferSelect;

export const BADGE_DEFINITIONS: Record<string, { name: string; icon: string; description: string; requirement: string }> = {
  first_quote: { name: "Penulis Pertama", icon: "pencil", description: "Submit quote pertama", requirement: "Submit 1 quote" },
  quote_10: { name: "Penulis Aktif", icon: "book-open", description: "Submit 10 quote", requirement: "Submit 10 quotes" },
  quote_50: { name: "Penulis Viral", icon: "flame", description: "Submit 50 quote", requirement: "Submit 50 quotes" },
  first_like: { name: "Apresiator", icon: "heart", description: "Like quote pertama", requirement: "Like 1 quote" },
  like_100: { name: "Super Fans", icon: "star", description: "Like 100 quote", requirement: "Like 100 quotes" },
  streak_7: { name: "Setia 7 Hari", icon: "zap", description: "Login 7 hari berturut-turut", requirement: "7 day streak" },
  streak_30: { name: "Setia 30 Hari", icon: "trophy", description: "Login 30 hari berturut-turut", requirement: "30 day streak" },
  first_comment: { name: "Komentator", icon: "message-circle", description: "Komentar pertama", requirement: "1 comment" },
  battle_voter: { name: "Juri Battle", icon: "swords", description: "Vote di 10 battle", requirement: "Vote 10 battles" },
  collector: { name: "Kolektor", icon: "bookmark", description: "Bookmark 20 quote", requirement: "Bookmark 20 quotes" },
};

// ─── STREAKS ────────────────────────────────────────────
export const userStreaks = pgTable("user_streaks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastVisitDate: date("last_visit_date"),
});
export type UserStreak = typeof userStreaks.$inferSelect;

// ─── REFERRALS ──────────────────────────────────────────
export const referralCodes = pgTable("referral_codes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const referralUses = pgTable("referral_uses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: uuid("referrer_id").notNull().references(() => users.id),
  referredId: uuid("referred_id").notNull().references(() => users.id),
  flowersAmount: integer("flowers_amount").notNull().default(50),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const REFERRAL_BONUS_FLOWERS = 50;

// ─── SCHEMAS ─────────────────────────────────────────────
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, status: true, likesCount: true, userId: true });
export const submitQuoteSchema = insertQuoteSchema.extend({
  text: z.string().min(10, "Quote minimal 10 karakter").max(500, "Quote maksimal 500 karakter"),
  author: z.string().max(100).optional(),
  mood: z.enum(["galau", "semangat", "sindir", "healing", "kerja", "cinta"]),
  isAnonymous: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
});
export const insertTagSchema = createInsertSchema(tags).omit({ id: true });

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type SubmitQuote = z.infer<typeof submitQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type QuoteTag = typeof quoteTags.$inferSelect;
export type QuoteWithTags = Quote & { tags: Tag[]; likedByMe?: boolean; bookmarkedByMe?: boolean; commentsCount?: number; authorUser?: { id: string; username: string; isVerified?: boolean } | null };

export const MOODS = ["galau", "semangat", "sindir", "healing", "kerja", "cinta"] as const;
export type Mood = typeof MOODS[number];

export const MOOD_LABELS: Record<Mood, string> = {
  galau: "Galau", semangat: "Semangat", sindir: "Sindir", healing: "Healing", kerja: "Kerja", cinta: "Cinta",
};

export const MOOD_COLORS: Record<Mood, { bg: string; border: string; text: string }> = {
  galau: { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700" },
  semangat: { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700" },
  sindir: { bg: "bg-red-100", border: "border-red-500", text: "text-red-700" },
  healing: { bg: "bg-green-100", border: "border-green-500", text: "text-green-700" },
  kerja: { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-700" },
  cinta: { bg: "bg-pink-100", border: "border-pink-500", text: "text-pink-700" },
};

export const POPULAR_TAGS = [
  { name: "Move On", slug: "moveon" }, { name: "Produktif", slug: "produktif" },
  { name: "Sukses", slug: "sukses" }, { name: "Patah Hati", slug: "patahhati" },
  { name: "Motivasi", slug: "motivasi" }, { name: "Friendship", slug: "friendship" },
  { name: "Chill", slug: "chill" }, { name: "Mindset", slug: "mindset" },
  { name: "Self Love", slug: "selflove" }, { name: "Random", slug: "random" },
  { name: "Kehidupan", slug: "kehidupan" }, { name: "Bucin", slug: "bucin" },
];

// ─── VERIFICATION REQUESTS ──────────────────────────────
export const verificationRequests = pgTable("verification_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  socialLink: text("social_link"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type VerificationRequest = typeof verificationRequests.$inferSelect;

export const FLOWERS_TO_IDR_RATE = 10;
export const MIN_WITHDRAWAL_FLOWERS = 1000;
