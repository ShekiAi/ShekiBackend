// src/scripts/setupQdrant.ts

import qdrant from "../lib/qdrant";

// Gemini gemini-embedding-001 capped at 768 dimensions
// Matches outputDimensionality in embedding.service.ts
const VECTOR_SIZE = 768;

const collections = ["courses", "groups", "events", "mentors"];

async function setup() {
  for (const name of collections) {
    const exists = await qdrant.collectionExists(name);

    if (exists.exists) {
      await qdrant.deleteCollection(name);
      console.log(`— Deleted old collection: ${name}`);
    }

    await qdrant.createCollection(name, {
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