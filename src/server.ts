// src/server.ts
import app from "./app";
import { initSocket } from "./realtime/socket";

const PORT = process.env.PORT || 3000;

const httpServer = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Swagger UI available at http://localhost:${PORT}/api-docs`);
  console.log(`📄 Swagger JSON available at http://localhost:${PORT}/swagger.json`);
});

initSocket(httpServer);
console.log("🔌 Socket.IO realtime layer initialized");