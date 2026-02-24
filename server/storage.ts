import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and, ilike, or, inArray, sql, ne } from "drizzle-orm";
import {
  quotes, tags, quoteTags, quoteLikes,
  users, waitlist, settings, giftTypes, giftTransactions,
  flowerTransactions, withdrawalMethods, withdrawalRequests,
  topupPackages, topupRequests, betaCodes,
  type Quote, type Tag, type QuoteWithTags, type InsertQuote,
  type User, type PublicUser, type Setting, type GiftType,
  type WithdrawalMethod, type WithdrawalRequest, type Waitlist,
  type GiftTransaction, type FlowerTransaction,
  type TopupPackage, type TopupRequest, type BetaCode,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const DB_URL = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString: DB_URL, ssl: false });
export const db = drizzle(pool);

// ─── HELPERS ──────────────────────────────────────────────

async function getTagsForQuoteIds(quoteIds: string[]): Promise<Map<string, Tag[]>> {
  if (quoteIds.length === 0) return new Map();
  const rows = await db.select({ quoteId: quoteTags.quoteId, tag: tags })
    .from(quoteTags).innerJoin(tags, eq(quoteTags.tagId, tags.id))
    .where(inArray(quoteTags.quoteId, quoteIds));
  const map = new Map<string, Tag[]>();
  for (const row of rows) {
    if (!map.has(row.quoteId)) map.set(row.quoteId, []);
    map.get(row.quoteId)!.push(row.tag);
  }
  return map;
}

async function attachTags(qs: Quote[], userId?: string): Promise<QuoteWithTags[]> {
  const tagMap = await getTagsForQuoteIds(qs.map((q) => q.id));
  let likedSet = new Set<string>();
  if (userId) {
    const liked = await db.select({ quoteId: quoteLikes.quoteId }).from(quoteLikes)
      .where(and(eq(quoteLikes.userId, userId), inArray(quoteLikes.quoteId, qs.map((q) => q.id))));
    likedSet = new Set(liked.map((r) => r.quoteId));
  }
  return qs.map((q) => ({ ...q, tags: tagMap.get(q.id) || [], likedByMe: likedSet.has(q.id) }));
}

async function findOrCreateTag(name: string): Promise<Tag> {
  const slug = name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  const existing = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(tags).values({ id: randomUUID(), name, slug }).returning();
  return created;
}

export async function getSetting(key: string, defaultVal = ""): Promise<string> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows.length > 0 ? rows[0].value : defaultVal;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.insert(settings).values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

// ─── QUOTES ──────────────────────────────────────────────

export async function getQuotes(opts: { mood?: string; tagSlug?: string; page?: number; limit?: number; userId?: string }) {
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

  const [countRow] = await db.select({ total: sql<number>`count(*)` }).from(quotes).where(and(...conditions));
  const rows = await db.select().from(quotes).where(and(...conditions)).orderBy(desc(quotes.createdAt)).limit(limit).offset(offset);
  return { quotes: await attachTags(rows, userId), total: Number(countRow.total) };
}

export async function getQuoteById(id: string, userId?: string): Promise<QuoteWithTags | undefined> {
  const rows = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  if (rows.length === 0) return undefined;
  const [withTags] = await attachTags(rows, userId);
  return withTags;
}

export async function searchQuotes(q: string, userId?: string): Promise<QuoteWithTags[]> {
  const rows = await db.select().from(quotes)
    .where(and(eq(quotes.status, "approved"), or(ilike(quotes.text, `%${q}%`), ilike(quotes.author, `%${q}%`))))
    .orderBy(desc(quotes.createdAt)).limit(20);
  return attachTags(rows, userId);
}

export async function submitQuote(quote: InsertQuote, tagNames: string[]): Promise<Quote> {
  const id = randomUUID();
  const [created] = await db.insert(quotes).values({ ...quote, id, status: "pending" }).returning();
  for (const name of tagNames) {
    if (!name.trim()) continue;
    const tag = await findOrCreateTag(name.trim());
    await db.insert(quoteTags).values({ quoteId: id, tagId: tag.id }).onConflictDoNothing();
  }
  return created;
}

export async function getPendingQuotes(): Promise<QuoteWithTags[]> {
  const rows = await db.select().from(quotes).where(eq(quotes.status, "pending")).orderBy(desc(quotes.createdAt));
  return attachTags(rows);
}

export async function updateQuoteStatus(id: string, status: "approved" | "rejected"): Promise<void> {
  await db.update(quotes).set({ status }).where(eq(quotes.id, id));
}

export async function getTags(): Promise<Tag[]> {
  return db.select().from(tags).orderBy(tags.name);
}

export async function getRelatedQuotes(mood: string, excludeId: string, userId?: string): Promise<QuoteWithTags[]> {
  const rows = await db.select().from(quotes)
    .where(and(eq(quotes.status, "approved"), eq(quotes.mood, mood), ne(quotes.id, excludeId)))
    .orderBy(sql`random()`).limit(4);
  return attachTags(rows, userId);
}

// ─── LIKES ───────────────────────────────────────────────

export async function toggleLike(userId: string, quoteId: string): Promise<{ liked: boolean; count: number }> {
  const existing = await db.select().from(quoteLikes)
    .where(and(eq(quoteLikes.userId, userId), eq(quoteLikes.quoteId, quoteId))).limit(1);

  if (existing.length > 0) {
    await db.delete(quoteLikes).where(eq(quoteLikes.id, existing[0].id));
    const [updated] = await db.update(quotes).set({ likesCount: sql`likes_count - 1` }).where(eq(quotes.id, quoteId)).returning();
    return { liked: false, count: updated.likesCount };
  } else {
    await db.insert(quoteLikes).values({ id: randomUUID(), userId, quoteId });
    const [updated] = await db.update(quotes).set({ likesCount: sql`likes_count + 1` }).where(eq(quotes.id, quoteId)).returning();
    return { liked: true, count: updated.likesCount };
  }
}

// ─── USERS / AUTH ─────────────────────────────────────────

export async function createUser(data: { email: string; username: string; password: string; betaCode?: string }): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(data.password, 10);
  const [user] = await db.insert(users).values({
    id: randomUUID(), email: data.email, username: data.username, passwordHash, role: "user",
  }).returning();
  const { passwordHash: _, ...pub } = user;
  return pub;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0];
}

export async function getUserById(id: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

export async function getAllUsers(limit = 50, offset = 0): Promise<PublicUser[]> {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  return rows.map(({ passwordHash: _, ...u }) => u);
}

export async function updateUser(id: string, data: Partial<Pick<User, "isActive" | "hasBetaAccess" | "isGiveEnabled" | "role" | "flowersBalance">>): Promise<void> {
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

// ─── WAITLIST ────────────────────────────────────────────

export async function addToWaitlist(email: string, name?: string): Promise<Waitlist> {
  const existing = await db.select().from(waitlist).where(eq(waitlist.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(waitlist).values({ id: randomUUID(), email: email.toLowerCase(), name, status: "pending" }).returning();
  return created;
}

export async function getWaitlist(): Promise<Waitlist[]> {
  return db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
}

export async function updateWaitlistStatus(id: string, status: "approved" | "rejected", betaCode?: string): Promise<void> {
  await db.update(waitlist).set({ status, betaCode: betaCode || null }).where(eq(waitlist.id, id));
}

export async function validateBetaCode(code: string): Promise<boolean> {
  const rows = await db.select().from(waitlist).where(and(eq(waitlist.betaCode, code), eq(waitlist.status, "approved"))).limit(1);
  return rows.length > 0;
}

// ─── SETTINGS ────────────────────────────────────────────

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ─── GIFTS ───────────────────────────────────────────────

export async function getGiftTypes(): Promise<GiftType[]> {
  return db.select().from(giftTypes).where(eq(giftTypes.isActive, true));
}

export async function getAllGiftTypes(): Promise<GiftType[]> {
  return db.select().from(giftTypes).orderBy(giftTypes.name);
}

export async function createGiftType(data: { name: string; icon: string; costFlowers: number }): Promise<GiftType> {
  const [gt] = await db.insert(giftTypes).values({ id: randomUUID(), ...data }).returning();
  return gt;
}

export async function updateGiftType(id: string, data: Partial<GiftType>): Promise<void> {
  await db.update(giftTypes).set(data).where(eq(giftTypes.id, id));
}

export async function sendGift(senderId: string, receiverId: string, giftTypeId: string, quoteId?: string, message?: string): Promise<void> {
  const gt = await db.select().from(giftTypes).where(eq(giftTypes.id, giftTypeId)).limit(1);
  if (!gt.length) throw new Error("Jenis hadiah tidak ditemukan");
  const cost = gt[0].costFlowers;

  const sender = await getUserById(senderId);
  if (!sender) throw new Error("User tidak ditemukan");
  if (!sender.isGiveEnabled) throw new Error("Fitur Give belum aktif untuk akun Anda");
  if (sender.flowersBalance < cost) throw new Error("Saldo bunga tidak cukup");

  await db.update(users).set({ flowersBalance: sql`flowers_balance - ${cost}` }).where(eq(users.id, senderId));
  await db.update(users).set({ flowersBalance: sql`flowers_balance + ${cost}` }).where(eq(users.id, receiverId));

  await db.insert(giftTransactions).values({
    id: randomUUID(), senderId, receiverId, giftTypeId, quoteId: quoteId || null, message: message || null, flowersAmount: cost,
  });
  await db.insert(flowerTransactions).values({ id: randomUUID(), userId: senderId, type: "debit", amount: cost, description: `Mengirim hadiah ke @${receiverId}` });
  await db.insert(flowerTransactions).values({ id: randomUUID(), userId: receiverId, type: "credit", amount: cost, description: `Menerima hadiah` });
}

export async function getFlowerHistory(userId: string): Promise<FlowerTransaction[]> {
  return db.select().from(flowerTransactions).where(eq(flowerTransactions.userId, userId)).orderBy(desc(flowerTransactions.createdAt)).limit(50);
}

// ─── WITHDRAWAL ──────────────────────────────────────────

export async function getWithdrawalMethods(): Promise<WithdrawalMethod[]> {
  return db.select().from(withdrawalMethods).where(eq(withdrawalMethods.isActive, true)).orderBy(withdrawalMethods.type, withdrawalMethods.name);
}

export async function getAllWithdrawalMethods(): Promise<WithdrawalMethod[]> {
  return db.select().from(withdrawalMethods).orderBy(withdrawalMethods.type, withdrawalMethods.name);
}

export async function createWithdrawalMethod(data: { name: string; type: string; code: string }): Promise<WithdrawalMethod> {
  const [wm] = await db.insert(withdrawalMethods).values({ id: randomUUID(), ...data }).returning();
  return wm;
}

export async function updateWithdrawalMethod(id: string, data: Partial<WithdrawalMethod>): Promise<void> {
  await db.update(withdrawalMethods).set(data).where(eq(withdrawalMethods.id, id));
}

export async function requestWithdrawal(userId: string, methodId: string, accountNumber: string, accountName: string, flowersAmount: number): Promise<WithdrawalRequest> {
  const { MIN_WITHDRAWAL_FLOWERS, FLOWERS_TO_IDR_RATE } = await import("@shared/schema");
  if (flowersAmount < MIN_WITHDRAWAL_FLOWERS) throw new Error(`Minimum penarikan ${MIN_WITHDRAWAL_FLOWERS} bunga`);

  const user = await getUserById(userId);
  if (!user || user.flowersBalance < flowersAmount) throw new Error("Saldo tidak cukup");

  const idrAmount = flowersAmount * FLOWERS_TO_IDR_RATE;
  await db.update(users).set({ flowersBalance: sql`flowers_balance - ${flowersAmount}` }).where(eq(users.id, userId));

  const [req] = await db.insert(withdrawalRequests).values({
    id: randomUUID(), userId, methodId, accountNumber, accountName, flowersAmount, idrAmount, status: "pending",
  }).returning();

  await db.insert(flowerTransactions).values({
    id: randomUUID(), userId, type: "debit", amount: flowersAmount, description: `Penarikan ${flowersAmount} bunga = Rp ${idrAmount.toLocaleString("id-ID")}`,
  });
  return req;
}

export async function getWithdrawalRequests(userId?: string): Promise<WithdrawalRequest[]> {
  if (userId) return db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId)).orderBy(desc(withdrawalRequests.createdAt));
  return db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.createdAt));
}

export async function updateWithdrawalStatus(id: string, status: string, adminNote?: string): Promise<void> {
  const updates: any = { status, updatedAt: new Date() };
  if (adminNote !== undefined) updates.adminNote = adminNote;
  await db.update(withdrawalRequests).set(updates).where(eq(withdrawalRequests.id, id));
  
  // If rejected, refund flowers
  if (status === "rejected") {
    const [req] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1);
    if (req) {
      await db.update(users).set({ flowersBalance: sql`flowers_balance + ${req.flowersAmount}` }).where(eq(users.id, req.userId));
      await db.insert(flowerTransactions).values({ id: randomUUID(), userId: req.userId, type: "credit", amount: req.flowersAmount, description: "Pengembalian penarikan ditolak" });
    }
  }
}

// ─── TOPUP ───────────────────────────────────────────────

export async function getTopupPackages(): Promise<TopupPackage[]> {
  return db.select().from(topupPackages).where(eq(topupPackages.isActive, true)).orderBy(topupPackages.sortOrder);
}

export async function getAllTopupPackages(): Promise<TopupPackage[]> {
  return db.select().from(topupPackages).orderBy(topupPackages.sortOrder);
}

export async function createTopupPackage(data: Omit<TopupPackage, "id">): Promise<TopupPackage> {
  const [pkg] = await db.insert(topupPackages).values({ id: randomUUID(), ...data }).returning();
  return pkg;
}

export async function updateTopupPackage(id: string, data: Partial<TopupPackage>): Promise<void> {
  await db.update(topupPackages).set(data).where(eq(topupPackages.id, id));
}

export async function createTopupRequest(userId: string, packageId: string): Promise<TopupRequest> {
  const pkg = await db.select().from(topupPackages).where(eq(topupPackages.id, packageId)).limit(1);
  if (!pkg.length) throw new Error("Paket tidak ditemukan");
  const [req] = await db.insert(topupRequests).values({
    id: randomUUID(), userId, packageId,
    flowersAmount: pkg[0].flowersAmount, priceIdr: pkg[0].priceIdr, status: "pending",
  }).returning();
  return req;
}

export async function getTopupRequests(userId?: string): Promise<TopupRequest[]> {
  if (userId) return db.select().from(topupRequests).where(eq(topupRequests.userId, userId)).orderBy(desc(topupRequests.createdAt));
  return db.select().from(topupRequests).orderBy(desc(topupRequests.createdAt));
}

export async function updateTopupStatus(id: string, status: string, adminNote?: string): Promise<void> {
  const updates: any = { status, updatedAt: new Date() };
  if (adminNote !== undefined) updates.adminNote = adminNote;
  await db.update(topupRequests).set(updates).where(eq(topupRequests.id, id));

  if (status === "confirmed") {
    const [req] = await db.select().from(topupRequests).where(eq(topupRequests.id, id)).limit(1);
    if (req) {
      await db.update(users).set({ flowersBalance: sql`flowers_balance + ${req.flowersAmount}` }).where(eq(users.id, req.userId));
      await db.insert(flowerTransactions).values({
        id: randomUUID(), userId: req.userId, type: "credit", amount: req.flowersAmount,
        description: `Top up ${req.flowersAmount} bunga`,
      });
    }
  }
}

// ─── BETA CODES ──────────────────────────────────────────

export async function generateBetaCode(): Promise<BetaCode> {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const [bc] = await db.insert(betaCodes).values({ id: randomUUID(), code }).returning();
  return bc;
}

export async function getBetaCodes(): Promise<BetaCode[]> {
  return db.select().from(betaCodes).orderBy(desc(betaCodes.createdAt)).limit(50);
}

export async function validateBetaCodeStandalone(code: string): Promise<boolean> {
  // Check waitlist codes
  const wl = await db.select().from(waitlist).where(and(eq(waitlist.betaCode, code), eq(waitlist.status, "approved"))).limit(1);
  if (wl.length > 0) return true;
  // Check standalone beta codes
  const bc = await db.select().from(betaCodes).where(and(eq(betaCodes.code, code), eq(betaCodes.isUsed, false))).limit(1);
  return bc.length > 0;
}

export async function markBetaCodeUsed(code: string, userId: string): Promise<void> {
  await db.update(betaCodes).set({ isUsed: true, usedBy: userId, usedAt: new Date() }).where(eq(betaCodes.code, code));
}

export const storage = {
  getQuotes, getQuoteById, searchQuotes, submitQuote, getPendingQuotes, updateQuoteStatus,
  getTags, getRelatedQuotes, toggleLike,
  createUser, getUserByEmail, getUserById, getAllUsers, updateUser, verifyPassword,
  addToWaitlist, getWaitlist, updateWaitlistStatus, validateBetaCode,
  getAllSettings, getSetting, setSetting,
  getGiftTypes, getAllGiftTypes, createGiftType, updateGiftType, sendGift, getFlowerHistory,
  getWithdrawalMethods, getAllWithdrawalMethods, createWithdrawalMethod, updateWithdrawalMethod,
  requestWithdrawal, getWithdrawalRequests, updateWithdrawalStatus,
  getTopupPackages, getAllTopupPackages, createTopupPackage, updateTopupPackage,
  createTopupRequest, getTopupRequests, updateTopupStatus,
  generateBetaCode, getBetaCodes, validateBetaCodeStandalone, markBetaCodeUsed,
};

export type { User, PublicUser, Tag, Quote, QuoteWithTags, GiftType, WithdrawalMethod, WithdrawalRequest, Waitlist, FlowerTransaction, TopupPackage, TopupRequest, BetaCode };
