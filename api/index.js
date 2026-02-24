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
  FLOWERS_TO_IDR_RATE: () => FLOWERS_TO_IDR_RATE,
  MIN_WITHDRAWAL_FLOWERS: () => MIN_WITHDRAWAL_FLOWERS,
  MOODS: () => MOODS,
  MOOD_COLORS: () => MOOD_COLORS,
  MOOD_LABELS: () => MOOD_LABELS,
  POPULAR_TAGS: () => POPULAR_TAGS,
  betaCodes: () => betaCodes,
  flowerTransactions: () => flowerTransactions,
  giftRoleApplications: () => giftRoleApplications,
  giftTransactions: () => giftTransactions,
  giftTypes: () => giftTypes,
  insertGiftRoleApplicationSchema: () => insertGiftRoleApplicationSchema,
  insertQuoteSchema: () => insertQuoteSchema,
  insertTagSchema: () => insertTagSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  quoteLikes: () => quoteLikes,
  quoteTags: () => quoteTags,
  quotes: () => quotes,
  registerSchema: () => registerSchema,
  settings: () => settings,
  submitQuoteSchema: () => submitQuoteSchema,
  tags: () => tags,
  topupPackages: () => topupPackages,
  topupRequests: () => topupRequests,
  users: () => users,
  waitlist: () => waitlist,
  withdrawalMethods: () => withdrawalMethods,
  withdrawalRequests: () => withdrawalRequests
});
import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, insertUserSchema, registerSchema, loginSchema, waitlist, settings, quotes, tags, quoteTags, quoteLikes, giftTypes, giftTransactions, flowerTransactions, withdrawalMethods, withdrawalRequests, topupPackages, topupRequests, giftRoleApplications, insertGiftRoleApplicationSchema, betaCodes, insertQuoteSchema, submitQuoteSchema, insertTagSchema, MOODS, MOOD_LABELS, MOOD_COLORS, POPULAR_TAGS, FLOWERS_TO_IDR_RATE, MIN_WITHDRAWAL_FLOWERS;
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
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`)
    });
    insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true, role: true, isActive: true, hasBetaAccess: true, flowersBalance: true, isGiveEnabled: true });
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
      status: text("status").notNull().default("approved"),
      likesCount: integer("likes_count").notNull().default(0),
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
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`)
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
    betaCodes = pgTable("beta_codes", {
      id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
      code: text("code").notNull().unique(),
      isUsed: boolean("is_used").notNull().default(false),
      usedBy: uuid("used_by").references(() => users.id),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
      usedAt: timestamp("used_at", { withTimezone: true })
    });
    insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, status: true, likesCount: true });
    submitQuoteSchema = insertQuoteSchema.extend({
      text: z.string().min(10, "Quote minimal 10 karakter").max(500, "Quote maksimal 500 karakter"),
      author: z.string().max(100).optional(),
      mood: z.enum(["galau", "semangat", "sindir", "healing", "kerja", "cinta"]),
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
  const tagMap = await getTagsForQuoteIds(qs.map((q) => q.id));
  let likedSet = /* @__PURE__ */ new Set();
  if (userId) {
    const liked = await db.select({ quoteId: quoteLikes.quoteId }).from(quoteLikes).where(and(eq(quoteLikes.userId, userId), inArray(quoteLikes.quoteId, qs.map((q) => q.id))));
    likedSet = new Set(liked.map((r) => r.quoteId));
  }
  return qs.map((q) => ({ ...q, tags: tagMap.get(q.id) || [], likedByMe: likedSet.has(q.id) }));
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
async function submitQuote(quote, tagNames) {
  const id = randomUUID();
  const [created] = await db.insert(quotes).values({ ...quote, id, status: "pending" }).returning();
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
async function createTopupRequest(userId, packageId) {
  const pkg = await db.select().from(topupPackages).where(eq(topupPackages.id, packageId)).limit(1);
  if (!pkg.length) throw new Error("Paket tidak ditemukan");
  const [req] = await db.insert(topupRequests).values({
    id: randomUUID(),
    userId,
    packageId,
    flowersAmount: pkg[0].flowersAmount,
    priceIdr: pkg[0].priceIdr,
    status: "pending"
  }).returning();
  return req;
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
  return db.select().from(giftRoleApplications).orderBy(desc(giftRoleApplications.createdAt));
}
async function updateGiftRoleApplication(id, status, adminNote) {
  await db.update(giftRoleApplications).set({ status, adminNote: adminNote || null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(giftRoleApplications.id, id));
  if (status === "approved") {
    const [app2] = await db.select().from(giftRoleApplications).where(eq(giftRoleApplications.id, id)).limit(1);
    if (app2) await db.update(users).set({ isGiveEnabled: true }).where(eq(users.id, app2.userId));
  }
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
var DB_URL, pool, db, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
    pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
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
      createUser,
      getUserByEmail,
      getUserById,
      getAllUsers,
      updateUser,
      verifyPassword,
      addToWaitlist,
      getWaitlist,
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
      generateBetaCode,
      getBetaCodes,
      validateBetaCodeStandalone,
      markBetaCodeUsed,
      applyForGiftRole,
      getMyGiftRoleApplication,
      getAllGiftRoleApplications,
      updateGiftRoleApplication
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
async function seedDatabase() {
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
      site_name: "KataViral",
      site_description: "Quote Indonesia yang Bikin Viral"
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
        siteName: s.site_name || "KataViral",
        siteDescription: s.site_description || "Quote Indonesia yang Bikin Viral"
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
  app2.get("/api/quotes/:id", async (req, res) => {
    try {
      const quote = await storage.getQuoteById(req.params.id, req.user?.id);
      if (!quote) return res.status(404).json({ error: "Quote tidak ditemukan" });
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
      const quote = await storage.submitQuote(quoteData, tagNames);
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
      const { isActive, hasBetaAccess, isGiveEnabled, role, flowersBalance } = req.body;
      const data = {};
      if (isActive !== void 0) data.isActive = isActive;
      if (hasBetaAccess !== void 0) data.hasBetaAccess = hasBetaAccess;
      if (isGiveEnabled !== void 0) data.isGiveEnabled = isGiveEnabled;
      if (role !== void 0) data.role = role;
      if (flowersBalance !== void 0) data.flowersBalance = parseInt(flowersBalance);
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
      const result = await storage.createTopupRequest(req.user.id, packageId);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
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
