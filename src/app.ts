// app.ts
import "reflect-metadata";
import express, { json, urlencoded, Response as ExResponse, Request as ExRequest, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { ValidateError } from "tsoa";
import { RegisterRoutes } from "./routes/routes";
import "dotenv/config";
dotenv.config();

const app = express();

// ============================================
// CORS CONFIGURATION
// ============================================

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) {
      return callback(null, true);
    }

    if (isDevelopment) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'X-CSRF-Token',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// ============================================
// OTHER MIDDLEWARE
// ============================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(json({ limit: "10mb" }));
app.use(urlencoded({ extended: true }));
app.use(morgan("dev"));

// ============================================
// 📍 ROOT ROUTES (ADD THESE!)
// ============================================

// Root endpoint - shows API info
app.get("/", (req: ExRequest, res: ExResponse) => {
  res.json({
    message: "🚀 Sheki Backend API",
    version: "1.0.0",
    endpoints: {
      docs: "/api-docs",
      health: "/health",
      api: "/api/v1",
      swagger_json: "/swagger.json"
    },
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Simple health check at root level
app.get("/health", (req: ExRequest, res: ExResponse) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ============================================
// API ROUTES (TSOA)
// ============================================

// Create an API router
const apiRouter = express.Router();

// Register all tsoa routes on the apiRouter
RegisterRoutes(apiRouter);

// Mount the apiRouter at /api/v1 path
app.use("/api/v1", apiRouter);

// ============================================
// SWAGGER DOCS
// ============================================

app.use("/api-docs", swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
  const swaggerDocument = await import("../dist/swagger.json");
  res.send(swaggerUi.generateHTML(swaggerDocument));
});

app.get("/swagger.json", async (_req: ExRequest, res: ExResponse) => {
  const swaggerDocument = await import("../dist/swagger.json");
  res.json(swaggerDocument);
});

// CORS test endpoint (keep this as well)
app.get("/api/cors-test", (req: ExRequest, res: ExResponse) => {
  res.json({
    success: true,
    message: "CORS is working! 🎉",
    data: {
      origin: req.headers.origin || "No origin header",
      method: req.method,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((_req: ExRequest, res: ExResponse) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    available_endpoints: {
      root: "/",
      health: "/health",
      api: "/api/v1",
      docs: "/api-docs",
      swagger_json: "/swagger.json"
    }
  });
});

// Global error handler
app.use((err: unknown, req: ExRequest, res: ExResponse, next: NextFunction) => {
  if (err instanceof Error && err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Origin not allowed',
      origin: req.headers.origin || 'Unknown',
    });
  }

  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  }

  if (err instanceof Error) {
    console.error("🔥 Server Error:", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? err.message : "Internal server error",
    });
  }

  next();
});

export default app;