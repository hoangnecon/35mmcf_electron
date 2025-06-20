// server/index.ts
import express, { type Express, type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

// Log function
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// Thêm middleware CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['http://localhost:5173', null] // Thêm 'null' cho các yêu cầu từ file:// origin trong production Electron
  : ['http://localhost:5173']; // Chỉ cho phép Vite dev server trong phát triển

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Quan trọng để gửi cookies/session
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware để log request
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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Global error handler caught an error:", err);
    console.error("Error status:", status);
    console.error("Error message:", message);
    if (err.stack) {
        console.error("Error stack:", err.stack);
    }

    res.status(status).json({ message });
  });

  // Backend Express server sẽ luôn lắng nghe trên cổng 5000
  // Electron sẽ kết nối đến cổng này.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Backend server serving on port ${port}`);
  });

  // Không cần setupVite hoặc serveStatic ở đây nữa
})();

// Export app để có thể được sử dụng bởi Electron main process nếu cần
export default app;