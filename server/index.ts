import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

const app = express();
const httpServer = createServer(app);

// ---------- Types ----------
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

// ---------- Middleware ----------
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

// ---------- Logger ----------
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// ---------- Request Tracing ----------
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown;

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;

    const duration = Date.now() - start;
    let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

    if (capturedJsonResponse !== undefined) {
      line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    log(line);
  });

  next();
});

// ---------- Bootstrap ----------
(async () => {
  await registerRoutes(httpServer, app);

  // ---------- Error Handler ----------
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message ?? "Internal Server Error";

      log(message, "error");
      res.status(status).json({ message });
    }
  );

  // ---------- Static / Vite ----------
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ---------- Server ----------
  const port = Number(process.env.PORT) || 5000;

  httpServer.listen(port, () => {
    log(`serving on http://localhost:${port}`);
  });
})();
