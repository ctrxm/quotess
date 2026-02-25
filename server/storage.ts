import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and, ilike, or, inArray, sql, ne, asc, count } from "drizzle-orm";
import {
  quotes, tags, quoteTags, quoteLikes,
  users, waitlist, settings, giftTypes, giftTransactions,
  flowerTransactions, withdrawalMethods, withdrawalRequests,
  topupPackages, topupRequests, betaCodes, giftRoleApplications, ads,
  quoteComments, quoteBookmarks, authorFollows,
  collections, collectionQuotes, quoteBattles, battleVotes,
  userBadges, userStreaks, referralCodes, referralUses,
  verificationRequests, donations, quoteReactions, notifications,
  redeemCodes, redeemUses,
  REFERRAL_BONUS_FLOWERS,
  type Quote, type Tag, type QuoteWithTags, type InsertQuote,
  type User, type PublicUser, type Setting, type GiftType,
  type WithdrawalMethod, type WithdrawalRequest, type Waitlist,
  type GiftTransaction, type FlowerTransaction,
  type TopupPackage, type TopupRequest, type BetaCode, type GiftRoleApplication, type Ad,
  type QuoteCommentWithUser, type CollectionWithMeta, type QuoteBattleWithQuotes, type UserBadge, type UserStreak,
  type Donation, type QuoteReaction, type Notification, type RedeemCode, type RedeemUse,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL!;
const isSupabase = DB_URL.includes("supabase");
const pool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
  ...(isSupabase ? { options: "-c search_path=public" } : {}),
});
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
  if (qs.length === 0) return [];
  const quoteIds = qs.map((q) => q.id);
  const tagMap = await getTagsForQuoteIds(quoteIds);
  let likedSet = new Set<string>();
  let bookmarkSet = new Set<string>();
  if (userId) {
    const [liked, bookmarked] = await Promise.all([
      db.select({ quoteId: quoteLikes.quoteId }).from(quoteLikes)
        .where(and(eq(quoteLikes.userId, userId), inArray(quoteLikes.quoteId, quoteIds))),
      db.select({ quoteId: quoteBookmarks.quoteId }).from(quoteBookmarks)
        .where(and(eq(quoteBookmarks.userId, userId), inArray(quoteBookmarks.quoteId, quoteIds))),
    ]);
    likedSet = new Set(liked.map((r) => r.quoteId));
    bookmarkSet = new Set(bookmarked.map((r) => r.quoteId));
  }
  const [commentCounts, reactionRows] = await Promise.all([
    db.select({ quoteId: quoteComments.quoteId, cnt: sql<number>`count(*)` })
      .from(quoteComments).where(inArray(quoteComments.quoteId, quoteIds)).groupBy(quoteComments.quoteId),
    db.select({ quoteId: quoteReactions.quoteId, reactionType: quoteReactions.reactionType, cnt: sql<number>`count(*)` })
      .from(quoteReactions).where(inArray(quoteReactions.quoteId, quoteIds)).groupBy(quoteReactions.quoteId, quoteReactions.reactionType),
  ]);
  const commentMap = new Map(commentCounts.map((r) => [r.quoteId, Number(r.cnt)]));

  const reactionsMap = new Map<string, Record<string, number>>();
  for (const r of reactionRows) {
    if (!reactionsMap.has(r.quoteId)) reactionsMap.set(r.quoteId, {});
    reactionsMap.get(r.quoteId)![r.reactionType] = Number(r.cnt);
  }

  let myReactionMap = new Map<string, string>();
  if (userId) {
    const myReactions = await db.select({ quoteId: quoteReactions.quoteId, reactionType: quoteReactions.reactionType })
      .from(quoteReactions).where(and(eq(quoteReactions.userId, userId), inArray(quoteReactions.quoteId, quoteIds)));
    for (const r of myReactions) myReactionMap.set(r.quoteId, r.reactionType);
  }

  const authorUserIds = qs.map((q) => q.userId).filter(Boolean) as string[];
  const authorMap = new Map<string, { id: string; username: string; isVerified: boolean }>();
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
    reactions: reactionsMap.get(q.id) || {},
    myReaction: myReactionMap.get(q.id) || null,
    authorUser: q.userId ? authorMap.get(q.userId) || null : null,
  }));
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

export async function submitQuote(quote: InsertQuote, tagNames: string[], userId?: string): Promise<Quote> {
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

// ─── VIEW COUNT ─────────────────────────────────────────

export async function incrementViewCount(id: string): Promise<void> {
  await db.update(quotes).set({ viewCount: sql`COALESCE(view_count, 0) + 1` }).where(eq(quotes.id, id));
}

// ─── QUOTE OF THE DAY ───────────────────────────────────

export async function getQuoteOfTheDay(userId?: string): Promise<QuoteWithTags | undefined> {
  const today = new Date().toISOString().slice(0, 10);
  const seed = Array.from(today).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const [countRow] = await db.select({ total: sql<number>`count(*)` }).from(quotes).where(eq(quotes.status, "approved"));
  const total = Number(countRow.total);
  if (total === 0) return undefined;
  const offset = seed % total;
  const rows = await db.select().from(quotes).where(eq(quotes.status, "approved")).orderBy(quotes.id).limit(1).offset(offset);
  if (rows.length === 0) return undefined;
  const [withTags] = await attachTags(rows, userId);
  return withTags;
}

// ─── TRENDING QUOTES ────────────────────────────────────

export async function getTrendingQuotes(limit = 20, userId?: string): Promise<QuoteWithTags[]> {
  const rows = await db.select().from(quotes)
    .where(eq(quotes.status, "approved"))
    .orderBy(desc(sql`COALESCE(view_count, 0) + (likes_count * 5)`))
    .limit(limit);
  return attachTags(rows, userId);
}

// ─── AUTHOR QUOTES ──────────────────────────────────────

export async function getQuotesByAuthor(author: string, userId?: string): Promise<QuoteWithTags[]> {
  const rows = await db.select().from(quotes)
    .where(and(eq(quotes.status, "approved"), eq(quotes.author, author)))
    .orderBy(desc(quotes.createdAt));
  return attachTags(rows, userId);
}

export async function getQuotesByUsername(username: string, currentUserId?: string): Promise<QuoteWithTags[]> {
  const [targetUser] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (!targetUser) return [];
  const rows = await db.select().from(quotes)
    .where(and(eq(quotes.status, "approved"), eq(quotes.userId, targetUser.id)))
    .orderBy(desc(quotes.createdAt));
  return attachTags(rows, currentUserId);
}

export async function getUserStatsByUsername(username: string): Promise<{ totalQuotes: number; totalLikes: number; totalViews: number; isVerified: boolean } | null> {
  const [targetUser] = await db.select({ id: users.id, isVerified: users.isVerified }).from(users).where(eq(users.username, username)).limit(1);
  if (!targetUser) return null;
  const [stats] = await db.select({
    totalQuotes: sql<number>`count(*)`,
    totalLikes: sql<number>`COALESCE(sum(likes_count), 0)`,
    totalViews: sql<number>`COALESCE(sum(COALESCE(view_count, 0)), 0)`,
  }).from(quotes).where(and(eq(quotes.status, "approved"), eq(quotes.userId, targetUser.id)));
  return { totalQuotes: Number(stats.totalQuotes), totalLikes: Number(stats.totalLikes), totalViews: Number(stats.totalViews), isVerified: targetUser.isVerified };
}

export async function getAuthorStats(author: string): Promise<{ totalQuotes: number; totalLikes: number; totalViews: number }> {
  const [stats] = await db.select({
    totalQuotes: sql<number>`count(*)`,
    totalLikes: sql<number>`COALESCE(sum(likes_count), 0)`,
    totalViews: sql<number>`COALESCE(sum(COALESCE(view_count, 0)), 0)`,
  }).from(quotes).where(and(eq(quotes.status, "approved"), eq(quotes.author, author)));
  return { totalQuotes: Number(stats.totalQuotes), totalLikes: Number(stats.totalLikes), totalViews: Number(stats.totalViews) };
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

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
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

export async function searchUsers(query: string, excludeUserId?: string): Promise<Pick<PublicUser, "id" | "username">[]> {
  const rows = await db.select({ id: users.id, username: users.username })
    .from(users)
    .where(sql`lower(username) LIKE ${`%${query.toLowerCase()}%`}`)
    .limit(10);
  return excludeUserId ? rows.filter(u => u.id !== excludeUserId) : rows;
}

export async function updateUser(id: string, data: Partial<Pick<User, "isActive" | "hasBetaAccess" | "isGiveEnabled" | "role" | "flowersBalance" | "isVerified">>): Promise<void> {
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

export async function getWaitlistById(id: string): Promise<Waitlist | null> {
  const rows = await db.select().from(waitlist).where(eq(waitlist.id, id)).limit(1);
  return rows[0] || null;
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

export async function createTopupRequest(userId: string, packageId: string, invoice?: { invoiceId: string; paymentUrl: string; finalAmount: number; expiresAt: string }): Promise<TopupRequest> {
  const pkg = await db.select().from(topupPackages).where(eq(topupPackages.id, packageId)).limit(1);
  if (!pkg.length) throw new Error("Paket tidak ditemukan");
  const values: any = {
    id: randomUUID(), userId, packageId,
    flowersAmount: pkg[0].flowersAmount, priceIdr: pkg[0].priceIdr, status: "pending",
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

export async function getTopupRequestByInvoice(invoiceId: string): Promise<TopupRequest | null> {
  const rows = await db.select().from(topupRequests).where(eq(topupRequests.invoiceId, invoiceId)).limit(1);
  return rows[0] || null;
}

export async function updateTopupInvoiceStatus(invoiceId: string, status: string): Promise<void> {
  await db.update(topupRequests).set({ status, updatedAt: new Date() }).where(eq(topupRequests.invoiceId, invoiceId));
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

// ─── GIFT ROLE APPLICATIONS ──────────────────────────────

export async function applyForGiftRole(userId: string, type: string, reason: string, socialLink?: string): Promise<GiftRoleApplication> {
  const existing = await db.select().from(giftRoleApplications)
    .where(and(eq(giftRoleApplications.userId, userId), eq(giftRoleApplications.status, "pending"))).limit(1);
  if (existing.length > 0) throw new Error("Kamu sudah punya pengajuan yang sedang menunggu review");
  const [app] = await db.insert(giftRoleApplications).values({
    userId, type, reason, socialLink: socialLink || null,
  }).returning();
  return app;
}

export async function getMyGiftRoleApplication(userId: string): Promise<GiftRoleApplication | null> {
  const rows = await db.select().from(giftRoleApplications)
    .where(eq(giftRoleApplications.userId, userId))
    .orderBy(desc(giftRoleApplications.createdAt)).limit(1);
  return rows[0] || null;
}

export async function getAllGiftRoleApplications(): Promise<(GiftRoleApplication & { username: string; email: string })[]> {
  const rows = await db
    .select({
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
      email: users.email,
    })
    .from(giftRoleApplications)
    .leftJoin(users, eq(giftRoleApplications.userId, users.id))
    .orderBy(desc(giftRoleApplications.createdAt));
  return rows as any;
}

export async function updateGiftRoleApplication(id: string, status: "approved" | "rejected", adminNote?: string): Promise<void> {
  await db.update(giftRoleApplications).set({ status, adminNote: adminNote || null, updatedAt: new Date() }).where(eq(giftRoleApplications.id, id));
  if (status === "approved") {
    const [app] = await db.select().from(giftRoleApplications).where(eq(giftRoleApplications.id, id)).limit(1);
    if (app) await db.update(users).set({ isGiveEnabled: true }).where(eq(users.id, app.userId));
  }
}

// ─── ADS ──────────────────────────────────────────────────

export async function getActiveAds(): Promise<Ad[]> {
  return db.select().from(ads).where(eq(ads.isActive, true)).orderBy(ads.sortOrder, desc(ads.createdAt));
}

export async function getAllAds(): Promise<Ad[]> {
  return db.select().from(ads).orderBy(ads.sortOrder, desc(ads.createdAt));
}

export async function createAd(data: Partial<Ad>): Promise<Ad> {
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
    sortOrder: data.sortOrder ?? 0,
  }).returning();
  return ad;
}

export async function updateAd(id: string, data: Partial<Ad>): Promise<void> {
  await db.update(ads).set({
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    ...(data.position !== undefined && { position: data.position }),
    ...(data.bgColor !== undefined && { bgColor: data.bgColor }),
    ...(data.textColor !== undefined && { textColor: data.textColor }),
    ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    ...(data.type !== undefined && { type: data.type }),
  }).where(eq(ads.id, id));
}

export async function deleteAd(id: string): Promise<void> {
  await db.delete(ads).where(eq(ads.id, id));
}

export async function incrementAdClicks(id: string): Promise<void> {
  await db.update(ads).set({ clickCount: sql`${ads.clickCount} + 1` }).where(eq(ads.id, id));
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

// ─── COMMENTS ───────────────────────────────────────────

export async function getComments(quoteId: string): Promise<QuoteCommentWithUser[]> {
  const rows = await db.select({
    id: quoteComments.id, userId: quoteComments.userId, quoteId: quoteComments.quoteId,
    text: quoteComments.text, createdAt: quoteComments.createdAt, username: users.username,
  }).from(quoteComments)
    .innerJoin(users, eq(quoteComments.userId, users.id))
    .where(eq(quoteComments.quoteId, quoteId))
    .orderBy(desc(quoteComments.createdAt));
  return rows;
}

export async function addComment(userId: string, quoteId: string, text: string): Promise<QuoteCommentWithUser> {
  const [comment] = await db.insert(quoteComments).values({ id: randomUUID(), userId, quoteId, text }).returning();
  const user = await getUserById(userId);
  await checkAndAwardBadge(userId, "first_comment", async () => {
    const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)` }).from(quoteComments).where(eq(quoteComments.userId, userId));
    return Number(cnt) >= 1;
  });
  return { ...comment, username: user?.username || "unknown" };
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  await db.delete(quoteComments).where(and(eq(quoteComments.id, commentId), eq(quoteComments.userId, userId)));
}

// ─── BOOKMARKS ──────────────────────────────────────────

export async function toggleBookmark(userId: string, quoteId: string): Promise<{ bookmarked: boolean }> {
  const existing = await db.select().from(quoteBookmarks)
    .where(and(eq(quoteBookmarks.userId, userId), eq(quoteBookmarks.quoteId, quoteId))).limit(1);
  if (existing.length > 0) {
    await db.delete(quoteBookmarks).where(eq(quoteBookmarks.id, existing[0].id));
    return { bookmarked: false };
  }
  await db.insert(quoteBookmarks).values({ id: randomUUID(), userId, quoteId });
  await checkAndAwardBadge(userId, "collector", async () => {
    const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)` }).from(quoteBookmarks).where(eq(quoteBookmarks.userId, userId));
    return Number(cnt) >= 20;
  });
  return { bookmarked: true };
}

export async function getBookmarkedQuotes(userId: string): Promise<QuoteWithTags[]> {
  const bms = await db.select({ quoteId: quoteBookmarks.quoteId }).from(quoteBookmarks)
    .where(eq(quoteBookmarks.userId, userId)).orderBy(desc(quoteBookmarks.createdAt));
  if (bms.length === 0) return [];
  const ids = bms.map((b) => b.quoteId);
  const rows = await db.select().from(quotes).where(inArray(quotes.id, ids));
  const ordered = ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as Quote[];
  return attachTags(ordered, userId);
}

// ─── AUTHOR FOLLOWS ─────────────────────────────────────

export async function toggleFollow(userId: string, authorName: string): Promise<{ following: boolean; followersCount: number }> {
  const existing = await db.select().from(authorFollows)
    .where(and(eq(authorFollows.userId, userId), eq(authorFollows.authorName, authorName))).limit(1);
  if (existing.length > 0) {
    await db.delete(authorFollows).where(eq(authorFollows.id, existing[0].id));
  } else {
    await db.insert(authorFollows).values({ id: randomUUID(), userId, authorName });
  }
  const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)` }).from(authorFollows).where(eq(authorFollows.authorName, authorName));
  return { following: existing.length === 0, followersCount: Number(cnt) };
}

export async function isFollowing(userId: string, authorName: string): Promise<boolean> {
  const rows = await db.select().from(authorFollows)
    .where(and(eq(authorFollows.userId, userId), eq(authorFollows.authorName, authorName))).limit(1);
  return rows.length > 0;
}

export async function getFollowersCount(authorName: string): Promise<number> {
  const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)` }).from(authorFollows).where(eq(authorFollows.authorName, authorName));
  return Number(cnt);
}

// ─── COLLECTIONS ────────────────────────────────────────

export async function getCollections(): Promise<CollectionWithMeta[]> {
  const cols = await db.select().from(collections).where(eq(collections.isPublic, true)).orderBy(desc(collections.createdAt));
  const colIds = cols.map((c) => c.id);
  const counts = colIds.length > 0 ? await db.select({ collectionId: collectionQuotes.collectionId, cnt: sql<number>`count(*)` })
    .from(collectionQuotes).where(inArray(collectionQuotes.collectionId, colIds)).groupBy(collectionQuotes.collectionId) : [];
  const countMap = new Map(counts.map((r) => [r.collectionId, Number(r.cnt)]));
  const curatorIds = cols.map((c) => c.curatorId).filter(Boolean) as string[];
  const curatorMap = new Map<string, string>();
  if (curatorIds.length > 0) {
    const curators = await db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.id, curatorIds));
    for (const c of curators) curatorMap.set(c.id, c.username);
  }
  return cols.map((c) => ({ ...c, quoteCount: countMap.get(c.id) || 0, curatorUsername: c.curatorId ? curatorMap.get(c.curatorId) : undefined }));
}

export async function getCollectionById(id: string, userId?: string): Promise<{ collection: CollectionWithMeta; quotes: QuoteWithTags[] } | undefined> {
  const [col] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  if (!col) return undefined;
  const cqs = await db.select({ quoteId: collectionQuotes.quoteId }).from(collectionQuotes)
    .where(eq(collectionQuotes.collectionId, id)).orderBy(collectionQuotes.sortOrder);
  const qIds = cqs.map((r) => r.quoteId);
  let qs: QuoteWithTags[] = [];
  if (qIds.length > 0) {
    const rows = await db.select().from(quotes).where(inArray(quotes.id, qIds));
    const ordered = qIds.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as Quote[];
    qs = await attachTags(ordered, userId);
  }
  const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)` }).from(collectionQuotes).where(eq(collectionQuotes.collectionId, id));
  let curatorUsername: string | undefined;
  if (col.curatorId) {
    const [u] = await db.select({ username: users.username }).from(users).where(eq(users.id, col.curatorId)).limit(1);
    curatorUsername = u?.username;
  }
  return { collection: { ...col, quoteCount: Number(cnt), curatorUsername }, quotes: qs };
}

export async function createCollection(data: { name: string; description?: string; coverColor?: string; curatorId: string; isPremium?: boolean; priceFlowers?: number }): Promise<Collection> {
  const [col] = await db.insert(collections).values({
    id: randomUUID(), name: data.name, description: data.description || null,
    coverColor: data.coverColor || "#FFF3B0", curatorId: data.curatorId,
    isPremium: data.isPremium || false, priceFlowers: data.priceFlowers || 0,
  }).returning();
  return col;
}

export async function addQuoteToCollection(collectionId: string, quoteId: string): Promise<void> {
  const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)` }).from(collectionQuotes).where(eq(collectionQuotes.collectionId, collectionId));
  await db.insert(collectionQuotes).values({ collectionId, quoteId, sortOrder: Number(cnt) }).onConflictDoNothing();
}

export async function removeQuoteFromCollection(collectionId: string, quoteId: string): Promise<void> {
  await db.delete(collectionQuotes).where(and(eq(collectionQuotes.collectionId, collectionId), eq(collectionQuotes.quoteId, quoteId)));
}

// ─── QUOTE BATTLES ──────────────────────────────────────

export async function getActiveBattle(userId?: string): Promise<QuoteBattleWithQuotes | null> {
  const now = new Date();
  let [battle] = await db.select().from(quoteBattles)
    .where(and(eq(quoteBattles.status, "active"), sql`ends_at > ${now}`))
    .orderBy(desc(quoteBattles.createdAt)).limit(1);

  if (!battle) {
    battle = await createNewBattle();
    if (!battle) return null;
  }

  const [quoteA, quoteB] = await Promise.all([
    getQuoteById(battle.quoteAId, userId),
    getQuoteById(battle.quoteBId, userId),
  ]);
  if (!quoteA || !quoteB) return null;

  let myVote: string | null = null;
  if (userId) {
    const [vote] = await db.select().from(battleVotes)
      .where(and(eq(battleVotes.userId, userId), eq(battleVotes.battleId, battle.id))).limit(1);
    myVote = vote?.votedQuoteId || null;
  }
  return { ...battle, quoteA, quoteB, myVote };
}

async function createNewBattle(): Promise<typeof quoteBattles.$inferSelect | null> {
  const randomQuotes = await db.select().from(quotes).where(eq(quotes.status, "approved")).orderBy(sql`random()`).limit(2);
  if (randomQuotes.length < 2) return null;
  const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [battle] = await db.insert(quoteBattles).values({
    id: randomUUID(), quoteAId: randomQuotes[0].id, quoteBId: randomQuotes[1].id, endsAt,
  }).returning();
  return battle;
}

export async function voteBattle(userId: string, battleId: string, votedQuoteId: string): Promise<{ votesA: number; votesB: number }> {
  const existing = await db.select().from(battleVotes)
    .where(and(eq(battleVotes.userId, userId), eq(battleVotes.battleId, battleId))).limit(1);
  if (existing.length > 0) throw new Error("Kamu sudah vote di battle ini");

  const [battle] = await db.select().from(quoteBattles).where(eq(quoteBattles.id, battleId)).limit(1);
  if (!battle || battle.status !== "active") throw new Error("Battle tidak aktif");

  await db.insert(battleVotes).values({ id: randomUUID(), userId, battleId, votedQuoteId });
  const isA = votedQuoteId === battle.quoteAId;
  const [updated] = await db.update(quoteBattles).set(
    isA ? { votesA: sql`votes_a + 1` } : { votesB: sql`votes_b + 1` }
  ).where(eq(quoteBattles.id, battleId)).returning();

  await checkAndAwardBadge(userId, "battle_voter", async () => {
    const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)` }).from(battleVotes).where(eq(battleVotes.userId, userId));
    return Number(cnt) >= 10;
  });

  return { votesA: updated.votesA, votesB: updated.votesB };
}

// ─── BADGES ─────────────────────────────────────────────

async function checkAndAwardBadge(userId: string, badgeType: string, check: () => Promise<boolean>): Promise<void> {
  try {
    const existing = await db.select().from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeType, badgeType))).limit(1);
    if (existing.length > 0) return;
    const earned = await check();
    if (earned) {
      await db.insert(userBadges).values({ id: randomUUID(), userId, badgeType }).onConflictDoNothing();
    }
  } catch {}
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
}

export async function checkAllBadges(userId: string): Promise<void> {
  const [quoteCount] = await db.select({ cnt: sql<number>`count(*)` }).from(quotes).where(eq(quotes.userId, userId));
  const [likeCount] = await db.select({ cnt: sql<number>`count(*)` }).from(quoteLikes).where(eq(quoteLikes.userId, userId));
  const qc = Number(quoteCount.cnt);
  const lc = Number(likeCount.cnt);
  if (qc >= 1) await checkAndAwardBadge(userId, "first_quote", async () => true);
  if (qc >= 10) await checkAndAwardBadge(userId, "quote_10", async () => true);
  if (qc >= 50) await checkAndAwardBadge(userId, "quote_50", async () => true);
  if (lc >= 1) await checkAndAwardBadge(userId, "first_like", async () => true);
  if (lc >= 100) await checkAndAwardBadge(userId, "like_100", async () => true);
}

// ─── STREAKS ────────────────────────────────────────────

export async function updateStreak(userId: string): Promise<UserStreak> {
  const today = new Date().toISOString().slice(0, 10);
  const [existing] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1);

  if (!existing) {
    const [created] = await db.insert(userStreaks).values({
      id: randomUUID(), userId, currentStreak: 1, longestStreak: 1, lastVisitDate: today,
    }).returning();
    return created;
  }

  if (existing.lastVisitDate === today) return existing;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isConsecutive = existing.lastVisitDate === yesterday;
  const newStreak = isConsecutive ? existing.currentStreak + 1 : 1;
  const newLongest = Math.max(newStreak, existing.longestStreak);

  const [updated] = await db.update(userStreaks).set({
    currentStreak: newStreak, longestStreak: newLongest, lastVisitDate: today,
  }).where(eq(userStreaks.id, existing.id)).returning();

  if (newStreak >= 7) await checkAndAwardBadge(userId, "streak_7", async () => true);
  if (newStreak >= 30) await checkAndAwardBadge(userId, "streak_30", async () => true);

  return updated;
}

export async function getStreak(userId: string): Promise<UserStreak | null> {
  const [row] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1);
  return row || null;
}

// ─── REFERRALS ──────────────────────────────────────────

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const [existing] = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
  if (existing) return existing.code;
  const code = "KV-" + randomUUID().slice(0, 6).toUpperCase();
  await db.insert(referralCodes).values({ id: randomUUID(), userId, code });
  return code;
}

export async function useReferralCode(code: string, newUserId: string): Promise<boolean> {
  const [ref] = await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
  if (!ref || ref.userId === newUserId) return false;
  const alreadyUsed = await db.select().from(referralUses)
    .where(eq(referralUses.referredId, newUserId)).limit(1);
  if (alreadyUsed.length > 0) return false;

  await db.insert(referralUses).values({ id: randomUUID(), referrerId: ref.userId, referredId: newUserId, flowersAmount: REFERRAL_BONUS_FLOWERS });
  await db.update(users).set({ flowersBalance: sql`flowers_balance + ${REFERRAL_BONUS_FLOWERS}` }).where(eq(users.id, ref.userId));
  await db.update(users).set({ flowersBalance: sql`flowers_balance + ${REFERRAL_BONUS_FLOWERS}` }).where(eq(users.id, newUserId));
  await db.insert(flowerTransactions).values({ id: randomUUID(), userId: ref.userId, type: "credit", amount: REFERRAL_BONUS_FLOWERS, description: `Bonus referral` });
  await db.insert(flowerTransactions).values({ id: randomUUID(), userId: newUserId, type: "credit", amount: REFERRAL_BONUS_FLOWERS, description: `Bonus referral` });
  return true;
}

export async function getReferralStats(userId: string): Promise<{ code: string; totalReferred: number; totalFlowers: number }> {
  const code = await getOrCreateReferralCode(userId);
  const [stats] = await db.select({
    cnt: sql<number>`count(*)`, total: sql<number>`COALESCE(sum(flowers_amount), 0)`,
  }).from(referralUses).where(eq(referralUses.referrerId, userId));
  return { code, totalReferred: Number(stats.cnt), totalFlowers: Number(stats.total) };
}

// ─── LEADERBOARD ────────────────────────────────────────

export async function getAuthorLeaderboard(): Promise<{ author: string; totalQuotes: number; totalLikes: number; totalViews: number; score: number }[]> {
  const rows = await db.select({
    author: quotes.author,
    totalQuotes: sql<number>`count(*)`,
    totalLikes: sql<number>`COALESCE(sum(likes_count), 0)`,
    totalViews: sql<number>`COALESCE(sum(COALESCE(view_count, 0)), 0)`,
  }).from(quotes)
    .where(and(eq(quotes.status, "approved"), sql`author IS NOT NULL`))
    .groupBy(quotes.author)
    .orderBy(desc(sql`COALESCE(sum(likes_count), 0) + COALESCE(sum(COALESCE(view_count, 0)), 0)`))
    .limit(50);
  return rows.map((r) => ({
    author: r.author!,
    totalQuotes: Number(r.totalQuotes),
    totalLikes: Number(r.totalLikes),
    totalViews: Number(r.totalViews),
    score: Number(r.totalLikes) + Number(r.totalViews),
  }));
}

export const storage = {
  getQuotes, getQuoteById, searchQuotes, submitQuote, getPendingQuotes, updateQuoteStatus,
  getTags, getRelatedQuotes, toggleLike,
  incrementViewCount, getQuoteOfTheDay, getTrendingQuotes, getQuotesByAuthor, getQuotesByUsername, getUserStatsByUsername, getAuthorStats,
  createUser, getUserByEmail, getUserByUsername, getUserById, getAllUsers, searchUsers, updateUser, verifyPassword,
  addToWaitlist, getWaitlist, getWaitlistById, updateWaitlistStatus, validateBetaCode,
  getAllSettings, getSetting, setSetting,
  getGiftTypes, getAllGiftTypes, createGiftType, updateGiftType, sendGift, getFlowerHistory,
  getWithdrawalMethods, getAllWithdrawalMethods, createWithdrawalMethod, updateWithdrawalMethod,
  requestWithdrawal, getWithdrawalRequests, updateWithdrawalStatus,
  getTopupPackages, getAllTopupPackages, createTopupPackage, updateTopupPackage,
  createTopupRequest, getTopupRequests, updateTopupStatus, getTopupRequestByInvoice, updateTopupInvoiceStatus,
  createDonation, getDonationByInvoice, updateDonationStatus, getRecentDonations,
  generateBetaCode, getBetaCodes, validateBetaCodeStandalone, markBetaCodeUsed,
  applyForGiftRole, getMyGiftRoleApplication, getAllGiftRoleApplications, updateGiftRoleApplication,
  getActiveAds, getAllAds, createAd, updateAd, deleteAd, incrementAdClicks,
  getComments, addComment, deleteComment,
  toggleBookmark, getBookmarkedQuotes,
  toggleFollow, isFollowing, getFollowersCount,
  getCollections, getCollectionById, createCollection, addQuoteToCollection, removeQuoteFromCollection,
  getActiveBattle, voteBattle,
  getUserBadges, checkAllBadges,
  updateStreak, getStreak,
  getOrCreateReferralCode, useReferralCode, getReferralStats,
  getAuthorLeaderboard,
  submitVerificationRequest, getMyVerificationRequest, getAllVerificationRequests, updateVerificationRequest,
};

// ─── VERIFICATION REQUESTS ──────────────────────────────

export async function submitVerificationRequest(userId: string, reason: string, socialLink?: string): Promise<any> {
  const existing = await db.select().from(verificationRequests)
    .where(and(eq(verificationRequests.userId, userId), eq(verificationRequests.status, "pending")))
    .limit(1);
  if (existing.length > 0) throw new Error("Kamu sudah memiliki pengajuan yang masih pending");
  const [created] = await db.insert(verificationRequests)
    .values({ id: randomUUID(), userId, reason, socialLink: socialLink || null })
    .returning();
  return created;
}

export async function getMyVerificationRequest(userId: string) {
  const rows = await db.select().from(verificationRequests)
    .where(eq(verificationRequests.userId, userId))
    .orderBy(desc(verificationRequests.createdAt))
    .limit(1);
  return rows[0] || null;
}

export async function getAllVerificationRequests() {
  const rows = await db.select({
    id: verificationRequests.id,
    userId: verificationRequests.userId,
    reason: verificationRequests.reason,
    socialLink: verificationRequests.socialLink,
    status: verificationRequests.status,
    adminNote: verificationRequests.adminNote,
    createdAt: verificationRequests.createdAt,
    username: users.username,
    email: users.email,
  })
    .from(verificationRequests)
    .leftJoin(users, eq(verificationRequests.userId, users.id))
    .orderBy(desc(verificationRequests.createdAt));
  return rows;
}

export async function updateVerificationRequest(id: string, status: "approved" | "rejected", adminNote?: string): Promise<void> {
  await db.update(verificationRequests)
    .set({ status, adminNote: adminNote || null })
    .where(eq(verificationRequests.id, id));
  if (status === "approved") {
    const [req] = await db.select().from(verificationRequests).where(eq(verificationRequests.id, id)).limit(1);
    if (req) {
      await db.update(users).set({ isVerified: true }).where(eq(users.id, req.userId));
    }
  }
}

// ─── DONATIONS ──────────────────────────────────────────

export async function createDonation(donorName: string, amount: number, message?: string, invoice?: { invoiceId: string; paymentUrl: string; finalAmount: number }): Promise<Donation> {
  const [row] = await db.insert(donations).values({
    id: randomUUID(),
    donorName: donorName || "Anonim",
    message: message || null,
    amount,
    invoiceId: invoice?.invoiceId || null,
    paymentUrl: invoice?.paymentUrl || null,
    finalAmount: invoice?.finalAmount || null,
    status: "pending",
  }).returning();
  return row;
}

export async function getDonationByInvoice(invoiceId: string): Promise<Donation | null> {
  const rows = await db.select().from(donations).where(eq(donations.invoiceId, invoiceId)).limit(1);
  return rows[0] || null;
}

export async function updateDonationStatus(invoiceId: string, status: string): Promise<void> {
  await db.update(donations).set({ status }).where(eq(donations.invoiceId, invoiceId));
}

export async function getRecentDonations(limit: number = 20): Promise<Donation[]> {
  return db.select().from(donations).where(eq(donations.status, "paid")).orderBy(desc(donations.createdAt)).limit(limit);
}

export async function toggleReaction(userId: string, quoteId: string, reactionType: string): Promise<{ reactions: Record<string, number>; myReaction: string | null }> {
  const existing = await db.select().from(quoteReactions)
    .where(and(eq(quoteReactions.userId, userId), eq(quoteReactions.quoteId, quoteId))).limit(1);
  if (existing.length > 0 && existing[0].reactionType === reactionType) {
    await db.delete(quoteReactions).where(eq(quoteReactions.id, existing[0].id));
    const counts = await db.select({ reactionType: quoteReactions.reactionType, cnt: sql<number>`count(*)` })
      .from(quoteReactions).where(eq(quoteReactions.quoteId, quoteId)).groupBy(quoteReactions.reactionType);
    const reactions: Record<string, number> = {};
    for (const c of counts) reactions[c.reactionType] = Number(c.cnt);
    return { reactions, myReaction: null };
  }
  if (existing.length > 0) {
    await db.update(quoteReactions).set({ reactionType }).where(eq(quoteReactions.id, existing[0].id));
  } else {
    await db.insert(quoteReactions).values({ id: randomUUID(), userId, quoteId, reactionType });
  }
  const counts = await db.select({ reactionType: quoteReactions.reactionType, cnt: sql<number>`count(*)` })
    .from(quoteReactions).where(eq(quoteReactions.quoteId, quoteId)).groupBy(quoteReactions.reactionType);
  const reactions: Record<string, number> = {};
  for (const c of counts) reactions[c.reactionType] = Number(c.cnt);
  return { reactions, myReaction: reactionType };
}

export async function createNotification(userId: string, type: string, message: string, linkUrl?: string): Promise<void> {
  await db.insert(notifications).values({ id: randomUUID(), userId, type, message, linkUrl: linkUrl || null });
}

export async function getNotifications(userId: string, limit: number = 30): Promise<Notification[]> {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)` }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(cnt);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function getUserDashboardStats(userId: string) {
  const userQuotes = await db.select().from(quotes).where(eq(quotes.userId, userId));
  const quoteIds = userQuotes.map(q => q.id);
  const totalQuotes = userQuotes.length;
  const totalLikes = userQuotes.reduce((sum, q) => sum + (q.likesCount || 0), 0);
  const totalViews = userQuotes.reduce((sum, q) => sum + (q.viewCount || 0), 0);

  let totalComments = 0;
  let totalReactions = 0;
  if (quoteIds.length > 0) {
    const [{ cCnt }] = await db.select({ cCnt: sql<number>`count(*)` }).from(quoteComments).where(inArray(quoteComments.quoteId, quoteIds));
    totalComments = Number(cCnt);
    const [{ rCnt }] = await db.select({ rCnt: sql<number>`count(*)` }).from(quoteReactions).where(inArray(quoteReactions.quoteId, quoteIds));
    totalReactions = Number(rCnt);
  }

  const bestQuote = userQuotes.length > 0 ? userQuotes.reduce((best, q) => (q.likesCount || 0) > (best.likesCount || 0) ? q : best) : null;

  const moodBreakdown: Record<string, number> = {};
  for (const q of userQuotes) {
    moodBreakdown[q.mood] = (moodBreakdown[q.mood] || 0) + 1;
  }

  return { totalQuotes, totalLikes, totalViews, totalComments, totalReactions, bestQuote, moodBreakdown };
}

// ─── REDEEM CODES ──────────────────────────────────────

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  return db.select().from(redeemCodes).orderBy(desc(redeemCodes.createdAt));
}

export async function createRedeemCode(data: { code: string; flowersAmount: number; maxUses: number; expiresAt?: string }): Promise<RedeemCode> {
  const id = randomUUID();
  const values: any = { id, code: data.code.toUpperCase(), flowersAmount: data.flowersAmount, maxUses: data.maxUses };
  if (data.expiresAt) values.expiresAt = new Date(data.expiresAt);
  const [row] = await db.insert(redeemCodes).values(values).returning();
  return row;
}

export async function deleteRedeemCode(id: string): Promise<void> {
  await db.delete(redeemCodes).where(eq(redeemCodes.id, id));
}

export async function toggleRedeemCode(id: string): Promise<void> {
  const [existing] = await db.select().from(redeemCodes).where(eq(redeemCodes.id, id));
  if (existing) await db.update(redeemCodes).set({ isActive: !existing.isActive }).where(eq(redeemCodes.id, id));
}

export async function redeemCode(userId: string, code: string): Promise<{ success: boolean; message: string; flowersAmount?: number }> {
  const [codeRow] = await db.select().from(redeemCodes).where(eq(redeemCodes.code, code.toUpperCase()));
  if (!codeRow) return { success: false, message: "Kode tidak ditemukan" };
  if (!codeRow.isActive) return { success: false, message: "Kode sudah tidak aktif" };
  if (codeRow.usedCount >= codeRow.maxUses) return { success: false, message: "Kode sudah habis dipakai" };
  if (codeRow.expiresAt && new Date(codeRow.expiresAt) < new Date()) return { success: false, message: "Kode sudah kedaluwarsa" };

  const [alreadyUsed] = await db.select().from(redeemUses)
    .where(and(eq(redeemUses.codeId, codeRow.id), eq(redeemUses.userId, userId)));
  if (alreadyUsed) return { success: false, message: "Kamu sudah pernah memakai kode ini" };

  await db.insert(redeemUses).values({ id: randomUUID(), codeId: codeRow.id, userId });
  await db.update(redeemCodes).set({ usedCount: codeRow.usedCount + 1 }).where(eq(redeemCodes.id, codeRow.id));
  await db.update(users).set({ flowersBalance: sql`${users.flowersBalance} + ${codeRow.flowersAmount}` }).where(eq(users.id, userId));
  await db.insert(flowerTransactions).values({
    id: randomUUID(), userId, type: "redeem", amount: codeRow.flowersAmount,
    description: `Redeem kode ${codeRow.code}`,
  });

  return { success: true, message: `Berhasil! ${codeRow.flowersAmount} bunga ditambahkan`, flowersAmount: codeRow.flowersAmount };
}

export async function adminAddFlowers(userId: string, amount: number, reason: string): Promise<void> {
  await db.update(users).set({ flowersBalance: sql`${users.flowersBalance} + ${amount}` }).where(eq(users.id, userId));
  await db.insert(flowerTransactions).values({
    id: randomUUID(), userId, type: "admin_add", amount,
    description: reason || `Penambahan manual oleh admin`,
  });
}

export type { User, PublicUser, Tag, Quote, QuoteWithTags, GiftType, WithdrawalMethod, WithdrawalRequest, Waitlist, FlowerTransaction, TopupPackage, TopupRequest, BetaCode, GiftRoleApplication, Ad, QuoteCommentWithUser, CollectionWithMeta, QuoteBattleWithQuotes, UserBadge, UserStreak, Donation, QuoteReaction, Notification, RedeemCode, RedeemUse };
