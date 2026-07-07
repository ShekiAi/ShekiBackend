"use strict";
// src/scripts/setupQdrant.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const qdrant_1 = __importDefault(require("../lib/qdrant"));
// Gemini gemini-embedding-001 capped at 768 dimensions
// Matches outputDimensionality in embedding.service.ts
const VECTOR_SIZE = 768;
const collections = ["courses", "groups", "events", "mentors"];
async function setup() {
    for (const name of collections) {
        const exists = await qdrant_1.default.collectionExists(name);
        if (exists.exists) {
            await qdrant_1.default.deleteCollection(name);
            console.log(`— Deleted old collection: ${name}`);
        }
        await qdrant_1.default.createCollection(name, {
            vectors: {
                size: VECTOR_SIZE,
                distance: "Cosine",
            },
        });
        console.log(`✓ Created collection: ${name} (${VECTOR_SIZE} dims)`);
    }
    console.log("Qdrant setup complete.");
}
setup().catch(console.error);
//# sourceMappingURL=setupQdrant.js.map