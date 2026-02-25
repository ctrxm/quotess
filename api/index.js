var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  BADGE_DEFINITIONS: () => BADGE_DEFINITIONS,
  FLOWERS_TO_IDR_RATE: () => FLOWERS_TO_IDR_RATE,
  MIN_WITHDRAWAL_FLOWERS: () => MIN_WITHDRAWAL_FLOWERS,
  MOODS: () => MOODS,
  MOOD_COLORS: () => MOOD_COLORS,
  MOOD_LABELS: () => MOOD_LABELS,
  POPULAR_TAGS: () => POPULAR_TAGS,
  REFERRAL_BONUS_FLOWERS: () => REFERRAL_BONUS_FLOWERS,
  ads: () => ads,
  authorFollows: () => authorFollows,
  battleVotes: () => battleVotes,
  betaCodes: () => betaCodes,
  collectionQuotes: () => collectionQuotes,
  collections: () => collections,
  donations: () => donations,
  flowerTransactions: () => flowerTransactions,
  giftRoleApplications: () => giftRoleApplications,
  giftTransactions: () => giftTransactions,
  giftTypes: () => giftTypes,
  insertAdSchema: () => insertAdSchema,
  insertGiftRoleApplicationSchema: () => insertGiftRoleApplicationSchema,
  insertQuoteSchema: () => insertQuoteSchema,
  insertTagSchema: () => insertTagSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  quoteBattles: () => quoteBattles,
  quoteBookmarks: () => quoteBookmarks,
  quoteComments: () => quoteComments,
  quoteLikes: () => quoteLikes,
  quoteTags: () => quoteTags,
  quotes: () => quotes,
  referralCodes: () => referralCodes,
  referralUses: () => referralUses,
  registerSchema: () => registerSchema,
  settings: () => settings,
  submitQuoteSchema: () => submitQuoteSchema,
  tags: () => tags,
  topupPackages: () => topupPackages,
  topupRequests: () => topupRequests,
  userBadges: () => userBadges,
  userStreaks: () => userStreaks,
  users: () => users,
  verificationRequests: () => verificationRequests,
  waitlist: () => waitlist,
  withdrawalMethods: () => withdrawalMethods,
  withdrawalRequests: () => withdrawalRequests
});
import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, insertUserSchema, registerSchema, loginSchema, waitlist, settings, quotes, tags, quoteTags, quoteLikes, giftTypes, giftTransactions, flowerTransactions, withdrawalMethods, withdrawalRequests, topupPackages, topupRequests, donations, giftRoleApplications, insertGiftRoleApplicationSchema, ads, insertAdSchema, betaCodes, quoteComments, quoteBookmarks, authorFollows, collections, collectionQuotes, quoteBattles, battleVotes, userBadges, BADGE_DEFINITIONS, userStreaks, referralCodes, referralUses, REFERRAL_BONUS_FLOWERS, insertQuoteSchema, submitQuoteSchema, insertTagSchema, MOODS, MOOD_LABELS, MOOD_COLORS, POPULAR_TAGS, verificationRequests, FLOWERS_TO_IDR_RATE, MIN_WITHDRAWAL_FLOWERS;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
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
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true, role: true, isActive: true, hasBetaAccess: true, flowersBalance: true, isGiveEnabled: true, isVerified: true });
    registerSchema = z.object({
      email: z.string().email("Email tidak valid"),
      username: z.string().min(3, "Username min 3 karakter").max(30, "Username max 30 karakter").regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore"),
      password: z.string().min(6, "Password min 6 karakter"),
      betaCode: z.string().optional()
    });
    loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1, "Password wajib diisi")
    });
    waitlist = pgTable("waitlist", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      email: text("email").notNull().unique(),
      name: text("name"),
      status: text("status").notNull().default("pending"),
      betaCode: text("beta_code"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    settings = pgTable("settings", {
      key: text("key").primaryKey(),
      value: text("value").notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    quotes = pgTable("quotes", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      text: text("text").notNull(),
      author: text("author"),
      mood: text("mood").notNull(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
      isAnonymous: boolean("is_anonymous").notNull().default(true),
      status: text("status").notNull().default("approved"),
      likesCount: integer("likes_count").notNull().default(0),
      viewCount: integer("view_count").notNull().default(0),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    tags = pgTable("tags", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull().unique(),
      slug: text("slug").notNull().unique()
    });
    quoteTags = pgTable("quote_tags", {
      quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
      tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" })
    });
    quoteLikes = pgTable("quote_likes", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    giftTypes = pgTable("gift_types", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      icon: text("icon").notNull().default("flower"),
      costFlowers: integer("cost_flowers").notNull().default(10),
      isActive: boolean("is_active").notNull().default(true)
    });
    giftTransactions = pgTable("gift_transactions", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      senderId: uuid("sender_id").notNull().references(() => users.id),
      receiverId: uuid("receiver_id").notNull().references(() => users.id),
      giftTypeId: uuid("gift_type_id").notNull().references(() => giftTypes.id),
      quoteId: uuid("quote_id").references(() => quotes.id),
      message: text("message"),
      flowersAmount: integer("flowers_amount").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    flowerTransactions = pgTable("flower_transactions", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id),
      type: text("type").notNull(),
      amount: integer("amount").notNull(),
      description: text("description").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    withdrawalMethods = pgTable("withdrawal_methods", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      type: text("type").notNull(),
      code: text("code").notNull().unique(),
      isActive: boolean("is_active").notNull().default(true)
    });
    withdrawalRequests = pgTable("withdrawal_requests", {
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
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    topupPackages = pgTable("topup_packages", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      icon: text("icon").notNull().default("\u{1F338}"),
      description: text("description"),
      flowersAmount: integer("flowers_amount").notNull(),
      priceIdr: integer("price_idr").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      sortOrder: integer("sort_order").notNull().default(0)
    });
    topupRequests = pgTable("topup_requests", {
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
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    donations = pgTable("donations", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      donorName: text("donor_name").notNull().default("Anonim"),
      message: text("message"),
      amount: integer("amount").notNull(),
      invoiceId: text("invoice_id"),
      paymentUrl: text("payment_url"),
      finalAmount: integer("final_amount"),
      status: text("status").notNull().default("pending"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    giftRoleApplications = pgTable("gift_role_applications", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      type: text("type").notNull().default("both"),
      // "giver", "receiver", "both"
      reason: text("reason").notNull(),
      socialLink: text("social_link"),
      status: text("status").notNull().default("pending"),
      // "pending", "approved", "rejected"
      adminNote: text("admin_note"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    insertGiftRoleApplicationSchema = createInsertSchema(giftRoleApplications).omit({ id: true, userId: true, status: true, adminNote: true, createdAt: true, updatedAt: true });
    ads = pgTable("ads", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      type: text("type").notNull().default("text"),
      // "text" | "image"
      title: text("title"),
      description: text("description"),
      imageUrl: text("image_url"),
      linkUrl: text("link_url"),
      isActive: boolean("is_active").notNull().default(true),
      position: text("position").notNull().default("inline"),
      // "inline" | "bottom"
      bgColor: text("bg_color").notNull().default("#B8DBFF"),
      textColor: text("text_color").notNull().default("#000000"),
      clickCount: integer("click_count").notNull().default(0),
      sortOrder: integer("sort_order").notNull().default(0),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    insertAdSchema = createInsertSchema(ads).omit({ id: true, clickCount: true, createdAt: true });
    betaCodes = pgTable("beta_codes", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      code: text("code").notNull().unique(),
      isUsed: boolean("is_used").notNull().default(false),
      usedBy: uuid("used_by").references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
      usedAt: timestamp("used_at", { withTimezone: true })
    });
    quoteComments = pgTable("quote_comments", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
      text: text("text").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    quoteBookmarks = pgTable("quote_bookmarks", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    authorFollows = pgTable("author_follows", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      authorName: text("author_name").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    collections = pgTable("collections", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      coverColor: text("cover_color").notNull().default("#FFF3B0"),
      curatorId: uuid("curator_id").references(() => users.id, { onDelete: "set null" }),
      isPublic: boolean("is_public").notNull().default(true),
      isPremium: boolean("is_premium").notNull().default(false),
      priceFlowers: integer("price_flowers").notNull().default(0),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    collectionQuotes = pgTable("collection_quotes", {
      collectionId: uuid("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
      quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
      sortOrder: integer("sort_order").notNull().default(0)
    });
    quoteBattles = pgTable("quote_battles", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      quoteAId: uuid("quote_a_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
      quoteBId: uuid("quote_b_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
      votesA: integer("votes_a").notNull().default(0),
      votesB: integer("votes_b").notNull().default(0),
      status: text("status").notNull().default("active"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
      endsAt: timestamp("ends_at", { withTimezone: true }).notNull()
    });
    battleVotes = pgTable("battle_votes", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      battleId: uuid("battle_id").notNull().references(() => quoteBattles.id, { onDelete: "cascade" }),
      votedQuoteId: uuid("voted_quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    userBadges = pgTable("user_badges", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      badgeType: text("badge_type").notNull(),
      earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    BADGE_DEFINITIONS = {
      first_quote: { name: "Penulis Pertama", icon: "pencil", description: "Submit quote pertama", requirement: "Submit 1 quote" },
      quote_10: { name: "Penulis Aktif", icon: "book-open", description: "Submit 10 quote", requirement: "Submit 10 quotes" },
      quote_50: { name: "Penulis Viral", icon: "flame", description: "Submit 50 quote", requirement: "Submit 50 quotes" },
      first_like: { name: "Apresiator", icon: "heart", description: "Like quote pertama", requirement: "Like 1 quote" },
      like_100: { name: "Super Fans", icon: "star", description: "Like 100 quote", requirement: "Like 100 quotes" },
      streak_7: { name: "Setia 7 Hari", icon: "zap", description: "Login 7 hari berturut-turut", requirement: "7 day streak" },
      streak_30: { name: "Setia 30 Hari", icon: "trophy", description: "Login 30 hari berturut-turut", requirement: "30 day streak" },
      first_comment: { name: "Komentator", icon: "message-circle", description: "Komentar pertama", requirement: "1 comment" },
      battle_voter: { name: "Juri Battle", icon: "swords", description: "Vote di 10 battle", requirement: "Vote 10 battles" },
      collector: { name: "Kolektor", icon: "bookmark", description: "Bookmark 20 quote", requirement: "Bookmark 20 quotes" }
    };
    userStreaks = pgTable("user_streaks", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
      currentStreak: integer("current_streak").notNull().default(0),
      longestStreak: integer("longest_streak").notNull().default(0),
      lastVisitDate: date("last_visit_date")
    });
    referralCodes = pgTable("referral_codes", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
      code: text("code").notNull().unique(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    referralUses = pgTable("referral_uses", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      referrerId: uuid("referrer_id").notNull().references(() => users.id),
      referredId: uuid("referred_id").notNull().references(() => users.id),
      flowersAmount: integer("flowers_amount").notNull().default(50),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    REFERRAL_BONUS_FLOWERS = 50;
    insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, status: true, likesCount: true, userId: true });
    submitQuoteSchema = insertQuoteSchema.extend({
      text: z.string().min(10, "Quote minimal 10 karakter").max(500, "Quote maksimal 500 karakter"),
      author: z.string().max(100).optional(),
      mood: z.enum(["galau", "semangat", "sindir", "healing", "kerja", "cinta"]),
      isAnonymous: z.boolean().optional().default(true),
      tags: z.array(z.string()).optional().default([])
    });
    insertTagSchema = createInsertSchema(tags).omit({ id: true });
    MOODS = ["galau", "semangat", "sindir", "healing", "kerja", "cinta"];
    MOOD_LABELS = {
      galau: "Galau",
      semangat: "Semangat",
      sindir: "Sindir",
      healing: "Healing",
      kerja: "Kerja",
      cinta: "Cinta"
    };
    MOOD_COLORS = {
      galau: { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-700" },
      semangat: { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700" },
      sindir: { bg: "bg-red-100", border: "border-red-500", text: "text-red-700" },
      healing: { bg: "bg-green-100", border: "border-green-500", text: "text-green-700" },
      kerja: { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-700" },
      cinta: { bg: "bg-pink-100", border: "border-pink-500", text: "text-pink-700" }
    };
    POPULAR_TAGS = [
      { name: "Move On", slug: "moveon" },
      { name: "Produktif", slug: "produktif" },
      { name: "Sukses", slug: "sukses" },
      { name: "Patah Hati", slug: "patahhati" },
      { name: "Motivasi", slug: "motivasi" },
      { name: "Friendship", slug: "friendship" },
      { name: "Chill", slug: "chill" },
      { name: "Mindset", slug: "mindset" },
      { name: "Self Love", slug: "selflove" },
      { name: "Random", slug: "random" },
      { name: "Kehidupan", slug: "kehidupan" },
      { name: "Bucin", slug: "bucin" }
    ];
    verificationRequests = pgTable("verification_requests", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      reason: text("reason").notNull(),
      socialLink: text("social_link"),
      status: text("status").notNull().default("pending"),
      adminNote: text("admin_note"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    FLOWERS_TO_IDR_RATE = 10;
    MIN_WITHDRAWAL_FLOWERS = 1e3;
  }
});

// server/storage.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and, ilike, or, inArray, sql as sql2, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
async function getTagsForQuoteIds(quoteIds) {
  if (quoteIds.length === 0) return /* @__PURE__ */ new Map();
  const rows = await db.select({ quoteId: quoteTags.quoteId, tag: tags }).from(quoteTags).innerJoin(tags, eq(quoteTags.tagId, tags.id)).where(inArray(quoteTags.quoteId, quoteIds));
  const map = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (!map.has(row.quoteId)) map.set(row.quoteId, []);
    map.get(row.quoteId).push(row.tag);
  }
  return map;
}
async function attachTags(qs, userId) {
  if (qs.length === 0) return [];
  const quoteIds = qs.map((q) => q.id);
  const tagMap = await getTagsForQuoteIds(quoteIds);
  let likedSet = /* @__PURE__ */ new Set();
  let bookmarkSet = /* @__PURE__ */ new Set();
  if (userId) {
    const [liked, bookmarked] = await Promise.all([
      db.select({ quoteId: quoteLikes.quoteId }).from(quoteLikes).where(and(eq(quoteLikes.userId, userId), inArray(quoteLikes.quoteId, quoteIds))),
      db.select({ quoteId: quoteBookmarks.quoteId }).from(quoteBookmarks).where(and(eq(quoteBookmarks.userId, userId), inArray(quoteBookmarks.quoteId, quoteIds)))
    ]);
    likedSet = new Set(liked.map((r) => r.quoteId));
    bookmarkSet = new Set(bookmarked.map((r) => r.quoteId));
  }
  const commentCounts = await db.select({ quoteId: quoteComments.quoteId, cnt: sql2`count(*)` }).from(quoteComments).where(inArray(quoteComments.quoteId, quoteIds)).groupBy(quoteComments.quoteId);
  const commentMap = new Map(commentCounts.map((r) => [r.quoteId, Number(r.cnt)]));
  const authorUserIds = qs.map((q) => q.userId).filter(Boolean);
  const authorMap = /* @__PURE__ */ new Map();
  if (authorUserIds.length > 0) {
    const authorUsers = await db.select({ id: users.id, username: users.username, isVerified: users.isVerified }).from(users).where(inArray(users.id, authorUserIds));
    for (const u of authorUsers) authorMap.set(u.id, u);
  }
  return qs.map((q) => ({
    ...q,
    tags: tagMap.get(q.id) || [],
    likedByMe: likedSet.has(q.id),
    bookmarkedByMe: bookmarkSet.has(q.id),
    commentsCount: commentMap.get(q.id) || 0,
    authorUser: q.userId ? authorMap.get(q.userId) || null : null
  }));
}
async function findOrCreateTag(name) {
  const slug = name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  const existing = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(tags).values({ id: randomUUID(), name, slug }).returning();
  return created;
}
async function getSetting(key, defaultVal = "") {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows.length > 0 ? rows[0].value : defaultVal;
}
async function setSetting(key, value) {
  await db.insert(settings).values({ key, value, updatedAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: /* @__PURE__ */ new Date() } });
}
async function getQuotes(opts) {
  const { mood, tagSlug, page = 1, limit = 12, userId } = opts;
  const offset = (page - 1) * limit;
  const conditions = [eq(quotes.status, "approved")];
  if (mood) conditions.push(eq(quotes.mood, mood));
  if (tagSlug) {
    const tag = await db.select().from(tags).where(eq(tags.slug, tagSlug)).limit(1);
    if (tag.length === 0) return { quotes: [], total: 0 };
    const qts = await db.select({ quoteId: quoteTags.quoteId }).from(quoteTags).where(eq(quoteTags.tagId, tag[0].id));
    const ids = qts.map((r) => r.quoteId);
    if (ids.length === 0) return { quotes: [], total: 0 };
    conditions.push(inArray(quotes.id, ids));
  }
  const [countRow] = await db.select({ total: sql2`count(*)` }).from(quotes).where(and(...conditions));
  const rows = await db.select().from(quotes).where(and(...conditions)).orderBy(desc(quotes.createdAt)).limit(limit).offset(offset);
  return { quotes: await attachTags(rows, userId), total: Number(countRow.total) };
}
async function getQuoteById(id, userId) {
  const rows = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  if (rows.length === 0) return void 0;
  const [withTags] = await attachTags(rows, userId);
  return withTags;
}
async function searchQuotes(q, userId) {
  const rows = await db.select().from(quotes).where(and(eq(quotes.status, "approved"), or(ilike(quotes.text, `%${q}%`), ilike(quotes.author, `%${q}%`)))).orderBy(desc(quotes.createdAt)).limit(20);
  return attachTags(rows, userId);
}
async function submitQuote(quote, tagNames, userId) {
  const id = randomUUID();
  const autoApprove = await getSetting("auto_approve_quotes", "false");
  const status = autoApprove === "true" ? "approved" : "pending";
  const [created] = await db.insert(quotes).values({ ...quote, id, status, userId: userId || null }).returning();
  for (const name of tagNames) {
    if (!name.trim()) continue;
    const tag = await findOrCreateTag(name.trim());
    await db.insert(quoteTags).values({ quoteId: id, tagId: tag.id }).onConflictDoNothing();
  }
  return created;
}
async function getPendingQuotes() {
  const rows = await db.select().from(quotes).where(eq(quotes.status, "pending")).orderBy(desc(quotes.createdAt));
  return attachTags(rows);
}
async function updateQuoteStatus(id, status) {
  await db.update(quotes).set({ status }).where(eq(quotes.id, id));
}
async function getTags() {
  return db.select().from(tags).orderBy(tags.name);
}
async function getRelatedQuotes(mood, excludeId, userId) {
  const rows = await db.select().from(quotes).where(and(eq(quotes.status, "approved"), eq(quotes.mood, mood), ne(quotes.id, excludeId))).orderBy(sql2`random()`).limit(4);
  return attachTags(rows, userId);
}
async function incrementViewCount(id) {
  await db.update(quotes).set({ viewCount: sql2`COALESCE(view_count, 0) + 1` }).where(eq(quotes.id, id));
}
async function getQuoteOfTheDay(userId) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const seed = Array.from(today).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const [countRow] = await db.select({ total: sql2`count(*)` }).from(quotes).where(eq(quotes.status, "approved"));
  const total = Number(countRow.total);
  if (total === 0) return void 0;
  const offset = seed % total;
  const rows = await db.select().from(quotes).where(eq(quotes.status, "approved")).orderBy(quotes.id).limit(1).offset(offset);
  if (rows.length === 0) return void 0;
  const [withTags] = await attachTags(rows, userId);
  return withTags;
}
async function getTrendingQuotes(limit = 20, userId) {
  const rows = await db.select().from(quotes).where(eq(quotes.status, "approved")).orderBy(desc(sql2`COALESCE(view_count, 0) + (likes_count * 5)`)).limit(limit);
  return attachTags(rows, userId);
}
async function getQuotesByAuthor(author, userId) {
  const rows = await db.select().from(quotes).where(and(eq(quotes.status, "approved"), eq(quotes.author, author))).orderBy(desc(quotes.createdAt));
  return attachTags(rows, userId);
}
async function getQuotesByUsername(username, currentUserId) {
  const [targetUser] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (!targetUser) return [];
  const rows = await db.select().from(quotes).where(and(eq(quotes.status, "approved"), eq(quotes.userId, targetUser.id))).orderBy(desc(quotes.createdAt));
  return attachTags(rows, currentUserId);
}
async function getUserStatsByUsername(username) {
  const [targetUser] = await db.select({ id: users.id, isVerified: users.isVerified }).from(users).where(eq(users.username, username)).limit(1);
  if (!targetUser) return null;
  const [stats] = await db.select({
    totalQuotes: sql2`count(*)`,
    totalLikes: sql2`COALESCE(sum(likes_count), 0)`,
    totalViews: sql2`COALESCE(sum(COALESCE(view_count, 0)), 0)`
  }).from(quotes).where(and(eq(quotes.status, "approved"), eq(quotes.userId, targetUser.id)));
  return { totalQuotes: Number(stats.totalQuotes), totalLikes: Number(stats.totalLikes), totalViews: Number(stats.totalViews), isVerified: targetUser.isVerified };
}
async function getAuthorStats(author) {
  const [stats] = await db.select({
    totalQuotes: sql2`count(*)`,
    totalLikes: sql2`COALESCE(sum(likes_count), 0)`,
    totalViews: sql2`COALESCE(sum(COALESCE(view_count, 0)), 0)`
  }).from(quotes).where(and(eq(quotes.status, "approved"), eq(quotes.author, author)));
  return { totalQuotes: Number(stats.totalQuotes), totalLikes: Number(stats.totalLikes), totalViews: Number(stats.totalViews) };
}
async function toggleLike(userId, quoteId) {
  const existing = await db.select().from(quoteLikes).where(and(eq(quoteLikes.userId, userId), eq(quoteLikes.quoteId, quoteId))).limit(1);
  if (existing.length > 0) {
    await db.delete(quoteLikes).where(eq(quoteLikes.id, existing[0].id));
    const [updated] = await db.update(quotes).set({ likesCount: sql2`likes_count - 1` }).where(eq(quotes.id, quoteId)).returning();
    return { liked: false, count: updated.likesCount };
  } else {
    await db.insert(quoteLikes).values({ id: randomUUID(), userId, quoteId });
    const [updated] = await db.update(quotes).set({ likesCount: sql2`likes_count + 1` }).where(eq(quotes.id, quoteId)).returning();
    return { liked: true, count: updated.likesCount };
  }
}
async function createUser(data) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  const [user] = await db.insert(users).values({
    id: randomUUID(),
    email: data.email,
    username: data.username,
    passwordHash,
    role: "user"
  }).returning();
  const { passwordHash: _, ...pub } = user;
  return pub;
}
async function getUserByEmail(email) {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0];
}
async function getUserById(id) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}
async function getAllUsers(limit = 50, offset = 0) {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  return rows.map(({ passwordHash: _, ...u }) => u);
}
async function searchUsers(query, excludeUserId) {
  const rows = await db.select({ id: users.id, username: users.username }).from(users).where(sql2`lower(username) LIKE ${`%${query.toLowerCase()}%`}`).limit(10);
  return excludeUserId ? rows.filter((u) => u.id !== excludeUserId) : rows;
}
async function updateUser(id, data) {
  await db.update(users).set(data).where(eq(users.id, id));
}
async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}
async function addToWaitlist(email, name) {
  const existing = await db.select().from(waitlist).where(eq(waitlist.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(waitlist).values({ id: randomUUID(), email: email.toLowerCase(), name, status: "pending" }).returning();
  return created;
}
async function getWaitlist() {
  return db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
}
async function getWaitlistById(id) {
  const rows = await db.select().from(waitlist).where(eq(waitlist.id, id)).limit(1);
  return rows[0] || null;
}
async function updateWaitlistStatus(id, status, betaCode) {
  await db.update(waitlist).set({ status, betaCode: betaCode || null }).where(eq(waitlist.id, id));
}
async function validateBetaCode(code) {
  const rows = await db.select().from(waitlist).where(and(eq(waitlist.betaCode, code), eq(waitlist.status, "approved"))).limit(1);
  return rows.length > 0;
}
async function getAllSettings() {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
async function getGiftTypes() {
  return db.select().from(giftTypes).where(eq(giftTypes.isActive, true));
}
async function getAllGiftTypes() {
  return db.select().from(giftTypes).orderBy(giftTypes.name);
}
async function createGiftType(data) {
  const [gt] = await db.insert(giftTypes).values({ id: randomUUID(), ...data }).returning();
  return gt;
}
async function updateGiftType(id, data) {
  await db.update(giftTypes).set(data).where(eq(giftTypes.id, id));
}
async function sendGift(senderId, receiverId, giftTypeId, quoteId, message) {
  const gt = await db.select().from(giftTypes).where(eq(giftTypes.id, giftTypeId)).limit(1);
  if (!gt.length) throw new Error("Jenis hadiah tidak ditemukan");
  const cost = gt[0].costFlowers;
  const sender = await getUserById(senderId);
  if (!sender) throw new Error("User tidak ditemukan");
  if (!sender.isGiveEnabled) throw new Error("Fitur Give belum aktif untuk akun Anda");
  if (sender.flowersBalance < cost) throw new Error("Saldo bunga tidak cukup");
  await db.update(users).set({ flowersBalance: sql2`flowers_balance - ${cost}` }).where(eq(users.id, senderId));
  await db.update(users).set({ flowersBalance: sql2`flowers_balance + ${cost}` }).where(eq(users.id, receiverId));
  await db.insert(giftTransactions).values({
    id: randomUUID(),
    senderId,
    receiverId,
    giftTypeId,
    quoteId: quoteId || null,
    message: message || null,
    flowersAmount: cost
  });
  await db.insert(flowerTransactions).values({ id: randomUUID(), userId: senderId, type: "debit", amount: cost, description: `Mengirim hadiah ke @${receiverId}` });
  await db.insert(flowerTransactions).values({ id: randomUUID(), userId: receiverId, type: "credit", amount: cost, description: `Menerima hadiah` });
}
async function getFlowerHistory(userId) {
  return db.select().from(flowerTransactions).where(eq(flowerTransactions.userId, userId)).orderBy(desc(flowerTransactions.createdAt)).limit(50);
}
async function getWithdrawalMethods() {
  return db.select().from(withdrawalMethods).where(eq(withdrawalMethods.isActive, true)).orderBy(withdrawalMethods.type, withdrawalMethods.name);
}
async function getAllWithdrawalMethods() {
  return db.select().from(withdrawalMethods).orderBy(withdrawalMethods.type, withdrawalMethods.name);
}
async function createWithdrawalMethod(data) {
  const [wm] = await db.insert(withdrawalMethods).values({ id: randomUUID(), ...data }).returning();
  return wm;
}
async function updateWithdrawalMethod(id, data) {
  await db.update(withdrawalMethods).set(data).where(eq(withdrawalMethods.id, id));
}
async function requestWithdrawal(userId, methodId, accountNumber, accountName, flowersAmount) {
  const { MIN_WITHDRAWAL_FLOWERS: MIN_WITHDRAWAL_FLOWERS3, FLOWERS_TO_IDR_RATE: FLOWERS_TO_IDR_RATE3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  if (flowersAmount < MIN_WITHDRAWAL_FLOWERS3) throw new Error(`Minimum penarikan ${MIN_WITHDRAWAL_FLOWERS3} bunga`);
  const user = await getUserById(userId);
  if (!user || user.flowersBalance < flowersAmount) throw new Error("Saldo tidak cukup");
  const idrAmount = flowersAmount * FLOWERS_TO_IDR_RATE3;
  await db.update(users).set({ flowersBalance: sql2`flowers_balance - ${flowersAmount}` }).where(eq(users.id, userId));
  const [req] = await db.insert(withdrawalRequests).values({
    id: randomUUID(),
    userId,
    methodId,
    accountNumber,
    accountName,
    flowersAmount,
    idrAmount,
    status: "pending"
  }).returning();
  await db.insert(flowerTransactions).values({
    id: randomUUID(),
    userId,
    type: "debit",
    amount: flowersAmount,
    description: `Penarikan ${flowersAmount} bunga = Rp ${idrAmount.toLocaleString("id-ID")}`
  });
  return req;
}
async function getWithdrawalRequests(userId) {
  if (userId) return db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId)).orderBy(desc(withdrawalRequests.createdAt));
  return db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.createdAt));
}
async function updateWithdrawalStatus(id, status, adminNote) {
  const updates = { status, updatedAt: /* @__PURE__ */ new Date() };
  if (adminNote !== void 0) updates.adminNote = adminNote;
  await db.update(withdrawalRequests).set(updates).where(eq(withdrawalRequests.id, id));
  if (status === "rejected") {
    const [req] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
    if (req) {
      await db.update(users).set({ flowersBalance: sql2`flowers_balance + ${req.flowersAmount}` }).where(eq(users.id, req.userId));
      await db.insert(flowerTransactions).values({ id: randomUUID(), userId: req.userId, type: "credit", amount: req.flowersAmount, description: "Pengembalian penarikan ditolak" });
    }
  }
}
async function getTopupPackages() {
  return db.select().from(topupPackages).where(eq(topupPackages.isActive, true)).orderBy(topupPackages.sortOrder);
}
async function getAllTopupPackages() {
  return db.select().from(topupPackages).orderBy(topupPackages.sortOrder);
}
async function createTopupPackage(data) {
  const [pkg] = await db.insert(topupPackages).values({ id: randomUUID(), ...data }).returning();
  return pkg;
}
async function updateTopupPackage(id, data) {
  await db.update(topupPackages).set(data).where(eq(topupPackages.id, id));
}
async function createTopupRequest(userId, packageId, invoice) {
  const pkg = await db.select().from(topupPackages).where(eq(topupPackages.id, packageId)).limit(1);
  if (!pkg.length) throw new Error("Paket tidak ditemukan");
  const values = {
    id: randomUUID(),
    userId,
    packageId,
    flowersAmount: pkg[0].flowersAmount,
    priceIdr: pkg[0].priceIdr,
    status: "pending"
  };
  if (invoice) {
    values.invoiceId = invoice.invoiceId;
    values.paymentUrl = invoice.paymentUrl;
    values.finalAmount = invoice.finalAmount;
    values.paymentExpiry = new Date(invoice.expiresAt);
  }
  const [req] = await db.insert(topupRequests).values(values).returning();
  return req;
}
async function getTopupRequestByInvoice(invoiceId) {
  const rows = await db.select().from(topupRequests).where(eq(topupRequests.invoiceId, invoiceId)).limit(1);
  return rows[0] || null;
}
async function updateTopupInvoiceStatus(invoiceId, status) {
  await db.update(topupRequests).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(topupRequests.invoiceId, invoiceId));
}
async function getTopupRequests(userId) {
  if (userId) return db.select().from(topupRequests).where(eq(topupRequests.userId, userId)).orderBy(desc(topupRequests.createdAt));
  return db.select().from(topupRequests).orderBy(desc(topupRequests.createdAt));
}
async function updateTopupStatus(id, status, adminNote) {
  const updates = { status, updatedAt: /* @__PURE__ */ new Date() };
  if (adminNote !== void 0) updates.adminNote = adminNote;
  await db.update(topupRequests).set(updates).where(eq(topupRequests.id, id));
  if (status === "confirmed") {
    const [req] = await db.select().from(topupRequests).where(eq(topupRequests.id, id)).limit(1);
    if (req) {
      await db.update(users).set({ flowersBalance: sql2`flowers_balance + ${req.flowersAmount}` }).where(eq(users.id, req.userId));
      await db.insert(flowerTransactions).values({
        id: randomUUID(),
        userId: req.userId,
        type: "credit",
        amount: req.flowersAmount,
        description: `Top up ${req.flowersAmount} bunga`
      });
    }
  }
}
async function applyForGiftRole(userId, type, reason, socialLink) {
  const existing = await db.select().from(giftRoleApplications).where(and(eq(giftRoleApplications.userId, userId), eq(giftRoleApplications.status, "pending"))).limit(1);
  if (existing.length > 0) throw new Error("Kamu sudah punya pengajuan yang sedang menunggu review");
  const [app2] = await db.insert(giftRoleApplications).values({
    userId,
    type,
    reason,
    socialLink: socialLink || null
  }).returning();
  return app2;
}
async function getMyGiftRoleApplication(userId) {
  const rows = await db.select().from(giftRoleApplications).where(eq(giftRoleApplications.userId, userId)).orderBy(desc(giftRoleApplications.createdAt)).limit(1);
  return rows[0] || null;
}
async function getAllGiftRoleApplications() {
  const rows = await db.select({
    id: giftRoleApplications.id,
    userId: giftRoleApplications.userId,
    type: giftRoleApplications.type,
    reason: giftRoleApplications.reason,
    socialLink: giftRoleApplications.socialLink,
    status: giftRoleApplications.status,
    adminNote: giftRoleApplications.adminNote,
    createdAt: giftRoleApplications.createdAt,
    updatedAt: giftRoleApplications.updatedAt,
    username: users.username,
    email: users.email
  }).from(giftRoleApplications).leftJoin(users, eq(giftRoleApplications.userId, users.id)).orderBy(desc(giftRoleApplications.createdAt));
  return rows;
}
async function updateGiftRoleApplication(id, status, adminNote) {
  await db.update(giftRoleApplications).set({ status, adminNote: adminNote || null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(giftRoleApplications.id, id));
  if (status === "approved") {
    const [app2] = await db.select().from(giftRoleApplications).where(eq(giftRoleApplications.id, id)).limit(1);
    if (app2) await db.update(users).set({ isGiveEnabled: true }).where(eq(users.id, app2.userId));
  }
}
async function getActiveAds() {
  return db.select().from(ads).where(eq(ads.isActive, true)).orderBy(ads.sortOrder, desc(ads.createdAt));
}
async function getAllAds() {
  return db.select().from(ads).orderBy(ads.sortOrder, desc(ads.createdAt));
}
async function createAd(data) {
  const [ad] = await db.insert(ads).values({
    type: data.type || "text",
    title: data.title || null,
    description: data.description || null,
    imageUrl: data.imageUrl || null,
    linkUrl: data.linkUrl || null,
    isActive: data.isActive ?? true,
    position: data.position || "inline",
    bgColor: data.bgColor || "#78C1FF",
    textColor: data.textColor || "#000000",
    sortOrder: data.sortOrder ?? 0
  }).returning();
  return ad;
}
async function updateAd(id, data) {
  await db.update(ads).set({
    ...data.title !== void 0 && { title: data.title },
    ...data.description !== void 0 && { description: data.description },
    ...data.imageUrl !== void 0 && { imageUrl: data.imageUrl },
    ...data.linkUrl !== void 0 && { linkUrl: data.linkUrl },
    ...data.isActive !== void 0 && { isActive: data.isActive },
    ...data.position !== void 0 && { position: data.position },
    ...data.bgColor !== void 0 && { bgColor: data.bgColor },
    ...data.textColor !== void 0 && { textColor: data.textColor },
    ...data.sortOrder !== void 0 && { sortOrder: data.sortOrder },
    ...data.type !== void 0 && { type: data.type }
  }).where(eq(ads.id, id));
}
async function deleteAd(id) {
  await db.delete(ads).where(eq(ads.id, id));
}
async function incrementAdClicks(id) {
  await db.update(ads).set({ clickCount: sql2`${ads.clickCount} + 1` }).where(eq(ads.id, id));
}
async function generateBetaCode() {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const [bc] = await db.insert(betaCodes).values({ id: randomUUID(), code }).returning();
  return bc;
}
async function getBetaCodes() {
  return db.select().from(betaCodes).orderBy(desc(betaCodes.createdAt)).limit(50);
}
async function validateBetaCodeStandalone(code) {
  const wl = await db.select().from(waitlist).where(and(eq(waitlist.betaCode, code), eq(waitlist.status, "approved"))).limit(1);
  if (wl.length > 0) return true;
  const bc = await db.select().from(betaCodes).where(and(eq(betaCodes.code, code), eq(betaCodes.isUsed, false))).limit(1);
  return bc.length > 0;
}
async function markBetaCodeUsed(code, userId) {
  await db.update(betaCodes).set({ isUsed: true, usedBy: userId, usedAt: /* @__PURE__ */ new Date() }).where(eq(betaCodes.code, code));
}
async function getComments(quoteId) {
  const rows = await db.select({
    id: quoteComments.id,
    userId: quoteComments.userId,
    quoteId: quoteComments.quoteId,
    text: quoteComments.text,
    createdAt: quoteComments.createdAt,
    username: users.username
  }).from(quoteComments).innerJoin(users, eq(quoteComments.userId, users.id)).where(eq(quoteComments.quoteId, quoteId)).orderBy(desc(quoteComments.createdAt));
  return rows;
}
async function addComment(userId, quoteId, text2) {
  const [comment] = await db.insert(quoteComments).values({ id: randomUUID(), userId, quoteId, text: text2 }).returning();
  const user = await getUserById(userId);
  await checkAndAwardBadge(userId, "first_comment", async () => {
    const [{ cnt }] = await db.select({ cnt: sql2`count(*)` }).from(quoteComments).where(eq(quoteComments.userId, userId));
    return Number(cnt) >= 1;
  });
  return { ...comment, username: user?.username || "unknown" };
}
async function deleteComment(commentId, userId) {
  await db.delete(quoteComments).where(and(eq(quoteComments.id, commentId), eq(quoteComments.userId, userId)));
}
async function toggleBookmark(userId, quoteId) {
  const existing = await db.select().from(quoteBookmarks).where(and(eq(quoteBookmarks.userId, userId), eq(quoteBookmarks.quoteId, quoteId))).limit(1);
  if (existing.length > 0) {
    await db.delete(quoteBookmarks).where(eq(quoteBookmarks.id, existing[0].id));
    return { bookmarked: false };
  }
  await db.insert(quoteBookmarks).values({ id: randomUUID(), userId, quoteId });
  await checkAndAwardBadge(userId, "collector", async () => {
    const [{ cnt }] = await db.select({ cnt: sql2`count(*)` }).from(quoteBookmarks).where(eq(quoteBookmarks.userId, userId));
    return Number(cnt) >= 20;
  });
  return { bookmarked: true };
}
async function getBookmarkedQuotes(userId) {
  const bms = await db.select({ quoteId: quoteBookmarks.quoteId }).from(quoteBookmarks).where(eq(quoteBookmarks.userId, userId)).orderBy(desc(quoteBookmarks.createdAt));
  if (bms.length === 0) return [];
  const ids = bms.map((b) => b.quoteId);
  const rows = await db.select().from(quotes).where(inArray(quotes.id, ids));
  const ordered = ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean);
  return attachTags(ordered, userId);
}
async function toggleFollow(userId, authorName) {
  const existing = await db.select().from(authorFollows).where(and(eq(authorFollows.userId, userId), eq(authorFollows.authorName, authorName))).limit(1);
  if (existing.length > 0) {
    await db.delete(authorFollows).where(eq(authorFollows.id, existing[0].id));
  } else {
    await db.insert(authorFollows).values({ id: randomUUID(), userId, authorName });
  }
  const [{ cnt }] = await db.select({ cnt: sql2`count(*)` }).from(authorFollows).where(eq(authorFollows.authorName, authorName));
  return { following: existing.length === 0, followersCount: Number(cnt) };
}
async function isFollowing(userId, authorName) {
  const rows = await db.select().from(authorFollows).where(and(eq(authorFollows.userId, userId), eq(authorFollows.authorName, authorName))).limit(1);
  return rows.length > 0;
}
async function getFollowersCount(authorName) {
  const [{ cnt }] = await db.select({ cnt: sql2`count(*)` }).from(authorFollows).where(eq(authorFollows.authorName, authorName));
  return Number(cnt);
}
async function getCollections() {
  const cols = await db.select().from(collections).where(eq(collections.isPublic, true)).orderBy(desc(collections.createdAt));
  const colIds = cols.map((c) => c.id);
  const counts = colIds.length > 0 ? await db.select({ collectionId: collectionQuotes.collectionId, cnt: sql2`count(*)` }).from(collectionQuotes).where(inArray(collectionQuotes.collectionId, colIds)).groupBy(collectionQuotes.collectionId) : [];
  const countMap = new Map(counts.map((r) => [r.collectionId, Number(r.cnt)]));
  const curatorIds = cols.map((c) => c.curatorId).filter(Boolean);
  const curatorMap = /* @__PURE__ */ new Map();
  if (curatorIds.length > 0) {
    const curators = await db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.id, curatorIds));
    for (const c of curators) curatorMap.set(c.id, c.username);
  }
  return cols.map((c) => ({ ...c, quoteCount: countMap.get(c.id) || 0, curatorUsername: c.curatorId ? curatorMap.get(c.curatorId) : void 0 }));
}
async function getCollectionById(id, userId) {
  const [col] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  if (!col) return void 0;
  const cqs = await db.select({ quoteId: collectionQuotes.quoteId }).from(collectionQuotes).where(eq(collectionQuotes.collectionId, id)).orderBy(collectionQuotes.sortOrder);
  const qIds = cqs.map((r) => r.quoteId);
  let qs = [];
  if (qIds.length > 0) {
    const rows = await db.select().from(quotes).where(inArray(quotes.id, qIds));
    const ordered = qIds.map((id2) => rows.find((r) => r.id === id2)).filter(Boolean);
    qs = await attachTags(ordered, userId);
  }
  const [{ cnt }] = await db.select({ cnt: sql2`count(*)` }).from(collectionQuotes).where(eq(collectionQuotes.collectionId, id));
  let curatorUsername;
  if (col.curatorId) {
    const [u] = await db.select({ username: users.username }).from(users).where(eq(users.id, col.curatorId)).limit(1);
    curatorUsername = u?.username;
  }
  return { collection: { ...col, quoteCount: Number(cnt), curatorUsername }, quotes: qs };
}
async function createCollection(data) {
  const [col] = await db.insert(collections).values({
    id: randomUUID(),
    name: data.name,
    description: data.description || null,
    coverColor: data.coverColor || "#FFF3B0",
    curatorId: data.curatorId,
    isPremium: data.isPremium || false,
    priceFlowers: data.priceFlowers || 0
  }).returning();
  return col;
}
async function addQuoteToCollection(collectionId, quoteId) {
  const [{ cnt }] = await db.select({ cnt: sql2`count(*)` }).from(collectionQuotes).where(eq(collectionQuotes.collectionId, collectionId));
  await db.insert(collectionQuotes).values({ collectionId, quoteId, sortOrder: Number(cnt) }).onConflictDoNothing();
}
async function removeQuoteFromCollection(collectionId, quoteId) {
  await db.delete(collectionQuotes).where(and(eq(collectionQuotes.collectionId, collectionId), eq(collectionQuotes.quoteId, quoteId)));
}
async function getActiveBattle(userId) {
  const now = /* @__PURE__ */ new Date();
  let [battle] = await db.select().from(quoteBattles).where(and(eq(quoteBattles.status, "active"), sql2`ends_at > ${now}`)).orderBy(desc(quoteBattles.createdAt)).limit(1);
  if (!battle) {
    battle = await createNewBattle();
    if (!battle) return null;
  }
  const [quoteA, quoteB] = await Promise.all([
    getQuoteById(battle.quoteAId, userId),
    getQuoteById(battle.quoteBId, userId)
  ]);
  if (!quoteA || !quoteB) return null;
  let myVote = null;
  if (userId) {
    const [vote] = await db.select().from(battleVotes).where(and(eq(battleVotes.userId, userId), eq(battleVotes.battleId, battle.id))).limit(1);
    myVote = vote?.votedQuoteId || null;
  }
  return { ...battle, quoteA, quoteB, myVote };
}
async function createNewBattle() {
  const randomQuotes = await db.select().from(quotes).where(eq(quotes.status, "approved")).orderBy(sql2`random()`).limit(2);
  if (randomQuotes.length < 2) return null;
  const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
  const [battle] = await db.insert(quoteBattles).values({
    id: randomUUID(),
    quoteAId: randomQuotes[0].id,
    quoteBId: randomQuotes[1].id,
    endsAt
  }).returning();
  return battle;
}
async function voteBattle(userId, battleId, votedQuoteId) {
  const existing = await db.select().from(battleVotes).where(and(eq(battleVotes.userId, userId), eq(battleVotes.battleId, battleId))).limit(1);
  if (existing.length > 0) throw new Error("Kamu sudah vote di battle ini");
  const [battle] = await db.select().from(quoteBattles).where(eq(quoteBattles.id, battleId)).limit(1);
  if (!battle || battle.status !== "active") throw new Error("Battle tidak aktif");
  await db.insert(battleVotes).values({ id: randomUUID(), userId, battleId, votedQuoteId });
  const isA = votedQuoteId === battle.quoteAId;
  const [updated] = await db.update(quoteBattles).set(
    isA ? { votesA: sql2`votes_a + 1` } : { votesB: sql2`votes_b + 1` }
  ).where(eq(quoteBattles.id, battleId)).returning();
  await checkAndAwardBadge(userId, "battle_voter", async () => {
    const [{ cnt }] = await db.select({ cnt: sql2`count(*)` }).from(battleVotes).where(eq(battleVotes.userId, userId));
    return Number(cnt) >= 10;
  });
  return { votesA: updated.votesA, votesB: updated.votesB };
}
async function checkAndAwardBadge(userId, badgeType, check) {
  try {
    const existing = await db.select().from(userBadges).where(and(eq(userBadges.userId, userId), eq(userBadges.badgeType, badgeType))).limit(1);
    if (existing.length > 0) return;
    const earned = await check();
    if (earned) {
      await db.insert(userBadges).values({ id: randomUUID(), userId, badgeType }).onConflictDoNothing();
    }
  } catch {
  }
}
async function getUserBadges(userId) {
  return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
}
async function checkAllBadges(userId) {
  const [quoteCount] = await db.select({ cnt: sql2`count(*)` }).from(quotes).where(eq(quotes.userId, userId));
  const [likeCount] = await db.select({ cnt: sql2`count(*)` }).from(quoteLikes).where(eq(quoteLikes.userId, userId));
  const qc = Number(quoteCount.cnt);
  const lc = Number(likeCount.cnt);
  if (qc >= 1) await checkAndAwardBadge(userId, "first_quote", async () => true);
  if (qc >= 10) await checkAndAwardBadge(userId, "quote_10", async () => true);
  if (qc >= 50) await checkAndAwardBadge(userId, "quote_50", async () => true);
  if (lc >= 1) await checkAndAwardBadge(userId, "first_like", async () => true);
  if (lc >= 100) await checkAndAwardBadge(userId, "like_100", async () => true);
}
async function updateStreak(userId) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [existing] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1);
  if (!existing) {
    const [created] = await db.insert(userStreaks).values({
      id: randomUUID(),
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastVisitDate: today
    }).returning();
    return created;
  }
  if (existing.lastVisitDate === today) return existing;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const isConsecutive = existing.lastVisitDate === yesterday;
  const newStreak = isConsecutive ? existing.currentStreak + 1 : 1;
  const newLongest = Math.max(newStreak, existing.longestStreak);
  const [updated] = await db.update(userStreaks).set({
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastVisitDate: today
  }).where(eq(userStreaks.id, existing.id)).returning();
  if (newStreak >= 7) await checkAndAwardBadge(userId, "streak_7", async () => true);
  if (newStreak >= 30) await checkAndAwardBadge(userId, "streak_30", async () => true);
  return updated;
}
async function getStreak(userId) {
  const [row] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1);
  return row || null;
}
async function getOrCreateReferralCode(userId) {
  const [existing] = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
  if (existing) return existing.code;
  const code = "KV-" + randomUUID().slice(0, 6).toUpperCase();
  await db.insert(referralCodes).values({ id: randomUUID(), userId, code });
  return code;
}
async function useReferralCode(code, newUserId) {
  const [ref] = await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
  if (!ref || ref.userId === newUserId) return false;
  const alreadyUsed = await db.select().from(referralUses).where(eq(referralUses.referredId, newUserId)).limit(1);
  if (alreadyUsed.length > 0) return false;
  await db.insert(referralUses).values({ id: randomUUID(), referrerId: ref.userId, referredId: newUserId, flowersAmount: REFERRAL_BONUS_FLOWERS });
  await db.update(users).set({ flowersBalance: sql2`flowers_balance + ${REFERRAL_BONUS_FLOWERS}` }).where(eq(users.id, ref.userId));
  await db.update(users).set({ flowersBalance: sql2`flowers_balance + ${REFERRAL_BONUS_FLOWERS}` }).where(eq(users.id, newUserId));
  await db.insert(flowerTransactions).values({ id: randomUUID(), userId: ref.userId, type: "credit", amount: REFERRAL_BONUS_FLOWERS, description: `Bonus referral` });
  await db.insert(flowerTransactions).values({ id: randomUUID(), userId: newUserId, type: "credit", amount: REFERRAL_BONUS_FLOWERS, description: `Bonus referral` });
  return true;
}
async function getReferralStats(userId) {
  const code = await getOrCreateReferralCode(userId);
  const [stats] = await db.select({
    cnt: sql2`count(*)`,
    total: sql2`COALESCE(sum(flowers_amount), 0)`
  }).from(referralUses).where(eq(referralUses.referrerId, userId));
  return { code, totalReferred: Number(stats.cnt), totalFlowers: Number(stats.total) };
}
async function getAuthorLeaderboard() {
  const rows = await db.select({
    author: quotes.author,
    totalQuotes: sql2`count(*)`,
    totalLikes: sql2`COALESCE(sum(likes_count), 0)`,
    totalViews: sql2`COALESCE(sum(COALESCE(view_count, 0)), 0)`
  }).from(quotes).where(and(eq(quotes.status, "approved"), sql2`author IS NOT NULL`)).groupBy(quotes.author).orderBy(desc(sql2`COALESCE(sum(likes_count), 0) + COALESCE(sum(COALESCE(view_count, 0)), 0)`)).limit(50);
  return rows.map((r) => ({
    author: r.author,
    totalQuotes: Number(r.totalQuotes),
    totalLikes: Number(r.totalLikes),
    totalViews: Number(r.totalViews),
    score: Number(r.totalLikes) + Number(r.totalViews)
  }));
}
async function submitVerificationRequest(userId, reason, socialLink) {
  const existing = await db.select().from(verificationRequests).where(and(eq(verificationRequests.userId, userId), eq(verificationRequests.status, "pending"))).limit(1);
  if (existing.length > 0) throw new Error("Kamu sudah memiliki pengajuan yang masih pending");
  const [created] = await db.insert(verificationRequests).values({ id: randomUUID(), userId, reason, socialLink: socialLink || null }).returning();
  return created;
}
async function getMyVerificationRequest(userId) {
  const rows = await db.select().from(verificationRequests).where(eq(verificationRequests.userId, userId)).orderBy(desc(verificationRequests.createdAt)).limit(1);
  return rows[0] || null;
}
async function getAllVerificationRequests() {
  const rows = await db.select({
    id: verificationRequests.id,
    userId: verificationRequests.userId,
    reason: verificationRequests.reason,
    socialLink: verificationRequests.socialLink,
    status: verificationRequests.status,
    adminNote: verificationRequests.adminNote,
    createdAt: verificationRequests.createdAt,
    username: users.username,
    email: users.email
  }).from(verificationRequests).leftJoin(users, eq(verificationRequests.userId, users.id)).orderBy(desc(verificationRequests.createdAt));
  return rows;
}
async function updateVerificationRequest(id, status, adminNote) {
  await db.update(verificationRequests).set({ status, adminNote: adminNote || null }).where(eq(verificationRequests.id, id));
  if (status === "approved") {
    const [req] = await db.select().from(verificationRequests).where(eq(verificationRequests.id, id)).limit(1);
    if (req) {
      await db.update(users).set({ isVerified: true }).where(eq(users.id, req.userId));
    }
  }
}
async function createDonation(donorName, amount, message, invoice) {
  const [row] = await db.insert(donations).values({
    id: randomUUID(),
    donorName: donorName || "Anonim",
    message: message || null,
    amount,
    invoiceId: invoice?.invoiceId || null,
    paymentUrl: invoice?.paymentUrl || null,
    finalAmount: invoice?.finalAmount || null,
    status: "pending"
  }).returning();
  return row;
}
async function getDonationByInvoice(invoiceId) {
  const rows = await db.select().from(donations).where(eq(donations.invoiceId, invoiceId)).limit(1);
  return rows[0] || null;
}
async function updateDonationStatus(invoiceId, status) {
  await db.update(donations).set({ status }).where(eq(donations.invoiceId, invoiceId));
}
async function getRecentDonations(limit = 20) {
  return db.select().from(donations).where(eq(donations.status, "paid")).orderBy(desc(donations.createdAt)).limit(limit);
}
var DB_URL, isSupabase, pool, db, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
    isSupabase = DB_URL.includes("supabase");
    pool = new Pool({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
      ...isSupabase ? { options: "-c search_path=public" } : {}
    });
    db = drizzle(pool);
    storage = {
      getQuotes,
      getQuoteById,
      searchQuotes,
      submitQuote,
      getPendingQuotes,
      updateQuoteStatus,
      getTags,
      getRelatedQuotes,
      toggleLike,
      incrementViewCount,
      getQuoteOfTheDay,
      getTrendingQuotes,
      getQuotesByAuthor,
      getQuotesByUsername,
      getUserStatsByUsername,
      getAuthorStats,
      createUser,
      getUserByEmail,
      getUserById,
      getAllUsers,
      searchUsers,
      updateUser,
      verifyPassword,
      addToWaitlist,
      getWaitlist,
      getWaitlistById,
      updateWaitlistStatus,
      validateBetaCode,
      getAllSettings,
      getSetting,
      setSetting,
      getGiftTypes,
      getAllGiftTypes,
      createGiftType,
      updateGiftType,
      sendGift,
      getFlowerHistory,
      getWithdrawalMethods,
      getAllWithdrawalMethods,
      createWithdrawalMethod,
      updateWithdrawalMethod,
      requestWithdrawal,
      getWithdrawalRequests,
      updateWithdrawalStatus,
      getTopupPackages,
      getAllTopupPackages,
      createTopupPackage,
      updateTopupPackage,
      createTopupRequest,
      getTopupRequests,
      updateTopupStatus,
      getTopupRequestByInvoice,
      updateTopupInvoiceStatus,
      createDonation,
      getDonationByInvoice,
      updateDonationStatus,
      getRecentDonations,
      generateBetaCode,
      getBetaCodes,
      validateBetaCodeStandalone,
      markBetaCodeUsed,
      applyForGiftRole,
      getMyGiftRoleApplication,
      getAllGiftRoleApplications,
      updateGiftRoleApplication,
      getActiveAds,
      getAllAds,
      createAd,
      updateAd,
      deleteAd,
      incrementAdClicks,
      getComments,
      addComment,
      deleteComment,
      toggleBookmark,
      getBookmarkedQuotes,
      toggleFollow,
      isFollowing,
      getFollowersCount,
      getCollections,
      getCollectionById,
      createCollection,
      addQuoteToCollection,
      removeQuoteFromCollection,
      getActiveBattle,
      voteBattle,
      getUserBadges,
      checkAllBadges,
      updateStreak,
      getStreak,
      getOrCreateReferralCode,
      useReferralCode,
      getReferralStats,
      getAuthorLeaderboard,
      submitVerificationRequest,
      getMyVerificationRequest,
      getAllVerificationRequests,
      updateVerificationRequest
    };
  }
});

// server/seed.ts
var seed_exports = {};
__export(seed_exports, {
  seedDatabase: () => seedDatabase
});
import { randomUUID as randomUUID3 } from "crypto";
import { sql as sql3, eq as eq2 } from "drizzle-orm";
import bcrypt2 from "bcryptjs";
async function ensureTable(name, ddl) {
  try {
    await db.execute(sql3.raw(ddl));
  } catch (e) {
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
  await ensureTable("users_is_verified", `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false`);
  await ensureTable("verification_requests", `
    CREATE TABLE IF NOT EXISTS verification_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason text NOT NULL,
      social_link text,
      status varchar NOT NULL DEFAULT 'pending',
      admin_note text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await ensureTable("topup_invoice_id", `ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS invoice_id text`);
  await ensureTable("topup_payment_url", `ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS payment_url text`);
  await ensureTable("topup_final_amount", `ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS final_amount integer`);
  await ensureTable("topup_payment_expiry", `ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS payment_expiry timestamptz`);
  await ensureTable("donations", `
    CREATE TABLE IF NOT EXISTS donations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      donor_name text NOT NULL DEFAULT 'Anonim',
      message text,
      amount integer NOT NULL,
      invoice_id text,
      payment_url text,
      final_amount integer,
      status text NOT NULL DEFAULT 'pending',
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
async function seedDatabase() {
  await runMigrations();
  try {
    const [{ quoteCount }] = await db.select({ quoteCount: sql3`count(*)` }).from(quotes);
    if (Number(quoteCount) === 0) {
      console.log("[seed] Seeding quotes...");
      const tagMap = /* @__PURE__ */ new Map();
      for (const [slug, name] of Object.entries(ALL_TAGS)) {
        const id = randomUUID3();
        await db.insert(tags).values({ id, name, slug }).onConflictDoNothing();
        tagMap.set(slug, id);
      }
      const existingTags = await db.select().from(tags);
      for (const tag of existingTags) tagMap.set(tag.slug, tag.id);
      for (const q of SEED_QUOTES) {
        const id = randomUUID3();
        await db.insert(quotes).values({ id, text: q.text, author: q.author, mood: q.mood, status: "approved" });
        for (const tagSlug of q.tags) {
          let tagId = tagMap.get(tagSlug);
          if (!tagId) {
            const newTagId = randomUUID3();
            await db.insert(tags).values({ id: newTagId, name: tagSlug, slug: tagSlug }).onConflictDoNothing();
            tagMap.set(tagSlug, newTagId);
            tagId = newTagId;
          }
          await db.insert(quoteTags).values({ quoteId: id, tagId }).onConflictDoNothing();
        }
      }
      console.log(`[seed] Seeded ${SEED_QUOTES.length} quotes!`);
    }
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await db.insert(settings).values({ key, value }).onConflictDoNothing();
    }
    const [{ giftCount }] = await db.select({ giftCount: sql3`count(*)` }).from(giftTypes);
    if (Number(giftCount) === 0) {
      for (const gt of DEFAULT_GIFT_TYPES) {
        await db.insert(giftTypes).values({ id: randomUUID3(), ...gt }).onConflictDoNothing();
      }
    }
    const [{ wmCount }] = await db.select({ wmCount: sql3`count(*)` }).from(withdrawalMethods);
    if (Number(wmCount) === 0) {
      for (const wm of DEFAULT_WITHDRAWAL_METHODS) {
        await db.insert(withdrawalMethods).values({ id: randomUUID3(), ...wm }).onConflictDoNothing();
      }
    }
    const [{ adminCount }] = await db.select({ adminCount: sql3`count(*)` }).from(users).where(eq2(users.role, "admin"));
    if (Number(adminCount) === 0) {
      const passwordHash = await bcrypt2.hash("admin123", 10);
      await db.insert(users).values({ id: randomUUID3(), email: "admin@kataviral.id", username: "admin", passwordHash, role: "admin", hasBetaAccess: true }).onConflictDoNothing();
      console.log("[seed] Admin user created: admin@kataviral.id / admin123");
    }
    console.log("[seed] Database ready!");
  } catch (e) {
    console.error("[seed] Error:", e);
  }
}
var SEED_QUOTES, ALL_TAGS, DEFAULT_SETTINGS, DEFAULT_GIFT_TYPES, DEFAULT_WITHDRAWAL_METHODS;
var init_seed = __esm({
  "server/seed.ts"() {
    "use strict";
    init_storage();
    init_schema();
    SEED_QUOTES = [
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
      { text: "Cemburu itu tanda sayang? Tidak. Itu tanda tidak percaya diri.", author: "Anonim", mood: "sindir", tags: ["bucin", "cinta"] }
    ];
    ALL_TAGS = {
      moveon: "Move On",
      produktif: "Produktif",
      sukses: "Sukses",
      patahhati: "Patah Hati",
      motivasi: "Motivasi",
      friendship: "Friendship",
      chill: "Chill",
      mindset: "Mindset",
      selflove: "Self Love",
      random: "Random",
      kehidupan: "Kehidupan",
      bucin: "Bucin"
    };
    DEFAULT_SETTINGS = {
      maintenance_mode: "false",
      beta_mode: "false",
      beta_access_type: "open",
      site_name: "CTRXL.ID",
      site_description: "Platform Quote Indonesia"
    };
    DEFAULT_GIFT_TYPES = [
      { name: "Bunga Mawar", icon: "rose", costFlowers: 10 },
      { name: "Bintang", icon: "star", costFlowers: 25 },
      { name: "Berlian", icon: "diamond", costFlowers: 100 }
    ];
    DEFAULT_WITHDRAWAL_METHODS = [
      { name: "Bank BCA", type: "bank", code: "BCA" },
      { name: "Bank BRI", type: "bank", code: "BRI" },
      { name: "Bank Mandiri", type: "bank", code: "MANDIRI" },
      { name: "OVO", type: "ewallet", code: "OVO" },
      { name: "GoPay", type: "ewallet", code: "GOPAY" },
      { name: "Dana", type: "ewallet", code: "DANA" }
    ];
  }
});

// api/_source.ts
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool as Pool2 } from "pg";
import { createServer } from "http";

// server/routes.ts
init_storage();
init_schema();

// server/auth.ts
init_storage();
async function loadUser(req, _res, next) {
  if (req.session.userId) {
    try {
      const user = await getUserById(req.session.userId);
      if (user) req.user = user;
    } catch {
    }
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Silakan login terlebih dahulu" });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Silakan login terlebih dahulu" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak" });
  next();
}

// server/routes.ts
import { randomUUID as randomUUID2 } from "crypto";

// server/email.ts
import nodemailer from "nodemailer";
async function sendBetaCodeEmail(to, name, betaCode) {
  const smtpLogin = process.env.BREVO_SMTP_LOGIN;
  const smtpKey = process.env.BREVO_SMTP_KEY;
  if (!smtpLogin || !smtpKey) {
    throw new Error(`SMTP credentials not configured (login=${smtpLogin ? "set" : "missing"}, key=${smtpKey ? "set" : "missing"})`);
  }
  const displayName = name || "Kamu";
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpLogin,
      pass: smtpKey
    }
  });
  await transporter.sendMail({
    from: `"CTRXL.ID" <${smtpLogin}>`,
    to,
    subject: "Selamat! Kode Beta Akses CTRXL.ID Kamu Sudah Siap",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFF8E7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8E7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:3px solid #000000;border-radius:12px;box-shadow:6px 6px 0px #000000;">
          <tr>
            <td style="background-color:#FFE066;padding:30px 40px;border-bottom:3px solid #000;border-radius:9px 9px 0 0;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#000;">CTRXL.ID</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#000;">
                Hai ${displayName}!
              </h2>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#333;">
                Selamat! Pendaftaran waitlist kamu sudah di-approve. Kamu sekarang bisa masuk ke CTRXL.ID menggunakan kode beta akses di bawah ini:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <div style="display:inline-block;background-color:#FFE066;border:3px solid #000;border-radius:8px;padding:16px 32px;box-shadow:4px 4px 0px #000;">
                      <span style="font-size:32px;font-weight:800;letter-spacing:4px;color:#000;font-family:monospace;">
                        ${betaCode}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:16px;line-height:1.6;color:#333;">
                Cara pakai:
              </p>
              <ol style="margin:8px 0 20px;padding-left:20px;font-size:15px;line-height:1.8;color:#333;">
                <li>Buka website CTRXL.ID</li>
                <li>Klik tombol <strong>"Masuk"</strong></li>
                <li>Daftar akun baru</li>
                <li>Masukkan kode beta akses di atas saat diminta</li>
              </ol>
              <p style="margin:0;font-size:14px;color:#666;">
                Kode ini hanya berlaku untuk satu kali penggunaan. Jangan bagikan ke orang lain ya!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5f5f5;padding:20px 40px;border-top:2px solid #eee;border-radius:0 0 9px 9px;">
              <p style="margin:0;font-size:13px;color:#999;text-align:center;">
                &copy; CTRXL.ID \u2014 Platform Quote Indonesia
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  });
}

// server/bayar.ts
var BAYAR_GG_BASE = "https://bayar.gg/api";
function getApiKey() {
  return process.env.BAYAR_GG_API_KEY || "";
}
async function createQrisPayment(amount, callbackUrl) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("[bayar.gg] BAYAR_GG_API_KEY not set");
    return { success: false, error: "API key not configured" };
  }
  try {
    const url = `${BAYAR_GG_BASE}/create-payment.php?apiKey=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        payment_method: "gopay_qris",
        callback_url: callbackUrl || void 0
      })
    });
    const json = await res.json();
    console.log("[bayar.gg] create-payment response:", JSON.stringify(json));
    return json;
  } catch (e) {
    console.error("[bayar.gg] create-payment error:", e.message);
    return { success: false, error: e.message };
  }
}
async function checkPaymentStatus(invoiceId) {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: "API key not configured" };
  try {
    const url = `${BAYAR_GG_BASE}/check-payment?apiKey=${apiKey}&invoice=${encodeURIComponent(invoiceId)}`;
    const res = await fetch(url);
    return res.json();
  } catch (e) {
    console.error("[bayar.gg] check-payment error:", e.message);
    return { success: false, error: e.message };
  }
}

// server/routes.ts
var rateLimitMap = /* @__PURE__ */ new Map();
function checkRateLimit(ip, max = 5, windowMs = 10 * 60 * 1e3) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
async function registerRoutes(httpServer2, app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
      const { email, username, password, betaCode } = parsed.data;
      const betaMode = await getSetting("beta_mode", "false");
      const accessType = await getSetting("beta_access_type", "open");
      if (betaMode === "true") {
        if (accessType === "waitlist") {
          return res.status(403).json({ error: "Registrasi hanya untuk pengguna waitlist yang diundang. Daftar waitlist dulu!" });
        }
        if (accessType === "code") {
          if (!betaCode) return res.status(403).json({ error: "Kode beta diperlukan untuk registrasi" });
          const valid = await storage.validateBetaCodeStandalone(betaCode);
          if (!valid) return res.status(403).json({ error: "Kode beta tidak valid atau sudah digunakan" });
        }
      }
      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) return res.status(409).json({ error: "Email sudah terdaftar" });
      const user = await storage.createUser({ email: email.toLowerCase(), username, password });
      req.session.userId = user.id;
      if (betaCode) await storage.markBetaCodeUsed(betaCode, user.id).catch(() => {
      });
      res.status(201).json({ user });
    } catch (e) {
      if (e.code === "23505") return res.status(409).json({ error: "Email atau username sudah digunakan" });
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) return res.status(401).json({ error: "Email atau password salah" });
      if (!user.isActive) return res.status(403).json({ error: "Akun Anda dinonaktifkan" });
      const valid = await storage.verifyPassword(user, password);
      if (!valid) return res.status(401).json({ error: "Email atau password salah" });
      req.session.userId = user.id;
      const { passwordHash: _, ...pub } = user;
      res.json({ user: pub });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });
  app2.get("/api/auth/me", (req, res) => {
    if (!req.user) return res.json({ user: null });
    const { passwordHash: _, ...pub } = req.user;
    res.json({ user: pub });
  });
  app2.post("/api/waitlist", async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || typeof email !== "string") return res.status(400).json({ error: "Email wajib diisi" });
      const entry = await storage.addToWaitlist(email, name);
      res.status(201).json(entry);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/settings/public", async (_req, res) => {
    try {
      const s = await storage.getAllSettings();
      res.json({
        maintenanceMode: s.maintenance_mode === "true",
        betaMode: s.beta_mode === "true",
        betaAccessType: s.beta_access_type || "open",
        siteName: s.site_name || "CTRXL.ID",
        siteDescription: s.site_description || "Platform Quote Indonesia",
        notificationEnabled: s.notification_enabled === "true",
        notificationType: s.notification_type || "banner",
        notificationMessage: s.notification_message || "",
        notificationBg: s.notification_bg || "#FFE34D",
        notificationTextColor: s.notification_text_color || "#000000"
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/quotes", async (req, res) => {
    try {
      const { mood, tag, page, limit } = req.query;
      const result = await storage.getQuotes({
        mood,
        tagSlug: tag,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 12,
        userId: req.user?.id
      });
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/quotes/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") return res.json([]);
      const results = await storage.searchQuotes(q, req.user?.id);
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/quotes/daily", async (req, res) => {
    try {
      const quote = await storage.getQuoteOfTheDay(req.user?.id);
      if (!quote) return res.status(404).json({ error: "Belum ada quote" });
      res.json(quote);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/quotes/trending", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const trending = await storage.getTrendingQuotes(limit, req.user?.id);
      res.json(trending);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/author/:name", async (req, res) => {
    try {
      const param = decodeURIComponent(req.params.name);
      if (param.startsWith("@")) {
        const username = param.slice(1);
        const [quotesResult, stats] = await Promise.all([
          storage.getQuotesByUsername(username, req.user?.id),
          storage.getUserStatsByUsername(username)
        ]);
        if (!stats) return res.json({ author: `@${username}`, quotes: [], stats: { totalQuotes: 0, totalLikes: 0, totalViews: 0 }, isVerified: false });
        res.json({ author: `@${username}`, quotes: quotesResult, stats, isVerified: stats.isVerified });
      } else {
        const [quotesResult, stats] = await Promise.all([
          storage.getQuotesByAuthor(param, req.user?.id),
          storage.getAuthorStats(param)
        ]);
        res.json({ author: param, quotes: quotesResult, stats });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/quotes/:id", async (req, res) => {
    try {
      const quote = await storage.getQuoteById(req.params.id, req.user?.id);
      if (!quote) return res.status(404).json({ error: "Quote tidak ditemukan" });
      storage.incrementViewCount(req.params.id).catch(() => {
      });
      res.json(quote);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/quotes/:id/related", async (req, res) => {
    try {
      const quote = await storage.getQuoteById(req.params.id);
      if (!quote) return res.status(404).json({ error: "Quote tidak ditemukan" });
      const related = await storage.getRelatedQuotes(quote.mood, quote.id, req.user?.id);
      res.json(related);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/quotes", requireAuth, async (req, res) => {
    try {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) return res.status(429).json({ error: "Terlalu banyak submit. Coba lagi dalam 10 menit." });
      const parsed = submitQuoteSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
      const { tags: tagNames = [], ...quoteData } = parsed.data;
      if (!quoteData.isAnonymous) {
        quoteData.author = req.user.username;
      }
      const quote = await storage.submitQuote(quoteData, tagNames, req.user.id);
      res.status(201).json(quote);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/quotes/:id/like", requireAuth, async (req, res) => {
    try {
      const result = await storage.toggleLike(req.user.id, req.params.id);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/tags", async (_req, res) => {
    try {
      res.json(await storage.getTags());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const q = (req.query.q || "").trim();
      if (q.length < 2) return res.json([]);
      res.json(await storage.searchUsers(q, req.user.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/gifts/types", async (_req, res) => {
    try {
      res.json(await storage.getGiftTypes());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/gifts/send", requireAuth, async (req, res) => {
    try {
      const { receiverId, giftTypeId, quoteId, message } = req.body;
      if (!receiverId || !giftTypeId) return res.status(400).json({ error: "Data tidak lengkap" });
      await storage.sendGift(req.user.id, receiverId, giftTypeId, quoteId, message);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.get("/api/flowers/history", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getFlowerHistory(req.user.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/withdrawal/methods", async (_req, res) => {
    try {
      res.json(await storage.getWithdrawalMethods());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/withdrawal/request", requireAuth, async (req, res) => {
    try {
      const { methodId, accountNumber, accountName, flowersAmount } = req.body;
      if (!methodId || !accountNumber || !accountName || !flowersAmount) return res.status(400).json({ error: "Data tidak lengkap" });
      const result = await storage.requestWithdrawal(req.user.id, methodId, accountNumber, accountName, parseInt(flowersAmount));
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.get("/api/withdrawal/my", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getWithdrawalRequests(req.user.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/quotes", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getPendingQuotes());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (status !== "approved" && status !== "rejected") return res.status(400).json({ error: "Status tidak valid" });
      await storage.updateQuoteStatus(req.params.id, status);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getAllSettings());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: "Key wajib diisi" });
      await setSetting(key, String(value));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getAllUsers());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { isActive, hasBetaAccess, isGiveEnabled, role, flowersBalance, isVerified } = req.body;
      const data = {};
      if (isActive !== void 0) data.isActive = isActive;
      if (hasBetaAccess !== void 0) data.hasBetaAccess = hasBetaAccess;
      if (isGiveEnabled !== void 0) data.isGiveEnabled = isGiveEnabled;
      if (role !== void 0) data.role = role;
      if (flowersBalance !== void 0) data.flowersBalance = parseInt(flowersBalance);
      if (isVerified !== void 0) data.isVerified = isVerified;
      await storage.updateUser(req.params.id, data);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/waitlist", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getWaitlist());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/waitlist/:id", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const betaCode = status === "approved" ? randomUUID2().slice(0, 8).toUpperCase() : void 0;
      await storage.updateWaitlistStatus(req.params.id, status, betaCode);
      if (status === "approved" && betaCode) {
        const entry = await storage.getWaitlistById(req.params.id);
        if (entry?.email) {
          try {
            await sendBetaCodeEmail(entry.email, entry.name, betaCode);
            console.log(`[email] Beta code sent to ${entry.email}`);
          } catch (emailErr) {
            console.error(`[email] Failed to send to ${entry.email}:`, emailErr.message);
          }
        }
      }
      res.json({ success: true, betaCode });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/gifts", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getAllGiftTypes());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/admin/gifts", requireAdmin, async (req, res) => {
    try {
      const { name, icon, costFlowers } = req.body;
      const gt = await storage.createGiftType({ name, icon: icon || "flower", costFlowers: parseInt(costFlowers) || 10 });
      res.status(201).json(gt);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/gifts/:id", requireAdmin, async (req, res) => {
    try {
      await storage.updateGiftType(req.params.id, req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/withdrawals", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getWithdrawalRequests());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/withdrawals/:id", requireAdmin, async (req, res) => {
    try {
      const { status, adminNote } = req.body;
      await storage.updateWithdrawalStatus(req.params.id, status, adminNote);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/withdrawal-methods", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getAllWithdrawalMethods());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/admin/withdrawal-methods", requireAdmin, async (req, res) => {
    try {
      const wm = await storage.createWithdrawalMethod(req.body);
      res.status(201).json(wm);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/withdrawal-methods/:id", requireAdmin, async (req, res) => {
    try {
      await storage.updateWithdrawalMethod(req.params.id, req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/topup/packages", async (_req, res) => {
    try {
      res.json(await storage.getTopupPackages());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/topup/payment-info", async (_req, res) => {
    try {
      const bankName = await getSetting("topup_bank_name", "");
      const accountNumber = await getSetting("topup_account_number", "");
      const accountName = await getSetting("topup_account_name", "");
      res.json({ bankName: bankName || null, accountNumber: accountNumber || null, accountName: accountName || null });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/topup/request", requireAuth, async (req, res) => {
    try {
      const { packageId } = req.body;
      if (!packageId) return res.status(400).json({ error: "PackageId wajib diisi" });
      const packages = await storage.getTopupPackages();
      const pkg = packages.find((p) => p.id === packageId);
      if (!pkg) return res.status(400).json({ error: "Paket tidak ditemukan" });
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost";
      const callbackUrl = `${protocol}://${host}/api/topup/callback`;
      const qris = await createQrisPayment(pkg.priceIdr, callbackUrl);
      if (!qris.success || !qris.data) {
        console.error("[topup] QRIS payment creation failed:", qris.error || "Unknown error");
        return res.status(500).json({ error: "Gagal membuat pembayaran QRIS. Silakan coba lagi." });
      }
      const result = await storage.createTopupRequest(req.user.id, packageId, {
        invoiceId: qris.data.invoice_id,
        paymentUrl: qris.data.payment_url,
        finalAmount: qris.data.final_amount,
        expiresAt: qris.data.expires_at
      });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.get("/api/topup/check/:invoiceId", requireAuth, async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const topupReq = await storage.getTopupRequestByInvoice(invoiceId);
      if (!topupReq || topupReq.userId !== req.user.id) return res.status(404).json({ error: "Not found" });
      const status = await checkPaymentStatus(invoiceId);
      if (status.success && status.status === "paid" && topupReq.status === "pending") {
        await storage.updateTopupStatus(topupReq.id, "confirmed", "Pembayaran otomatis via QRIS");
      }
      res.json({ status: status.status, paid_at: status.paid_at });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/topup/callback", async (req, res) => {
    try {
      const { invoice_id, status } = req.body;
      if (status === "paid" && invoice_id) {
        const topupReq = await storage.getTopupRequestByInvoice(invoice_id);
        if (topupReq && topupReq.status === "pending") {
          await storage.updateTopupStatus(topupReq.id, "confirmed", "Pembayaran otomatis via QRIS");
        }
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/topup/my", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getTopupRequests(req.user.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/topup/packages", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getAllTopupPackages());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/admin/topup/packages", requireAdmin, async (req, res) => {
    try {
      const { name, icon, description, flowersAmount, priceIdr, sortOrder } = req.body;
      const pkg = await storage.createTopupPackage({
        name,
        icon: icon || "\u{1F338}",
        description: description || null,
        flowersAmount: parseInt(flowersAmount),
        priceIdr: parseInt(priceIdr),
        isActive: true,
        sortOrder: parseInt(sortOrder) || 0
      });
      res.status(201).json(pkg);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/topup/packages/:id", requireAdmin, async (req, res) => {
    try {
      await storage.updateTopupPackage(req.params.id, req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/topup/requests", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getTopupRequests());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/topup/requests/:id", requireAdmin, async (req, res) => {
    try {
      const { status, adminNote } = req.body;
      await storage.updateTopupStatus(req.params.id, status, adminNote);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/gift-role/apply", requireAuth, async (req, res) => {
    try {
      const { type, reason, socialLink } = req.body;
      if (!reason || reason.trim().length < 10) return res.status(400).json({ error: "Alasan minimal 10 karakter" });
      const result = await storage.applyForGiftRole(req.user.id, type || "both", reason.trim(), socialLink);
      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.get("/api/gift-role/my", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getMyGiftRoleApplication(req.user.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/gift-role", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getAllGiftRoleApplications());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/gift-role/:id", requireAdmin, async (req, res) => {
    try {
      const { status, adminNote } = req.body;
      if (status !== "approved" && status !== "rejected") return res.status(400).json({ error: "Status tidak valid" });
      await storage.updateGiftRoleApplication(req.params.id, status, adminNote);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/ads", async (_req, res) => {
    try {
      res.json(await storage.getActiveAds());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/ads/:id/click", async (req, res) => {
    try {
      await storage.incrementAdClicks(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/ads", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getAllAds());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/admin/ads", requireAdmin, async (req, res) => {
    try {
      res.json(await storage.createAd(req.body));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/ads/:id", requireAdmin, async (req, res) => {
    try {
      await storage.updateAd(req.params.id, req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/admin/ads/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAd(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/admin/beta-codes", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getBetaCodes());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/admin/beta-codes/generate", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.generateBetaCode());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/quotes/:id/comments", async (req, res) => {
    try {
      res.json(await storage.getComments(req.params.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/quotes/:id/comments", requireAuth, async (req, res) => {
    try {
      const { text: text2 } = req.body;
      if (!text2 || typeof text2 !== "string" || text2.trim().length < 1) return res.status(400).json({ error: "Komentar tidak boleh kosong" });
      if (text2.length > 500) return res.status(400).json({ error: "Komentar maksimal 500 karakter" });
      const comment = await storage.addComment(req.user.id, req.params.id, text2.trim());
      res.status(201).json(comment);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteComment(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/quotes/:id/bookmark", requireAuth, async (req, res) => {
    try {
      res.json(await storage.toggleBookmark(req.user.id, req.params.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getBookmarkedQuotes(req.user.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/author/:name/follow", requireAuth, async (req, res) => {
    try {
      res.json(await storage.toggleFollow(req.user.id, decodeURIComponent(req.params.name)));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/author/:name/following", requireAuth, async (req, res) => {
    try {
      const following = await storage.isFollowing(req.user.id, decodeURIComponent(req.params.name));
      const followersCount = await storage.getFollowersCount(decodeURIComponent(req.params.name));
      res.json({ following, followersCount });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/collections", async (_req, res) => {
    try {
      res.json(await storage.getCollections());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/collections/:id", async (req, res) => {
    try {
      const data = await storage.getCollectionById(req.params.id, req.user?.id);
      if (!data) return res.status(404).json({ error: "Koleksi tidak ditemukan" });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/collections", requireAuth, async (req, res) => {
    try {
      const { name, description, coverColor, isPremium, priceFlowers } = req.body;
      if (!name) return res.status(400).json({ error: "Nama koleksi wajib diisi" });
      const col = await storage.createCollection({ name, description, coverColor, curatorId: req.user.id, isPremium, priceFlowers });
      res.status(201).json(col);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/collections/:id/quotes", requireAuth, async (req, res) => {
    try {
      await storage.addQuoteToCollection(req.params.id, req.body.quoteId);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/collections/:id/quotes/:quoteId", requireAuth, async (req, res) => {
    try {
      await storage.removeQuoteFromCollection(req.params.id, req.params.quoteId);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/battles/active", async (req, res) => {
    try {
      res.json(await storage.getActiveBattle(req.user?.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/battles/:id/vote", requireAuth, async (req, res) => {
    try {
      const { votedQuoteId } = req.body;
      if (!votedQuoteId) return res.status(400).json({ error: "Pilih quote untuk di-vote" });
      const result = await storage.voteBattle(req.user.id, req.params.id, votedQuoteId);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.get("/api/badges", requireAuth, async (req, res) => {
    try {
      await storage.checkAllBadges(req.user.id);
      const badges = await storage.getUserBadges(req.user.id);
      res.json(badges);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/streak/update", requireAuth, async (req, res) => {
    try {
      res.json(await storage.updateStreak(req.user.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/streak", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getStreak(req.user.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/referral", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getReferralStats(req.user.id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/referral/use", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Kode referral wajib diisi" });
      const success = await storage.useReferralCode(code, req.user.id);
      if (!success) return res.status(400).json({ error: "Kode tidak valid atau sudah digunakan" });
      res.json({ success: true, bonus: 50 });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/leaderboard", async (_req, res) => {
    try {
      res.json(await storage.getAuthorLeaderboard());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/verification/my", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getMyVerificationRequest(req.session.userId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/verification/apply", requireAuth, async (req, res) => {
    try {
      const { reason, socialLink } = req.body;
      if (!reason || reason.length < 10) return res.status(400).json({ error: "Alasan minimal 10 karakter" });
      const result = await storage.submitVerificationRequest(req.session.userId, reason, socialLink);
      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app2.get("/api/admin/verifications", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getAllVerificationRequests());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/admin/verifications/:id", requireAdmin, async (req, res) => {
    try {
      const { status, adminNote } = req.body;
      await storage.updateVerificationRequest(req.params.id, status, adminNote);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/embed/random", async (_req, res) => {
    try {
      const randomPage = Math.floor(Math.random() * 5) + 1;
      const result = await storage.getQuotes({ page: randomPage, limit: 1 });
      if (!result.quotes || result.quotes.length === 0) return res.status(404).json({ error: "No quotes" });
      const q = result.quotes[0];
      res.json({ text: q.text, author: q.author, mood: q.mood, id: q.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/donate", async (req, res) => {
    try {
      const { donorName, amount, message } = req.body;
      const numAmount = parseInt(amount);
      if (!numAmount || numAmount < 1e3) return res.status(400).json({ error: "Minimal donasi Rp 1.000" });
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost";
      const callbackUrl = `${protocol}://${host}/api/donate/callback`;
      const qris = await createQrisPayment(numAmount, callbackUrl);
      if (!qris.success || !qris.data) return res.status(500).json({ error: "Gagal membuat pembayaran QRIS" });
      const donation = await storage.createDonation(donorName || "Anonim", numAmount, message, {
        invoiceId: qris.data.invoice_id,
        paymentUrl: qris.data.payment_url,
        finalAmount: qris.data.final_amount
      });
      res.json(donation);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/donate/check/:invoiceId", async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const donation = await storage.getDonationByInvoice(invoiceId);
      if (!donation) return res.status(404).json({ error: "Not found" });
      const status = await checkPaymentStatus(invoiceId);
      if (status.success && status.status === "paid" && donation.status === "pending") {
        await storage.updateDonationStatus(invoiceId, "paid");
      }
      res.json({ status: status.status, paid_at: status.paid_at });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/donate/callback", async (req, res) => {
    try {
      const { invoice_id, status } = req.body;
      if (status === "paid" && invoice_id) {
        await storage.updateDonationStatus(invoice_id, "paid");
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/donate/recent", async (_req, res) => {
    try {
      res.json(await storage.getRecentDonations());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  return httpServer2;
}

// api/_source.ts
var PgSession = connectPgSimple(session);
var app = express();
var httpServer = createServer(app);
var DB_URL2 = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
var sessionPool = new Pool2({
  connectionString: DB_URL2,
  ssl: { rejectUnauthorized: false }
});
app.set("trust proxy", 1);
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      tableName: "sessions",
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || "kataviral-secret-dev",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1e3,
      sameSite: "lax"
    }
  })
);
app.use(loadUser);
var initialized = false;
var initPromise = (async () => {
  try {
    const { seedDatabase: seedDatabase2 } = await Promise.resolve().then(() => (init_seed(), seed_exports));
    await seedDatabase2();
  } catch (e) {
    console.error("[init] seed error:", e);
  }
  await registerRoutes(httpServer, app);
  app.use((err, _req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });
  initialized = true;
})();
async function handler(req, res) {
  await initPromise;
  app(req, res);
}
export {
  handler as default
};
