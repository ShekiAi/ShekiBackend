// realtime/progressEmitter.ts
//
// Lazy singleton so service-layer code can emit progress events without
// having the httpServer/Socket.IO instance threaded through every call.
// emitProgress is a safe no-op until initSocket() (see socket.ts) has run —
// every REST endpoint also returns the same payload synchronously in its
// APIResponse, so nothing breaks if a client never opens a socket, and
// nothing breaks if this is called before the socket server exists yet.
import type { Server } from "socket.io";

let io: Server | null = null;

export function setIO(server: Server) {
  io = server;
}

export function getIO(): Server | null {
  return io;
}

export function emitProgress(sessionId: string, event: string, payload: any) {
  if (!io) return;
  io.to(sessionId).emit(event, { payload, ts: Date.now() });
}
