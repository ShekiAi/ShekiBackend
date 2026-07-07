// src/scripts/seedEmbeddings.ts
import * as dotenv from "dotenv";
dotenv.config(); // ← add this before anything else

import { EmbeddingService } from "../services/embedding.service";

EmbeddingService.embedAll()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });