"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setIO = setIO;
exports.getIO = getIO;
exports.emitProgress = emitProgress;
let io = null;
function setIO(server) {
    io = server;
}
function getIO() {
    return io;
}
function emitProgress(sessionId, event, payload) {
    if (!io)
        return;
    io.to(sessionId).emit(event, { payload, ts: Date.now() });
}
//# sourceMappingURL=progressEmitter.js.map