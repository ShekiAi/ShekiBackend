"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const progressEmitter_1 = require("./progressEmitter");
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
function initSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || isDevelopment || allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                callback(new Error("Not allowed by CORS"));
            },
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        const authTimeout = setTimeout(() => {
            if (!socket.data.authenticated) {
                socket.emit("auth_timeout", { message: "Authentication timeout" });
                socket.disconnect();
            }
        }, 10000);
        socket.on("authenticate", (data) => {
            try {
                if (!data?.token) {
                    socket.emit("authenticated", { success: false, error: "No token provided" });
                    return;
                }
                const decoded = jsonwebtoken_1.default.verify(data.token, process.env.ACCESS_SECRET);
                if (!decoded?.id) {
                    socket.emit("authenticated", { success: false, error: "Invalid token payload" });
                    return;
                }
                clearTimeout(authTimeout);
                socket.data.authenticated = true;
                socket.data.userId = decoded.id;
                socket.emit("authenticated", { success: true });
            }
            catch {
                socket.emit("authenticated", { success: false, error: "Invalid or expired token" });
            }
        });
        socket.on("join_session", async (data) => {
            if (!socket.data.authenticated) {
                socket.emit("error", { message: "Not authenticated" });
                return;
            }
            const sessionId = data?.sessionId;
            if (!sessionId) {
                socket.emit("error", { message: "sessionId is required" });
                return;
            }
            const session = await db_1.prisma.courseDraftSession.findUnique({ where: { id: sessionId } });
            if (!session || session.tutorId !== socket.data.userId) {
                socket.emit("error", { message: "Session not found or does not belong to you" });
                return;
            }
            socket.join(sessionId);
            socket.emit("joined_session", { sessionId });
        });
        socket.on("disconnect", () => clearTimeout(authTimeout));
    });
    (0, progressEmitter_1.setIO)(io);
    return io;
}
//# sourceMappingURL=socket.js.map