---
title: Companion System
description: Architecture documentation for Utsuwa's companion relationship and character state system.
---

# Companion System Architecture

## Overview

The Companion System is the core engine that manages relationship state, character emotions, memory, and event progression. The key design principle: **the app is the game master** — it controls emotions, mood, relationship state, and the LLM is purely a dialogue generator that can suggest state changes via JSON.

## Design Principles

1. **App-Controlled State** — All character state is managed by the application. The LLM doesn't have internal state.
2. **Hybrid Updates** — App heuristics calculate baseline state changes; the LLM can override mood and suggest additional changes via JSON.
3. **Graceful Degradation** — If the LLM fails to output valid JSON, the system works using heuristics alone.
4. **Multi-Axis Relationships** — Instead of a single affection score, relationships are tracked across 5 dimensions.
5. **Event-Driven Progression** — Milestone events trigger at specific relationship thresholds.
6. **Single Companion** — One unified character state combining persona metadata and stats.
7. **Dual Mode Operation** — Users can choose between Companion Mode (simple assistant) and Dating Sim Mode (full relationship mechanics).

## App Modes

Utsuwa supports two distinct modes:

### Companion Mode

- Simple AI assistant experience without relationship mechanics
- Relationship stage is locked to "Companion"
- No stat progression — affection, trust, intimacy, etc. remain static
- Dating sim stage is preserved and restored when switching back

### Dating Sim Mode (Default)

- Full relationship mechanics enabled
- Progress through 8 relationship stages (Stranger to Soulmate)
- Stats change based on conversations and interactions
- Events trigger at milestones

When switching from Dating Sim to Companion Mode, the current relationship stage is saved to `savedDatingSimStage`. Switching back recalculates the relationship stage from current stats.

## Data Models

### Character State

The central data structure tracking all relationship and character data. A unified record combining persona metadata with character stats.

```typescript
interface CharacterState {
  id?: number;
  name: string;
  systemPrompt: string;
  extensions: PersonaExtensions;
  mood: MoodState;
  energy: number;              // 0-100
  affection: number;           // 0-1000
  trust: number;               // 0-100
  intimacy: number;            // 0-100
  comfort: number;             // 0-100
  respect: number;             // 0-100
  appMode: AppMode;
  relationshipStage: RelationshipStage;
  savedDatingSimStage?: RelationshipStage;
  personality: PersonalityProfile;
  lastInteraction: Date | null;
  firstMet: Date;
  daysKnown: number;
  totalInteractions: number;
  currentStreak: number;
  longestStreak: number;
  streakLastDate: string | null;
  completedEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Mood State

Tracks current emotional state with causality — the system remembers *why* the companion feels a certain way.

```typescript
interface MoodState {
  primary: Emotion;
  intensity: number;     // 0-100
  secondary?: Emotion;
  causes: string[];      // Last 5 causes
}

type Emotion =
  | 'happy' | 'sad' | 'excited' | 'anxious'
  | 'content' | 'frustrated' | 'curious'
  | 'affectionate' | 'playful' | 'melancholy'
  | 'flustered' | 'neutral';
```

### Relationship Stages

Nine stages total — one special Companion Mode stage (not part of progression) plus eight Dating Sim progression stages (Stranger through Soulmate).

```typescript
type RelationshipStage =
  | 'companion'
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'romantic_interest'
  | 'dating'
  | 'committed'
  | 'soulmate';
```

### Stage Requirements (Dating Sim Mode)

| Stage | Affection | Trust | Intimacy | Comfort | Respect | Days Known | Interactions | Required Events |
|-------|-----------|-------|----------|---------|---------|------------|--------------|-----------------|
| Stranger | 0 | 0 | - | - | - | - | - | - |
| Acquaintance | 50 | 20 | - | - | - | - | 3 | - |
| Friend | 150 | 50 | - | - | - | 3 | 10 | - |
| Close Friend | 300 | 70 | - | 50 | - | 7 | 25 | - |
| Romantic Interest | 450 | 75 | 30 | - | - | 10 | - | first_deep_conversation, shared_vulnerability |
| Dating | 600 | 85 | 50 | - | - | 14 | - | confession_accepted |
| Committed | 800 | 95 | 75 | 80 | - | 30 | - | commitment_discussion |
| Soulmate | 950 | 100 | 90 | 95 | 90 | 60 | - | deep_bond_moment |

## Memory System

### Three-Tier Memory

1. **Working Memory** (in-memory) — Last 20 conversation turns, current session context
2. **Facts** (IndexedDB) — Extracted knowledge about the user, indexed with vector embeddings
3. **Sessions** (IndexedDB) — Summaries of past conversations

### Semantic Memory Search

Facts are indexed using vector embeddings for semantic similarity search. Instead of keyword matching, the system finds facts by meaning — "outdoor activities" can retrieve memories about hiking even without shared words.

**How it works:**
- Uses Transformers.js with the `all-MiniLM-L6-v2` model (~23MB, runs locally)
- Embeddings are 384-dimensional vectors stored alongside facts in IndexedDB
- On query, the user message is embedded and compared using cosine similarity
- Results ranked by blending semantic similarity (70%) with importance score (30%), minimum similarity 0.3
- Triggered memories (keyword-based re-search) use a different blend: 60% similarity / 40% importance, minimum similarity 0.5
- Falls back to keyword search if the embedding model fails to load

**Performance:**
- Model loads in 2-5 seconds (cached after first load)
- Embedding generation: 10-50ms per fact
- Similarity search: under 10ms even with thousands of facts
- Storage: ~1.5KB per fact for embeddings

### Fact Structure

```typescript
interface Fact {
  id?: number;
  content: string;
  category: FactCategory;  // 'user' | 'relationship' | 'shared_experience'
  importance: number;       // 0-100
  confidence: number;       // 0-1
  source?: string;
  referenceCount: number;
  createdAt: Date;
  lastAccessed?: Date;
  embedding?: number[];     // 384-dim vector
}
```

### Memory Sources

Facts are captured from two sources:

1. **LLM Observations** — The LLM can output a `new_memory` field in its JSON response with insights about the user. These are automatically saved.
2. **Pattern Extraction** — Regex patterns extract facts from user messages (e.g., "My name is...", "I work at...", "I like...").

### Memory Retrieval

When building prompts, the system retrieves:
- Recent turns from working memory
- Relevant facts by semantic similarity search (falls back to keyword search)
- Triggered memories (high-importance facts semantically related to conversation)
- Recent session summaries (if returning after absence)

## Time-Based Recovery and Decay

When the app loads, it calculates hours since the last interaction and applies recovery or decay.

### Energy Recovery

- **Full recovery** — 6+ hours away restores energy to 100
- **Partial recovery** — Ratio-based (hours / 6), minimum 1 energy per session

### Affection Decay

- **Threshold** — 48+ hours away
- **Rate** — 1-5% per session based on days away
- **Cap** — Maximum 50 affection lost per session

### Trust Decay

- **Threshold** — 7+ days away
- **Rate** — 2 trust per week away
- **Cap** — Maximum 10 trust lost per session

### Mood Shift

- **Threshold** — 3+ days away
- **Effect** — Mood shifts to melancholy
- **Intensity** — Increases 5 per day away (max 30)

## Event System

### Event Definition

```typescript
interface EventDefinition {
  id: string;
  name: string;
  type: 'milestone' | 'random' | 'scheduled' | 'conditional' | 'anniversary';
  conditions: EventCondition[];
  scene?: Scene;
  stateChanges?: Partial<StateUpdates>;
  unlocks?: string[];
  achievementId?: string;
  cooldownDays?: number;
  lastTriggered?: Date;
  oneTime: boolean;
  priority: number;
}
```

### Condition Types

| Condition | Description |
|-----------|-------------|
| min_affection | Minimum affection level |
| min_trust | Minimum trust level |
| min_intimacy | Minimum intimacy level |
| min_comfort | Minimum comfort level |
| min_respect | Minimum respect level |
| max_energy | Maximum energy (for tired events) |
| relationship_stage | Exact stage match |
| relationship_stage_min | Minimum stage |
| days_known | Minimum days known |
| total_interactions | Minimum chat count |
| event_completed | Prerequisite event |
| event_not_completed | Event not yet triggered |
| time_of_day | morning / afternoon / evening / night |
| day_of_week | 0-6 (Sunday-Saturday) |
| random_chance | Probability (0-1) |
| keyword_mentioned | Word in message |
| mood_is | Specific mood |
| mood_intensity_min | Minimum intensity |
| consecutive_days | Minimum streak |
| hours_since_last_interaction_min | Time away minimum |
| hours_since_last_interaction_max | Time away maximum |

### Scene Structure

```typescript
interface Scene {
  id: string;
  intro?: string;
  dialogue?: string;
  choices?: SceneChoice[];
  outro?: string;
  backgroundChange?: string;
  expressionOverride?: string;
  musicCue?: string;
}

interface SceneChoice {
  text: string;
  response: string;
  stateChanges: Partial<StateUpdates>;
  nextSceneId?: string;
  unlocks?: string[];
}
```

### Event Categories

Events are organized by type (`milestone`, `random`, `scheduled`, `conditional`, `anniversary`), and grouped into four files:

1. **Milestone Events** — First meeting, anniversaries, deep conversations, streak achievements
2. **Random Events** — Questions, compliments, memories, teases
3. **Romantic Events** — Confession, dates, commitment ceremonies
4. **Time-Based Events** — Morning greetings, late night chats, weekend vibes

## Prompt Architecture

The system prompt is built from 5 layers:

1. **System** — Rules, output format, current time
2. **Character** — Name, personality, background, speech patterns
3. **Current State** — Mood, energy, relationship stage and stats, days known
4. **Memory** — Recent conversation turns, relevant facts, session context
5. **Instructions** — Stage-specific behavior guidance, JSON output format

### LLM Output Format

The LLM responds naturally in character, then optionally outputs a JSON block with state updates:

```json
{
  "mood_change": { "emotion": "happy", "intensity_delta": 10 },
  "affection_delta": 5,
  "trust_delta": 2,
  "intimacy_delta": 3,
  "comfort_delta": 1,
  "respect_delta": 0,             // supported by parser, not in prompt template
  "new_memory": "User mentioned they like hiking",
  "new_inside_joke": "optional string (parsed but not yet implemented)",
  "triggered_event": "optional_event_id"
}
```

## Heuristics Engine

### Message Analysis

Each user message is analyzed for:
- **Sentiment** — Positive/negative based on keyword matching
- **Topic Depth** — Shallow, moderate, or deep
- **Emotional Content** — Presence of emotional language
- **Questions** — Whether the message asks something

### Baseline Calculations

| Factor | Effect |
|--------|--------|
| Positive sentiment | +2 affection, +1 comfort |
| Negative sentiment | -1 affection, -1 comfort |
| Deep topic | +2 affection, +2 intimacy, +1 trust, -2 energy |
| Moderate topic | +1 affection, +1 intimacy, -1 energy |
| Shallow topic | -1 comfort |
| Emotional content | +2 intimacy, +1 trust, +1 affection |
| Questions asked | +1 respect, +1 trust |
| Non-linear affection | Fast early (1.5x), normal middle, slow late (0.7x) |
| Randomness | +/-20% variance on all deltas |

### State Merging

When the LLM provides JSON suggestions:
1. LLM mood change overrides baseline mood entirely
2. LLM affection delta is capped at ±2x the baseline magnitude (minimum cap of ±5)
3. LLM trust delta is capped at ±2x the baseline magnitude (minimum cap of ±3)
4. LLM intimacy/comfort/respect deltas are clamped to [-3, 5]
5. Energy delta always comes from heuristics (LLM cannot change energy)
6. Memory and event suggestions pass through unchanged

## Interaction Flow

```
User sends message
    |
[App] Calculate baseline state updates (heuristics)
    |
[App] Retrieve relevant memories
    |
[App] Build prompt with context
    |
[LLM] Generate response
    |
[App] Parse response + JSON
    |
[App] Merge LLM suggestions with baseline
    |
[App] Apply state updates
    |
[App] Check stage transitions
    |
[App] Check event triggers
    |
[App] If event triggered, present scene
    |
[App] Save state to IndexedDB
    |
[UI] Display response + trigger animation
```

## Storage

All data is stored client-side on the user's device using IndexedDB via Dexie.js.

### Database Schema

```typescript
const db = new Dexie('utsuwa-db');

// v2: Single character model (migrated from v1 multi-persona)
db.version(2).stores({
  characterStates: '++id, updatedAt',
  facts: '++id, category, importance, createdAt',
  sessions: '++id, startedAt',
  conversationTurns: '++id, sessionId, createdAt',
  completedEvents: '++id, eventId, completedAt',
  companion: null  // Delete legacy table
});

// v3: Added optional 384-dim embedding vectors to facts
db.version(3).stores({
  characterStates: '++id, updatedAt',
  facts: '++id, category, importance, createdAt',
  sessions: '++id, startedAt',
  conversationTurns: '++id, sessionId, createdAt',
  completedEvents: '++id, eventId, completedAt'
});
```

### Data Export/Import

Users can export all data as a JSON save file. Vector embeddings are stripped from exports (they're regenerated on import).

```typescript
interface SaveFile {
  version: string;      // "2.0"
  exportedAt: string;
  appVersion: string;
  data: {
    character: CharacterState;
    facts: Fact[];
    sessions: SessionSummary[];
    conversationTurns: ConversationTurn[];
    completedEvents: CompletedEventRecord[];
  };
}
```
