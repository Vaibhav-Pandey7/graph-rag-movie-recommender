// =====================================================================
// vectorStore.js — STEP 4: Movie Text → Embedding → Pinecone
// =====================================================================
//
// Vector DB stores MEANING, not facts.
// It answers:  "Movies LIKE this" ✅
// It does NOT: "Who directed this?" ❌ (that's Neo4j's job)
//
// How embeddings work:
//   Text → Gemini → [0.3, 0.8, 0.1, ...] 
//   Similar texts → similar numbers → close in space
//
// Each movie becomes one vector with metadata in Pinecone.
// Pinecone index must have: dimensions=3072, metric=cosine
// =====================================================================

import { embedTexts, pineconeIndex } from "./config.js";

// Create a clean text description for embedding
// Raw PDF text has noise. Clean text embeds better.
function createEmbeddingText(entity) {
  const parts = [
    `${entity.movie.title} is a ${entity.genres.join(", ")} movie released in ${entity.movie.year}.`,
    `Directed by ${entity.director.name}.`,
    `Starring ${entity.actors.join(", ")}.`,
    `The movie explores themes of ${entity.themes.join(", ")}.`,
  ];
  if (entity.awards.length > 0) {
    parts.push(`Awards: ${entity.awards.join(", ")}.`);
  }
  return parts.join(" ");
}

// Store all movie embeddings in Pinecone
async function buildVectorStore(entities) {
  console.log(`\n📐 Building vector store for ${entities.length} movies...\n`);

  const batchSize = 50;

  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);
    console.log(`DEBUG: Batch size is ${batch.length}`);
    if (batch.length === 0) {
        console.error("❌ ERROR: Found an empty batch! Skipping...");
        continue; 
    }
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(entities.length / batchSize);

    console.log(`   📦 Embedding batch ${batchNum}/${totalBatches}...`);

    // Create clean texts
    const texts = batch.map((entity) => createEmbeddingText(entity));

    // Get 3072-dim vectors from Gemini
    const vectors = await embedTexts(texts);

    // Prepare Pinecone records
    const records = batch.map((entity, idx) => {
    // Safety check
    if (!entity.movie || !entity.movie.title) {
        console.warn("⚠️ Skipping a movie because it has no title:", entity);
        return null; 
    }
    
    return {
        id: entity.movie.title.replace(/\s+/g, "-").toLowerCase(),
        values: vectors[idx],
        metadata: {
            title: entity.movie.title,
            year: entity.movie.year,
            director: entity.director.name,
            genres: entity.genres.join(", "),
            themes: entity.themes.join(", "),
            actors: entity.actors.join(", "),
            text: texts[idx],
        },
    };
    }).filter(Boolean);
    
    console.log(`DEBUG: Prepared ${records.length} records to upsert.`);

    // Upsert (update + insert) to Pinecone
    //  ONLY UPSERT IF RECORDS EXIST
    if (records.length > 0) {
        try {
            await pineconeIndex.upsert(records);
        } catch (dbErr) {
            console.error(`❌ Pinecone Upsert Failed:`, dbErr.message);
            // Check if error is actually DIMENSION MISMATCH
        }
    } else {
        console.warn("⚠️ Batch resulted in 0 valid records. Skipping upsert.");
    }

    if (i + batchSize < entities.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const stats = await pineconeIndex.describeIndexStats();
  console.log(`\n✅ Vector store built! Total vectors: ${stats.totalRecordCount}`);
}

export { buildVectorStore, createEmbeddingText };
