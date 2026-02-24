import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  author: text("author"),
  mood: text("mood").notNull(),
  status: text("status").notNull().default("approved"),
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

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const submitQuoteSchema = insertQuoteSchema.extend({
  text: z.string().min(10, "Quote minimal 10 karakter").max(500, "Quote maksimal 500 karakter"),
  author: z.string().max(100).optional(),
  mood: z.enum(["galau", "semangat", "sindir", "healing", "kerja", "cinta"]),
  tags: z.array(z.string()).optional().default([]),
});

export const insertTagSchema = createInsertSchema(tags).omit({ id: true });

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type SubmitQuote = z.infer<typeof submitQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type QuoteTag = typeof quoteTags.$inferSelect;

export type QuoteWithTags = Quote & { tags: Tag[] };

export const MOODS = ["galau", "semangat", "sindir", "healing", "kerja", "cinta"] as const;
export type Mood = typeof MOODS[number];

export const MOOD_LABELS: Record<Mood, string> = {
  galau: "Galau",
  semangat: "Semangat",
  sindir: "Sindir",
  healing: "Healing",
  kerja: "Kerja",
  cinta: "Cinta",
};

export const MOOD_COLORS: Record<Mood, { bg: string; border: string; text: string }> = {
  galau: { bg: "bg-blue-100 dark:bg-blue-900", border: "border-blue-500", text: "text-blue-700 dark:text-blue-300" },
  semangat: { bg: "bg-yellow-100 dark:bg-yellow-900", border: "border-yellow-500", text: "text-yellow-700 dark:text-yellow-300" },
  sindir: { bg: "bg-red-100 dark:bg-red-900", border: "border-red-500", text: "text-red-700 dark:text-red-300" },
  healing: { bg: "bg-green-100 dark:bg-green-900", border: "border-green-500", text: "text-green-700 dark:text-green-300" },
  kerja: { bg: "bg-purple-100 dark:bg-purple-900", border: "border-purple-500", text: "text-purple-700 dark:text-purple-300" },
  cinta: { bg: "bg-pink-100 dark:bg-pink-900", border: "border-pink-500", text: "text-pink-700 dark:text-pink-300" },
};

export const POPULAR_TAGS = [
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
  { name: "Bucin", slug: "bucin" },
];

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = { username: string; password: string };
