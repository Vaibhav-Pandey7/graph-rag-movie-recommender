import { extractAllEntities } from "entityExtractor.js";
import { buildGraph } from "graphBuilder.js";
import { buildVectorStore } from "vectorStore.js";
import { closeConnections } from "config.js";

async function runIndexing(pdfPath) {
  console.log("===========================================");
  console.log("   🎬 GraphRAG Indexing Pipeline");
  console.log("===========================================\n");

  const startTime = Date.now();

  try {
    // ── STEP 1: Upload PDF + Extract Entities (Gemini) ──
    // Uploads PDF once, then asks for 50 movies per request
    // 1000 movies ÷ 50 = 20 API calls (not 1000!)
    console.log("── STEP 1: Extracting Entities (Gemini + PDF Upload) ──");
    const entities = await extractAllEntities(pdfPath);

    // ── STEP 2: Build Neo4j Graph ──
    console.log("\n── STEP 2: Building Graph (Neo4j) ──");
    await buildGraph(entities);

    // ── STEP 3: Build Vector Store ──
    console.log("\n── STEP 3: Building Vector Store (Pinecone) ──");
    await buildVectorStore(entities);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n===========================================");
    console.log(`   ✅ Indexing complete in ${elapsed}s`);
    console.log("===========================================");
  } catch (err) {
    console.error("\n❌ Indexing failed:", err.message);
    console.error(err.stack);
  } finally {
    await closeConnections();
  }
}

// Grab the 3rd argument from the command line (node script.js path)
const pdfPath = process.argv[2] || "data/movies.pdf"; 

if (!pdfPath) {
  console.error("Usage: node 7_runIndexing.js <path-to-pdf>");
  console.error("Example: node 7_runIndexing.js ./data/movies.pdf");
  process.exit(1);
}

runIndexing(pdfPath);