# 🎬 Hybrid GraphRAG Movie Knowledge Engine

An intelligent, terminal-based AI Agent that bridges the gap between Factual Knowledge Graphs (Neo4j) and Semantic Vector Databases (Pinecone). Powered by Google Gemini 2.5, this system doesn't just search—it reasons, routes, and fact-checks its own outputs.

## 🧠 The Engineering Journey: Why I Built This

Most AI tutorials teach simple Vector RAG, which fails horribly when asked factual questions (e.g., counting items or finding strict relationships). I built this system to master Enterprise AI Architecture by forcing a Graph Database and a Vector Database to work together. 

I designed this application around the "Black Box" architectural mindset, separating complex logic into distinct, specialized agents.

### The Core Architecture (The "Brains" of the System)

1. The Detective (entityResolver.js)
LLMs hallucinate. To fix this, the Detective extracts entities from the user's prompt and definitively matches them against the Neo4j database using exact and fuzzy matching. Before any routing happens, the system knows that "Nolan" refers to the Director node "Christopher Nolan".

2. The Traffic Cop (queryClassifier.js)
Not all queries belong in a Vector DB. This semantic router uses the resolved entities to classify the query. 
* The "Cyberpunk Vibe" Fallback: If a user asks for a concept not found in the strict Graph, the router acts as a safety net, intelligently bypassing the Graph and sending the query to the Vector DB for a semantic "vibe" search.

3. The Security Guard (cypherTemplates.js)
Zero-Shot Cypher Prevention. LLMs are never allowed to write raw database queries. The Architect LLM outputs a JSON plan, which this layer validates against a strict Whitelist of allowed labels and relationships. This guarantees no destructive operations can ever reach Neo4j.

4. The Hybrid Recommendation Engine (similarityHandler.js)
Pinecone is great at finding "vibes"; Neo4j is great at finding "facts". When asked for a recommendation, this engine asks Pinecone for the top 50 semantic matches, passes those to Neo4j to filter out hallucinations (dropping movies that don't share Genres/Themes with the anchor), and passes the clean list to the LLM for final ranking.

## 🛠️ Tech Stack

* Runtime: Node.js
* LLM & Embeddings: Google Gemini (gemini-2.5-flash, gemini-embedding-001) via LangChain
* Knowledge Graph: Neo4j (Factual data, shortest paths, strict filtering)
* Vector Database: Pinecone (Semantic search, unstructured text chunks)
* Architecture: Custom Agentic Workflow (Hybrid RAG, Semantic Routing, Whitelisted Execution)

## 🚀 Installation & Setup

1. Clone the repository:
git clone <your-repo-url>
cd <your-folder-name>

2. Install Dependencies:
npm install

3. Environment Variables:
Create a .env file in the root directory of your project and add your credentials:

NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=your_index_name
GEMINI_API_KEY=your_gemini_key

## 💻 Live Execution Examples

To start the agent and enter the interactive terminal, run:
npm run query

The system dynamically routes your questions based on intent:

1. Factual Aggregation (Graph Traversal)
User: "How many movies did Christopher Nolan direct?"
Engine: Routes to Neo4j -> Generates safe Cypher via templates -> Returns exact count.

2. Hybrid Recommendation (Vector Search + Graph Filtering)
User: "I want to watch a movie similar to Inception."
Engine: Identifies anchor -> Pinecone finds 50 candidates -> Neo4j filters by shared genres/themes -> LLM ranks the top 10.

3. Vibe Search (Pure Vector Fallback)
User: "Show me movies with a dark, cyberpunk vibe."
Engine: Concept unresolved in Graph -> Safely falls back to Pinecone semantic search -> Returns contextual recommendations.