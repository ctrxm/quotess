import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, getSetting, setSetting } from "./storage";
import { submitQuoteSchema, registerSchema, loginSchema, FLOWERS_TO_IDR_RATE, MIN_WITHDRAWAL_FLOWERS } from "@shared/schema";
import { requireAuth, requireAdmin } from "./auth";
import { randomUUID } from "crypto";
import type { TopupPackage } from "@shared/schema";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, max = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs }); return true; }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ─── AUTH ─────────────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
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
      if (betaCode) await storage.markBetaCodeUsed(betaCode, user.id).catch(() => {});
      res.status(201).json({ user });
    } catch (e: any) {
      if (e.code === "23505") return res.status(409).json({ error: "Email atau username sudah digunakan" });
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
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
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.user) return res.json({ user: null });
    const { passwordHash: _, ...pub } = req.user;
    res.json({ user: pub });
  });

  // ─── WAITLIST ─────────────────────────────────────────
  app.post("/api/waitlist", async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      if (!email || typeof email !== "string") return res.status(400).json({ error: "Email wajib diisi" });
      const entry = await storage.addToWaitlist(email, name);
      res.status(201).json(entry);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── SETTINGS (public) ─────────────────────────────────
  app.get("/api/settings/public", async (_req: Request, res: Response) => {
    try {
      const s = await storage.getAllSettings();
      res.json({
        maintenanceMode: s.maintenance_mode === "true",
        betaMode: s.beta_mode === "true",
        betaAccessType: s.beta_access_type || "open",
        siteName: s.site_name || "KataViral",
        siteDescription: s.site_description || "Quote Indonesia yang Bikin Viral",
        notificationEnabled: s.notification_enabled === "true",
        notificationType: s.notification_type || "banner",
        notificationMessage: s.notification_message || "",
        notificationBg: s.notification_bg || "#FFE34D",
        notificationTextColor: s.notification_text_color || "#000000",
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── QUOTES ──────────────────────────────────────────
  app.get("/api/quotes", async (req: Request, res: Response) => {
    try {
      const { mood, tag, page, limit } = req.query;
      const result = await storage.getQuotes({
        mood: mood as string | undefined, tagSlug: tag as string | undefined,
        page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 12,
        userId: req.user?.id,
      });
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/quotes/search", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") return res.json([]);
      const results = await storage.searchQuotes(q, req.user?.id);
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteById(req.params.id, req.user?.id);
      if (!quote) return res.status(404).json({ error: "Quote tidak ditemukan" });
      res.json(quote);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/quotes/:id/related", async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteById(req.params.id);
      if (!quote) return res.status(404).json({ error: "Quote tidak ditemukan" });
      const related = await storage.getRelatedQuotes(quote.mood, quote.id, req.user?.id);
      res.json(related);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/quotes", requireAuth, async (req: Request, res: Response) => {
    try {
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
      if (!checkRateLimit(ip)) return res.status(429).json({ error: "Terlalu banyak submit. Coba lagi dalam 10 menit." });
      const parsed = submitQuoteSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
      const { tags: tagNames = [], ...quoteData } = parsed.data;
      const quote = await storage.submitQuote(quoteData, tagNames);
      res.status(201).json(quote);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── LIKES ───────────────────────────────────────────
  app.post("/api/quotes/:id/like", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await storage.toggleLike(req.user!.id, req.params.id);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── TAGS ────────────────────────────────────────────
  app.get("/api/tags", async (_req: Request, res: Response) => {
    try { res.json(await storage.getTags()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── USER SEARCH ────────────────────────────────────
  app.get("/api/users/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (q.length < 2) return res.json([]);
      res.json(await storage.searchUsers(q, req.user!.id));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── GIFTS ───────────────────────────────────────────
  app.get("/api/gifts/types", async (_req: Request, res: Response) => {
    try { res.json(await storage.getGiftTypes()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/gifts/send", requireAuth, async (req: Request, res: Response) => {
    try {
      const { receiverId, giftTypeId, quoteId, message } = req.body;
      if (!receiverId || !giftTypeId) return res.status(400).json({ error: "Data tidak lengkap" });
      await storage.sendGift(req.user!.id, receiverId, giftTypeId, quoteId, message);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.get("/api/flowers/history", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.getFlowerHistory(req.user!.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── WITHDRAWAL ──────────────────────────────────────
  app.get("/api/withdrawal/methods", async (_req: Request, res: Response) => {
    try { res.json(await storage.getWithdrawalMethods()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/withdrawal/request", requireAuth, async (req: Request, res: Response) => {
    try {
      const { methodId, accountNumber, accountName, flowersAmount } = req.body;
      if (!methodId || !accountNumber || !accountName || !flowersAmount) return res.status(400).json({ error: "Data tidak lengkap" });
      const result = await storage.requestWithdrawal(req.user!.id, methodId, accountNumber, accountName, parseInt(flowersAmount));
      res.json(result);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.get("/api/withdrawal/my", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.getWithdrawalRequests(req.user!.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── ADMIN ───────────────────────────────────────────
  app.get("/api/admin/quotes", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getPendingQuotes()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/quotes/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (status !== "approved" && status !== "rejected") return res.status(400).json({ error: "Status tidak valid" });
      await storage.updateQuoteStatus(req.params.id, status);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/settings", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getAllSettings()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: "Key wajib diisi" });
      await setSetting(key, String(value));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/users", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getAllUsers()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { isActive, hasBetaAccess, isGiveEnabled, role, flowersBalance } = req.body;
      const data: any = {};
      if (isActive !== undefined) data.isActive = isActive;
      if (hasBetaAccess !== undefined) data.hasBetaAccess = hasBetaAccess;
      if (isGiveEnabled !== undefined) data.isGiveEnabled = isGiveEnabled;
      if (role !== undefined) data.role = role;
      if (flowersBalance !== undefined) data.flowersBalance = parseInt(flowersBalance);
      await storage.updateUser(req.params.id, data);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/waitlist", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getWaitlist()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/waitlist/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const betaCode = status === "approved" ? randomUUID().slice(0, 8).toUpperCase() : undefined;
      await storage.updateWaitlistStatus(req.params.id, status, betaCode);
      res.json({ success: true, betaCode });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/gifts", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getAllGiftTypes()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/gifts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, icon, costFlowers } = req.body;
      const gt = await storage.createGiftType({ name, icon: icon || "flower", costFlowers: parseInt(costFlowers) || 10 });
      res.status(201).json(gt);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/gifts/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.updateGiftType(req.params.id, req.body);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getWithdrawalRequests()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/withdrawals/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, adminNote } = req.body;
      await storage.updateWithdrawalStatus(req.params.id, status, adminNote);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/withdrawal-methods", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getAllWithdrawalMethods()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/withdrawal-methods", requireAdmin, async (req: Request, res: Response) => {
    try {
      const wm = await storage.createWithdrawalMethod(req.body);
      res.status(201).json(wm);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/withdrawal-methods/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.updateWithdrawalMethod(req.params.id, req.body);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── TOPUP (PUBLIC) ──────────────────────────────────
  app.get("/api/topup/packages", async (_req: Request, res: Response) => {
    try { res.json(await storage.getTopupPackages()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/topup/payment-info", async (_req: Request, res: Response) => {
    try {
      const bankName = await getSetting("topup_bank_name", "");
      const accountNumber = await getSetting("topup_account_number", "");
      const accountName = await getSetting("topup_account_name", "");
      res.json({ bankName: bankName || null, accountNumber: accountNumber || null, accountName: accountName || null });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/topup/request", requireAuth, async (req: Request, res: Response) => {
    try {
      const { packageId } = req.body;
      if (!packageId) return res.status(400).json({ error: "PackageId wajib diisi" });
      const result = await storage.createTopupRequest(req.user!.id, packageId);
      res.json(result);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.get("/api/topup/my", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.getTopupRequests(req.user!.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── ADMIN TOPUP ────────────────────────────────────
  app.get("/api/admin/topup/packages", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getAllTopupPackages()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/topup/packages", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, icon, description, flowersAmount, priceIdr, sortOrder } = req.body;
      const pkg = await storage.createTopupPackage({
        name, icon: icon || "🌸", description: description || null,
        flowersAmount: parseInt(flowersAmount), priceIdr: parseInt(priceIdr),
        isActive: true, sortOrder: parseInt(sortOrder) || 0,
      });
      res.status(201).json(pkg);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/topup/packages/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.updateTopupPackage(req.params.id, req.body);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/topup/requests", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getTopupRequests()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/topup/requests/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, adminNote } = req.body;
      await storage.updateTopupStatus(req.params.id, status, adminNote);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── GIFT ROLE APPLICATIONS ──────────────────────────────
  app.post("/api/gift-role/apply", requireAuth, async (req: Request, res: Response) => {
    try {
      const { type, reason, socialLink } = req.body;
      if (!reason || reason.trim().length < 10) return res.status(400).json({ error: "Alasan minimal 10 karakter" });
      const result = await storage.applyForGiftRole(req.user!.id, type || "both", reason.trim(), socialLink);
      res.status(201).json(result);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.get("/api/gift-role/my", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.getMyGiftRoleApplication(req.user!.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/gift-role", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getAllGiftRoleApplications()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/gift-role/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, adminNote } = req.body;
      if (status !== "approved" && status !== "rejected") return res.status(400).json({ error: "Status tidak valid" });
      await storage.updateGiftRoleApplication(req.params.id, status, adminNote);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── ADS ────────────────────────────────────────────
  app.get("/api/ads", async (_req: Request, res: Response) => {
    try { res.json(await storage.getActiveAds()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/ads/:id/click", async (req: Request, res: Response) => {
    try {
      await storage.incrementAdClicks(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/ads", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getAllAds()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/ads", requireAdmin, async (req: Request, res: Response) => {
    try { res.json(await storage.createAd(req.body)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/ads/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.updateAd(req.params.id, req.body);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin/ads/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteAd(req.params.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── BETA CODES ─────────────────────────────────────
  app.get("/api/admin/beta-codes", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getBetaCodes()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/beta-codes/generate", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.generateBetaCode()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  return httpServer;
}
