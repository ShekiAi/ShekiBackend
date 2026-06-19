"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// app.ts
require("reflect-metadata");
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const tsoa_1 = require("tsoa");
const routes_1 = require("./routes/routes");
require("dotenv/config");
dotenv_1.default.config();
const app = (0, express_1.default)();
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
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        if (isDevelopment) {
            return callback(null, true);
        }
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
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
app.use((0, cors_1.default)(corsOptions));
// ============================================
// OTHER MIDDLEWARE
// ============================================
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, express_1.json)({ limit: "10mb" }));
app.use((0, express_1.urlencoded)({ extended: true }));
app.use((0, morgan_1.default)("dev"));
// ============================================
// 📍 ROOT ROUTES (ADD THESE!)
// ============================================
// Root endpoint - shows API info
app.get("/", (req, res) => {
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
app.get("/health", (req, res) => {
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
const apiRouter = express_1.default.Router();
// Register all tsoa routes on the apiRouter
(0, routes_1.RegisterRoutes)(apiRouter);
// Mount the apiRouter at /api/v1 path
app.use("/api/v1", apiRouter);
// ============================================
// SWAGGER DOCS
// ============================================
app.use("/api-docs", swagger_ui_express_1.default.serve, async (_req, res) => {
    const swaggerDocument = await Promise.resolve().then(() => __importStar(require("../dist/swagger.json")));
    res.send(swagger_ui_express_1.default.generateHTML(swaggerDocument));
});
app.get("/swagger.json", async (_req, res) => {
    const swaggerDocument = await Promise.resolve().then(() => __importStar(require("../dist/swagger.json")));
    res.json(swaggerDocument);
});
// CORS test endpoint (keep this as well)
app.get("/api/cors-test", (req, res) => {
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
app.use((_req, res) => {
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
app.use((err, req, res, next) => {
    if (err instanceof Error && err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS Error: Origin not allowed',
            origin: req.headers.origin || 'Unknown',
        });
    }
    if (err instanceof tsoa_1.ValidateError) {
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
exports.default = app;
//# sourceMappingURL=app.js.map