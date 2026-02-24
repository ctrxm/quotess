import type { Request, Response, NextFunction } from "express";
import { getUserById } from "./storage";
import type { User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  if (req.session.userId) {
    try {
      const user = await getUserById(req.session.userId);
      if (user) req.user = user;
    } catch {}
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Silakan login terlebih dahulu" });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Silakan login terlebih dahulu" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Akses ditolak" });
  next();
}
