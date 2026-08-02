"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./realtime/socket");
const PORT = process.env.PORT || 3000;
const httpServer = app_1.default.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Swagger UI available at http://localhost:${PORT}/api-docs`);
    console.log(`📄 Swagger JSON available at http://localhost:${PORT}/swagger.json`);
});
(0, socket_1.initSocket)(httpServer);
console.log("🔌 Socket.IO realtime layer initialized");
//# sourceMappingURL=server.js.map