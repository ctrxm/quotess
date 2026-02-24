import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { submitQuoteSchema } from "@shared/schema";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/quotes", async (req: Request, res: Response) => {
    try {
      const { mood, tag, page, limit } = req.query;
      const result = await storage.getQuotes({
        mood: mood as string | undefined,
        tagSlug: tag as string | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 12,
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/quotes/search", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") return res.json([]);
      const results = await storage.searchQuotes(q);
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteById(req.params.id);
      if (!quote) return res.status(404).json({ error: "Quote tidak ditemukan" });
      res.json(quote);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/quotes/:id/related", async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteById(req.params.id);
      if (!quote) return res.status(404).json({ error: "Quote tidak ditemukan" });
      const related = await storage.getRelatedQuotes(quote.mood, quote.id);
      res.json(related);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/quotes", async (req: Request, res: Response) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: "Terlalu banyak submit. Coba lagi dalam 10 menit." });
      }
      const parsed = submitQuoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { tags: tagNames = [], ...quoteData } = parsed.data;
      const quote = await storage.submitQuote(quoteData, tagNames);
      res.status(201).json(quote);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tags", async (_req: Request, res: Response) => {
    try {
      const allTags = await storage.getTags();
      res.json(allTags);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/quotes", async (req: Request, res: Response) => {
    try {
      const secret = req.query.key || req.headers["x-admin-secret"];
      if (secret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
        return res.status(403).json({ error: "Akses ditolak" });
      }
      const pending = await storage.getPendingQuotes();
      res.json(pending);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/quotes/:id", async (req: Request, res: Response) => {
    try {
      const secret = req.query.key || req.headers["x-admin-secret"] || req.body.adminKey;
      if (secret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
        return res.status(403).json({ error: "Akses ditolak" });
      }
      const { status } = req.body;
      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({ error: "Status tidak valid" });
      }
      await storage.updateQuoteStatus(req.params.id, status);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
