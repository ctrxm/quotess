import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and, ilike, or, inArray, sql } from "drizzle-orm";
import { quotes, tags, quoteTags, type Quote, type Tag, type QuoteWithTags, type InsertQuote } from "@shared/schema";
import { randomUUID } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export interface IStorage {
  getQuotes(options: { mood?: string; tagSlug?: string; page?: number; limit?: number }): Promise<{ quotes: QuoteWithTags[]; total: number }>;
  getQuoteById(id: string): Promise<QuoteWithTags | undefined>;
  searchQuotes(q: string): Promise<QuoteWithTags[]>;
  submitQuote(quote: InsertQuote, tagNames: string[]): Promise<Quote>;
  getPendingQuotes(): Promise<QuoteWithTags[]>;
  updateQuoteStatus(id: string, status: "approved" | "rejected"): Promise<void>;
  getTags(): Promise<Tag[]>;
  getRelatedQuotes(mood: string, excludeId: string): Promise<QuoteWithTags[]>;
}

async function getTagsForQuoteIds(quoteIds: string[]): Promise<Map<string, Tag[]>> {
  if (quoteIds.length === 0) return new Map();
  const rows = await db
    .select({ quoteId: quoteTags.quoteId, tag: tags })
    .from(quoteTags)
    .innerJoin(tags, eq(quoteTags.tagId, tags.id))
    .where(inArray(quoteTags.quoteId, quoteIds));

  const map = new Map<string, Tag[]>();
  for (const row of rows) {
    if (!map.has(row.quoteId)) map.set(row.quoteId, []);
    map.get(row.quoteId)!.push(row.tag);
  }
  return map;
}

async function attachTags(qs: Quote[]): Promise<QuoteWithTags[]> {
  const tagMap = await getTagsForQuoteIds(qs.map((q) => q.id));
  return qs.map((q) => ({ ...q, tags: tagMap.get(q.id) || [] }));
}

async function findOrCreateTag(name: string): Promise<Tag> {
  const slug = name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  const existing = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  if (existing.length > 0) return existing[0];
  const created = await db.insert(tags).values({ id: randomUUID(), name, slug }).returning();
  return created[0];
}

class DbStorage implements IStorage {
  async getQuotes({ mood, tagSlug, page = 1, limit = 12 }: { mood?: string; tagSlug?: string; page?: number; limit?: number }) {
    const offset = (page - 1) * limit;

    const conditions = [eq(quotes.status, "approved")];
    if (mood) conditions.push(eq(quotes.mood, mood));

    let quoteIdsByTag: string[] | undefined;
    if (tagSlug) {
      const tag = await db.select().from(tags).where(eq(tags.slug, tagSlug)).limit(1);
      if (tag.length > 0) {
        const qts = await db.select({ quoteId: quoteTags.quoteId }).from(quoteTags).where(eq(quoteTags.tagId, tag[0].id));
        quoteIdsByTag = qts.map((r) => r.quoteId);
        if (quoteIdsByTag.length === 0) return { quotes: [], total: 0 };
        conditions.push(inArray(quotes.id, quoteIdsByTag));
      } else {
        return { quotes: [], total: 0 };
      }
    }

    const [countRow] = await db.select({ total: sql<number>`count(*)` }).from(quotes).where(and(...conditions));
    const rows = await db.select().from(quotes).where(and(...conditions)).orderBy(desc(quotes.createdAt)).limit(limit).offset(offset);
    const withTags = await attachTags(rows);
    return { quotes: withTags, total: Number(countRow.total) };
  }

  async getQuoteById(id: string): Promise<QuoteWithTags | undefined> {
    const rows = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
    if (rows.length === 0) return undefined;
    const [withTags] = await attachTags(rows);
    return withTags;
  }

  async searchQuotes(q: string): Promise<QuoteWithTags[]> {
    const rows = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.status, "approved"), or(ilike(quotes.text, `%${q}%`), ilike(quotes.author, `%${q}%`))))
      .orderBy(desc(quotes.createdAt))
      .limit(20);
    return attachTags(rows);
  }

  async submitQuote(quote: InsertQuote, tagNames: string[]): Promise<Quote> {
    const id = randomUUID();
    const [created] = await db.insert(quotes).values({ ...quote, id, status: "pending" }).returning();
    for (const name of tagNames) {
      if (!name.trim()) continue;
      const tag = await findOrCreateTag(name.trim());
      await db.insert(quoteTags).values({ quoteId: id, tagId: tag.id }).onConflictDoNothing();
    }
    return created;
  }

  async getPendingQuotes(): Promise<QuoteWithTags[]> {
    const rows = await db.select().from(quotes).where(eq(quotes.status, "pending")).orderBy(desc(quotes.createdAt));
    return attachTags(rows);
  }

  async updateQuoteStatus(id: string, status: "approved" | "rejected"): Promise<void> {
    await db.update(quotes).set({ status }).where(eq(quotes.id, id));
  }

  async getTags(): Promise<Tag[]> {
    return db.select().from(tags).orderBy(tags.name);
  }

  async getRelatedQuotes(mood: string, excludeId: string): Promise<QuoteWithTags[]> {
    const rows = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.status, "approved"), eq(quotes.mood, mood)))
      .orderBy(sql`random()`)
      .limit(4);
    const filtered = rows.filter((r) => r.id !== excludeId);
    return attachTags(filtered);
  }
}

export const storage = new DbStorage();

export type { User } from "@shared/schema";
export type { InsertUser } from "@shared/schema";
