import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import pino from "pino";
import path from "path";
import { env } from "./config";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

// Logger configuration
const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  } : undefined,
});

const app = express();
const httpServer = createServer(app);

// Compression middleware - gzip/brotli compression for better performance
app.use(compression({
  level: 6, // Compression level (1-9, 6 is a good balance)
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers["x-no-compression"]) {
      return false;
    }
    // Use compression for all text-based content
    return compression.filter(req, res);
  },
}));

// Helmet.js for security headers
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === "production" ? {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval for Vite in dev
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https:", "http:"],
    },
  } : false, // Disable CSP in development to avoid conflicts with Vite HMR
  crossOriginEmbedderPolicy: false, // Allow external resources
}));

// CORS configuration
app.use(cors({
  origin: env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3005", "http://localhost:5000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate limiting - Environment variable ile kontrol edilebilir
const enableRateLimit = env.ENABLE_RATE_LIMIT === "true"; // "true" ise açık, diğer durumlarda kapalı

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her IP için 100 istek
  message: "Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !enableRateLimit, // Rate limit kapalıysa skip et
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // Login için 5 deneme
  message: "Çok fazla giriş denemesi yaptınız, lütfen 15 dakika sonra tekrar deneyin.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !enableRateLimit, // Rate limit kapalıysa skip et
});

// Apply rate limiting to API routes (sadece aktifse)
if (enableRateLimit) {
  app.use("/api/", apiLimiter);
  app.use("/api/admin/login", authLimiter);
  log("Rate limiting aktif");
} else {
  log("Rate limiting devre dışı (ENABLE_RATE_LIMIT=false)");
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  logger.info({ source }, message);
}

export function logError(error: Error | unknown, context?: Record<string, any>) {
  if (error instanceof Error) {
    logger.error({ err: error, ...context }, error.message);
  } else {
    logger.error({ ...context }, String(error));
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Uploads klasörünü serve et (registerRoutes'tan önce) with cache headers
  const uploadsPath = path.join(process.cwd(), "client", "public", "uploads");
  app.use("/uploads", express.static(uploadsPath, {
    maxAge: "1y",
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }));
  
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logError(err, {
      path: _req.path,
      method: _req.method,
      status,
    });

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(env.PORT, 10);
  httpServer.listen(
    port,
    "0.0.0.0",
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
