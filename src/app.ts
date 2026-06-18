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

// Middlewares
app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(json({ limit: "10mb" }));
app.use(urlencoded({ extended: true }));
app.use(morgan("dev"));

// Create an API router
const apiRouter = express.Router();

// Register all tsoa routes on the apiRouter
RegisterRoutes(apiRouter);

// Mount the apiRouter at /api path
app.use("/api/v1", apiRouter);

// Swagger UI (still at root, or you can move it)
app.use("/api-docs", swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
  const swaggerDocument = await import("../dist/swagger.json");
  res.send(swaggerUi.generateHTML(swaggerDocument));
});

app.get("/swagger.json", async (_req: ExRequest, res: ExResponse) => {
  const swaggerDocument = await import("../dist/swagger.json");
  res.json(swaggerDocument);
});

// 404 handler
app.use((_req: ExRequest, res: ExResponse) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err: unknown, req: ExRequest, res: ExResponse, next: NextFunction) => {
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
      message: "Internal server error",
    });
  }

  next();
});

export default app;