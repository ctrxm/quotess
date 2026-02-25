import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, getSetting, setSetting } from "./storage";
import { submitQuoteSchema, registerSchema, loginSchema, FLOWERS_TO_IDR_RATE, MIN_WITHDRAWAL_FLOWERS } from "@shared/schema";
import { requireAuth, requireAdmin } from "./auth";
import { randomUUID } from "crypto";
import type { TopupPackage } from "@shared/schema";
import { sendBetaCodeEmail } from "./email";
import { createQrisPayment, checkPaymentStatus } from "./bayar";

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
        siteName: s.site_name || "CTRXL.ID",
        siteDescription: s.site_description || "Platform Quote Indonesia",
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

  app.get("/api/quotes/daily", async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteOfTheDay(req.user?.id);
      if (!quote) return res.status(404).json({ error: "Belum ada quote" });
      res.json(quote);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/quotes/trending", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const trending = await storage.getTrendingQuotes(limit, req.user?.id);
      res.json(trending);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/author/:name", async (req: Request, res: Response) => {
    try {
      const param = decodeURIComponent(req.params.name);
      if (param.startsWith("@")) {
        const username = param.slice(1);
        const [quotesResult, stats] = await Promise.all([
          storage.getQuotesByUsername(username, req.user?.id),
          storage.getUserStatsByUsername(username),
        ]);
        if (!stats) return res.json({ author: `@${username}`, quotes: [], stats: { totalQuotes: 0, totalLikes: 0, totalViews: 0 }, isVerified: false });
        res.json({ author: `@${username}`, quotes: quotesResult, stats, isVerified: stats.isVerified });
      } else {
        const [quotesResult, stats] = await Promise.all([
          storage.getQuotesByAuthor(param, req.user?.id),
          storage.getAuthorStats(param),
        ]);
        res.json({ author: param, quotes: quotesResult, stats });
      }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/quotes/:id", async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuoteById(req.params.id, req.user?.id);
      if (!quote) return res.status(404).json({ error: "Quote tidak ditemukan" });
      storage.incrementViewCount(req.params.id).catch(() => {});
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
      if (!quoteData.isAnonymous) {
        quoteData.author = req.user!.username;
      }
      const quote = await storage.submitQuote(quoteData, tagNames, req.user!.id);
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
      const { isActive, hasBetaAccess, isGiveEnabled, role, flowersBalance, isVerified } = req.body;
      const data: any = {};
      if (isActive !== undefined) data.isActive = isActive;
      if (hasBetaAccess !== undefined) data.hasBetaAccess = hasBetaAccess;
      if (isGiveEnabled !== undefined) data.isGiveEnabled = isGiveEnabled;
      if (role !== undefined) data.role = role;
      if (flowersBalance !== undefined) data.flowersBalance = parseInt(flowersBalance);
      if (isVerified !== undefined) data.isVerified = isVerified;
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

      if (status === "approved" && betaCode) {
        const entry = await storage.getWaitlistById(req.params.id);
        if (entry?.email) {
          try {
            await sendBetaCodeEmail(entry.email, entry.name, betaCode);
            console.log(`[email] Beta code sent to ${entry.email}`);
          } catch (emailErr: any) {
            console.error(`[email] Failed to send to ${entry.email}:`, emailErr.message);
          }
        }
      }

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
      const packages = await storage.getTopupPackages();
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) return res.status(400).json({ error: "Paket tidak ditemukan" });

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost";
      const callbackUrl = `${protocol}://${host}/api/topup/callback`;

      const qris = await createQrisPayment(pkg.priceIdr, callbackUrl);
      if (!qris.success || !qris.data) {
        const result = await storage.createTopupRequest(req.user!.id, packageId);
        return res.json(result);
      }

      const result = await storage.createTopupRequest(req.user!.id, packageId, {
        invoiceId: qris.data.invoice_id,
        paymentUrl: qris.data.payment_url,
        finalAmount: qris.data.final_amount,
        expiresAt: qris.data.expires_at,
      });
      res.json(result);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.get("/api/topup/check/:invoiceId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      const topupReq = await storage.getTopupRequestByInvoice(invoiceId);
      if (!topupReq || topupReq.userId !== req.user!.id) return res.status(404).json({ error: "Not found" });
      const status = await checkPaymentStatus(invoiceId);
      if (status.success && status.status === "paid" && topupReq.status === "pending") {
        await storage.updateTopupStatus(topupReq.id, "confirmed", "Pembayaran otomatis via QRIS");
      }
      res.json({ status: status.status, paid_at: status.paid_at });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/topup/callback", async (req: Request, res: Response) => {
    try {
      const { invoice_id, status } = req.body;
      if (status === "paid" && invoice_id) {
        const topupReq = await storage.getTopupRequestByInvoice(invoice_id);
        if (topupReq && topupReq.status === "pending") {
          await storage.updateTopupStatus(topupReq.id, "confirmed", "Pembayaran otomatis via QRIS");
        }
      }
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
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

  // ─── COMMENTS ─────────────────────────────────────────
  app.get("/api/quotes/:id/comments", async (req: Request, res: Response) => {
    try { res.json(await storage.getComments(req.params.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/quotes/:id/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || text.trim().length < 1) return res.status(400).json({ error: "Komentar tidak boleh kosong" });
      if (text.length > 500) return res.status(400).json({ error: "Komentar maksimal 500 karakter" });
      const comment = await storage.addComment(req.user!.id, req.params.id, text.trim());
      res.status(201).json(comment);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/comments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteComment(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── BOOKMARKS ────────────────────────────────────────
  app.post("/api/quotes/:id/bookmark", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.toggleBookmark(req.user!.id, req.params.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/bookmarks", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.getBookmarkedQuotes(req.user!.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── AUTHOR FOLLOWS ───────────────────────────────────
  app.post("/api/author/:name/follow", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.toggleFollow(req.user!.id, decodeURIComponent(req.params.name))); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/author/:name/following", requireAuth, async (req: Request, res: Response) => {
    try {
      const following = await storage.isFollowing(req.user!.id, decodeURIComponent(req.params.name));
      const followersCount = await storage.getFollowersCount(decodeURIComponent(req.params.name));
      res.json({ following, followersCount });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── COLLECTIONS ──────────────────────────────────────
  app.get("/api/collections", async (_req: Request, res: Response) => {
    try { res.json(await storage.getCollections()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/collections/:id", async (req: Request, res: Response) => {
    try {
      const data = await storage.getCollectionById(req.params.id, req.user?.id);
      if (!data) return res.status(404).json({ error: "Koleksi tidak ditemukan" });
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/collections", requireAuth, async (req: Request, res: Response) => {
    try {
      const { name, description, coverColor, isPremium, priceFlowers } = req.body;
      if (!name) return res.status(400).json({ error: "Nama koleksi wajib diisi" });
      const col = await storage.createCollection({ name, description, coverColor, curatorId: req.user!.id, isPremium, priceFlowers });
      res.status(201).json(col);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/collections/:id/quotes", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.addQuoteToCollection(req.params.id, req.body.quoteId);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/collections/:id/quotes/:quoteId", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.removeQuoteFromCollection(req.params.id, req.params.quoteId);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── QUOTE BATTLES ───────────────────────────────────
  app.get("/api/battles/active", async (req: Request, res: Response) => {
    try { res.json(await storage.getActiveBattle(req.user?.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/battles/:id/vote", requireAuth, async (req: Request, res: Response) => {
    try {
      const { votedQuoteId } = req.body;
      if (!votedQuoteId) return res.status(400).json({ error: "Pilih quote untuk di-vote" });
      const result = await storage.voteBattle(req.user!.id, req.params.id, votedQuoteId);
      res.json(result);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ─── BADGES ───────────────────────────────────────────
  app.get("/api/badges", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.checkAllBadges(req.user!.id);
      const badges = await storage.getUserBadges(req.user!.id);
      res.json(badges);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── STREAKS ──────────────────────────────────────────
  app.post("/api/streak/update", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.updateStreak(req.user!.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/streak", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.getStreak(req.user!.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── REFERRALS ────────────────────────────────────────
  app.get("/api/referral", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.getReferralStats(req.user!.id)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/referral/use", requireAuth, async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Kode referral wajib diisi" });
      const success = await storage.useReferralCode(code, req.user!.id);
      if (!success) return res.status(400).json({ error: "Kode tidak valid atau sudah digunakan" });
      res.json({ success: true, bonus: 50 });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── LEADERBOARD ──────────────────────────────────────
  app.get("/api/leaderboard", async (_req: Request, res: Response) => {
    try { res.json(await storage.getAuthorLeaderboard()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── VERIFICATION ────────────────────────────────────
  app.get("/api/verification/my", requireAuth, async (req: Request, res: Response) => {
    try { res.json(await storage.getMyVerificationRequest(req.session.userId!)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/verification/apply", requireAuth, async (req: Request, res: Response) => {
    try {
      const { reason, socialLink } = req.body;
      if (!reason || reason.length < 10) return res.status(400).json({ error: "Alasan minimal 10 karakter" });
      const result = await storage.submitVerificationRequest(req.session.userId!, reason, socialLink);
      res.status(201).json(result);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.get("/api/admin/verifications", requireAdmin, async (_req: Request, res: Response) => {
    try { res.json(await storage.getAllVerificationRequests()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/verifications/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, adminNote } = req.body;
      await storage.updateVerificationRequest(req.params.id, status, adminNote);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── WIDGET EMBED ─────────────────────────────────────
  app.get("/api/embed/random", async (_req: Request, res: Response) => {
    try {
      const randomPage = Math.floor(Math.random() * 5) + 1;
      const result = await storage.getQuotes({ page: randomPage, limit: 1 });
      if (!result.quotes || result.quotes.length === 0) return res.status(404).json({ error: "No quotes" });
      const q = result.quotes[0];
      res.json({ text: q.text, author: q.author, mood: q.mood, id: q.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ─── DONATIONS ─────────────────────────────────────────
  app.post("/api/donate", async (req: Request, res: Response) => {
    try {
      const { donorName, amount, message } = req.body;
      const numAmount = parseInt(amount);
      if (!numAmount || numAmount < 1000) return res.status(400).json({ error: "Minimal donasi Rp 1.000" });

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host || "localhost";
      const callbackUrl = `${protocol}://${host}/api/donate/callback`;

      const qris = await createQrisPayment(numAmount, callbackUrl);
      if (!qris.success || !qris.data) return res.status(500).json({ error: "Gagal membuat pembayaran QRIS" });

      const donation = await storage.createDonation(donorName || "Anonim", numAmount, message, {
        invoiceId: qris.data.invoice_id,
        paymentUrl: qris.data.payment_url,
        finalAmount: qris.data.final_amount,
      });
      res.json(donation);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/donate/check/:invoiceId", async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      const donation = await storage.getDonationByInvoice(invoiceId);
      if (!donation) return res.status(404).json({ error: "Not found" });
      const status = await checkPaymentStatus(invoiceId);
      if (status.success && status.status === "paid" && donation.status === "pending") {
        await storage.updateDonationStatus(invoiceId, "paid");
      }
      res.json({ status: status.status, paid_at: status.paid_at });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/donate/callback", async (req: Request, res: Response) => {
    try {
      const { invoice_id, status } = req.body;
      if (status === "paid" && invoice_id) {
        await storage.updateDonationStatus(invoice_id, "paid");
      }
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/donate/recent", async (_req: Request, res: Response) => {
    try { res.json(await storage.getRecentDonations()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  return httpServer;
}
