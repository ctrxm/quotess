import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer, boolean, decimal, varchar } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true, role: true, isActive: true, hasBetaAccess: true, flowersBalance: true, isGiveEnabled: true });
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});
export type TopupRequest = typeof topupRequests.$inferSelect;

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
  bgColor: text("bg_color").notNull().default("#78C1FF"),
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
export type QuoteWithTags = Quote & { tags: Tag[]; likedByMe?: boolean; authorUser?: { id: string; username: string } | null };

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

export const FLOWERS_TO_IDR_RATE = 10;
export const MIN_WITHDRAWAL_FLOWERS = 1000;
