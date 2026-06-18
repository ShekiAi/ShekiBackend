// src/server.ts
import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Swagger UI available at http://localhost:${PORT}/api-docs`);
  console.log(`📄 Swagger JSON available at http://localhost:${PORT}/swagger.json`);
});