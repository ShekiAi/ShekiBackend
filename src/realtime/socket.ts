// src/realtime/socket.ts
//
// Tutors' browsers connect directly to this socket server (GOYE's frontend
// talks straight to ShekiAI's Socket.IO, no proxy through GOYE's backend —
// per the confirmed "GOYE calls the API(ShekiAI), same web socket server"
// architecture). Unlike the REST course-draft endpoints (gated by a
// backend-to-backend service key, since GOYE's backend calls those), this
// connection carries a real tutor identity and must be authenticated
// per-connection. Mirrors GOYE's own socketService.ts pattern exactly: an
// "authenticate" event carrying GOYE's access token, verified against the
// same ACCESS_SECRET — GOYE and ShekiAI share the same User table, so
// decoded.id is directly a real tutorId here.
import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { setIO } from "./progressEmitter";

interface AccessTokenPayload {
  id: string;
  userType?: string;
  email?: string;
  full_name?: string;
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

export function initSocket(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
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

  io.on("connection", (socket: Socket) => {
    const authTimeout = setTimeout(() => {
      if (!socket.data.authenticated) {
        socket.emit("auth_timeout", { message: "Authentication timeout" });
        socket.disconnect();
      }
    }, 10000);

    socket.on("authenticate", (data: { token?: string }) => {
      try {
        if (!data?.token) {
          socket.emit("authenticated", { success: false, error: "No token provided" });
          return;
        }
        const decoded = jwt.verify(data.token, process.env.ACCESS_SECRET as string) as AccessTokenPayload;
        if (!decoded?.id) {
          socket.emit("authenticated", { success: false, error: "Invalid token payload" });
          return;
        }
        clearTimeout(authTimeout);
        socket.data.authenticated = true;
        socket.data.userId = decoded.id;
        socket.emit("authenticated", { success: true });
      } catch {
        socket.emit("authenticated", { success: false, error: "Invalid or expired token" });
      }
    });

    socket.on("join_session", async (data: { sessionId?: string }) => {
      if (!socket.data.authenticated) {
        socket.emit("error", { message: "Not authenticated" });
        return;
      }
      const sessionId = data?.sessionId;
      if (!sessionId) {
        socket.emit("error", { message: "sessionId is required" });
        return;
      }
      const session = await prisma.courseDraftSession.findUnique({ where: { id: sessionId } });
      if (!session || session.tutorId !== socket.data.userId) {
        socket.emit("error", { message: "Session not found or does not belong to you" });
        return;
      }
      socket.join(sessionId);
      socket.emit("joined_session", { sessionId });
    });

    socket.on("disconnect", () => clearTimeout(authTimeout));
  });

  setIO(io);
  return io;
}
