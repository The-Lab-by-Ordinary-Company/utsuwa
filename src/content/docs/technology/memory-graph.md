---
title: Memory Graph
description: Interactive visualization of semantic memory connections
---

# Memory Graph

The Memory Graph is an interactive network visualization that shows how your companion's memories are semantically connected.

## Accessing the Memory Graph

Click the **brain icon** in the top-left corner of the main screen to open the Memory Graph in a full-screen modal.

## Understanding the Visualization

### Nodes (Memories)

Each node represents a stored memory (fact) about you, your relationship, or shared experiences.

**Node Colors:**
- **Cyan** — User facts (your preferences, background, attributes)
- **Pink** — Relationship facts (dynamics between you and the companion)
- **Teal** — Shared experiences (events you've discussed together)

### Connections

Lines between nodes indicate **semantic similarity** — memories that are related in meaning are connected. Animated particles flow along connections to visualize these relationships.

### Statistics

The bottom-left corner shows total memory count and number of connections in the current view.

## Interactions

### Selecting a Memory

Click any node to select it:
- The selected memory and its connections are highlighted
- Unrelated memories fade
- A detail panel appears on the right showing the full memory content, importance score, and reference count

### Filtering Categories

Use the category toggles in the top-left control panel to show/hide specific memory types. This helps focus on particular aspects of what your companion knows.

### Reset View

Click "Reset View" to zoom out and see the full graph, clearing any selection.

## Technical Details

The Memory Graph uses **384-dimensional embeddings** (via Transformers.js with the all-MiniLM-L6-v2 model) to compute semantic relationships between memories. Memories with a **cosine similarity > 0.5** are connected.

**Reference Count** tracks how many times a memory has been retrieved during conversations — higher counts indicate memories that frequently inform responses.

**Importance Score** (0-100) reflects how significant the memory is based on emotional content, personal details, and other heuristics.

### Requirements

- Memories must have embeddings to appear in the graph
- The embedding model is loaded automatically when you first chat
- Existing memories without embeddings can be backfilled via Settings > Developer

## Related

- [Companion System](/docs/technology/companion-system) — Full architecture including the three-tier memory system
- [Architecture Overview](/docs/technology/architecture) — System design and component interactions
