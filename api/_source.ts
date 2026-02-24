import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";
import { loadUser } from "../server/auth";
import { serveStatic } from "../server/static";

const PgSession = connectPgSimple(session);

const app = express();
const httpServer = createServer(app);

const DB_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL!;
const sessionPool = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

app.set("trust proxy", 1);

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "kataviral-secret-dev",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(loadUser);

let initialized = false;
const initPromise = (async () => {
  try {
    const { seedDatabase } = await import("../server/seed");
    await seedDatabase();
  } catch (e) {
    console.error("[init] seed error:", e);
  }
  await registerRoutes(httpServer, app);
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });
  serveStatic(app);
  initialized = true;
})();

export default async function handler(req: Request, res: Response) {
  await initPromise;
  app(req as any, res as any);
}
