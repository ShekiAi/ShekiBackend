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
require("reflect-metadata");
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const tsoa_1 = require("tsoa");
const routes_1 = require("./routes/routes");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
/**
 * =========================
 * MIDDLEWARES
 * =========================
 */
// Security headers
app.use((0, helmet_1.default)());
// Enable CORS
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true,
}));
// JSON parsing
app.use((0, express_1.json)({ limit: "10mb" }));
app.use((0, express_1.urlencoded)({ extended: true }));
// Logging
app.use((0, morgan_1.default)("dev"));
/**
 * =========================
 * SWAGGER UI
 * =========================
 */
app.use("/api-docs", swagger_ui_express_1.default.serve, async (_req, res) => {
    const swaggerDocument = await Promise.resolve().then(() => __importStar(require("../dist/swagger.json")));
    res.send(swagger_ui_express_1.default.generateHTML(swaggerDocument));
});
// Optional: Serve raw swagger.json
app.get("/swagger.json", async (_req, res) => {
    const swaggerDocument = await Promise.resolve().then(() => __importStar(require("../dist/swagger.json")));
    res.json(swaggerDocument);
});
/**
 * =========================
 * TSOA ROUTES
 * =========================
 */
// This registers all routes from your controllers
(0, routes_1.RegisterRoutes)(app);
/**
 * =========================
 * ERROR HANDLING
 * =========================
 */
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});
// Global error handler (tsoa-specific)
app.use((err, req, res, next) => {
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
            message: "Internal server error",
        });
    }
    next();
});
exports.default = app;
//# sourceMappingURL=app.js.map