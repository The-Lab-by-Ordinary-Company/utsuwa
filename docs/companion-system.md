# Companion System V2 Architecture

## Overview

The Companion System V2 is a complete rewrite of the relationship and character state management system. The core design principle is: **the app is the game master** - it controls emotions, mood, relationship state, and the LLM is purely a dialogue generator that can suggest state changes via JSON.

## Design Principles

1. **App-Controlled State**: All character state is managed by the application. The LLM doesn't have internal state.
2. **Hybrid Updates**: App heuristics calculate baseline state changes; LLM can override mood and suggest additional changes via JSON.
3. **Graceful Degradation**: If the LLM fails to output valid JSON, the system works using heuristics alone.
4. **Multi-Axis Relationships**: Instead of a single affection score, relationships are tracked across 5 dimensions.
5. **Event-Driven Progression**: Milestone events trigger at specific relationship thresholds.
6. **Single Companion**: One unified character state combining persona metadata and stats. No multi-persona complexity.
7. **Dual Mode Operation**: Users can choose between Companion Mode (simple AI assistant) and Dating Sim Mode (full relationship mechanics).

## App Modes

Utsuwa supports two distinct modes that change how the companion system behaves:

### Companion Mode
- Simple AI assistant experience without relationship mechanics
- Relationship stage is locked to "Companion" (a special stage)
- No stat progression (affection, trust, intimacy, etc. remain static)
- Dating sim stage is preserved and restored when switching back
- Best for users who want a helpful assistant without dating sim elements

### Dating Sim Mode (Default)
- Full relationship mechanics enabled
- Progress through 8 relationship stages (Stranger → Soulmate)
- Stats change based on conversations and interactions
- Events trigger at milestones
- Best for users who want the full dating sim experience

### Mode Switching
When switching from Dating Sim to Companion Mode, the current relationship stage is saved to `savedDatingSimStage`. When switching back, this stage is restored so users don't lose progress.

```typescript
type AppMode = 'companion' | 'dating_sim';
```

## Data Models

### Character State

The central data structure tracking all relationship and character data. This is a **unified record** combining persona metadata (name, system prompt) with character stats (mood, energy, relationship levels).

```typescript
interface CharacterState {
  id?: number;

  // Persona fields (unified - no separate persona storage)
  name: string;
  systemPrompt: string;
  extensions: PersonaExtensions;

  // Mood with causality
  mood: MoodState;

  // Energy (0-100)
  energy: number;

  // Multi-axis relationship stats
  affection: number;  // 0-1000 (granular progression)
  trust: number;      // 0-100
  intimacy: number;   // 0-100
  comfort: number;    // 0-100
  respect: number;    // 0-100

  // App mode (companion vs dating_sim)
  appMode: AppMode;

  // Derived from stats
  relationshipStage: RelationshipStage;
  savedDatingSimStage?: RelationshipStage; // Preserved when switching to Companion Mode

  // Personality (can drift)
  personality: PersonalityProfile;

  // Temporal
  lastInteraction: Date | null;
  firstMet: Date;
  daysKnown: number;
  totalInteractions: number;
  currentStreak: number;
  longestStreak: number;
  streakLastDate: string | null;

  // Event tracking
  completedEvents: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Mood State

Tracks current emotional state with causality.

```typescript
interface MoodState {
  primary: Emotion;
  intensity: number;     // 0-100
  secondary?: Emotion;
  causes: string[];      // Why she feels this way (last 5)
}

type Emotion =
  | 'happy' | 'sad' | 'excited' | 'anxious'
  | 'content' | 'frustrated' | 'curious'
  | 'affectionate' | 'playful' | 'melancholy'
  | 'flustered' | 'neutral';
```

### Relationship Stages

Nine relationship stages: one special stage for Companion Mode, plus eight Dating Sim progression stages.

```typescript
type RelationshipStage =
  | 'companion'         // Special locked stage for Companion Mode
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'romantic_interest'
  | 'dating'
  | 'committed'
  | 'soulmate';
```

**Stage Requirements (Dating Sim Mode):**

| Stage | Affection | Trust | Intimacy | Comfort | Respect | Days Known | Interactions | Required Events |
|-------|-----------|-------|----------|---------|---------|------------|--------------|-----------------|
| Companion | - | - | - | - | - | - | - | (Companion Mode only) |
| Stranger | 0 | 0 | - | - | - | - | - | - |
| Acquaintance | 50 | 20 | - | - | - | - | 3 | - |
| Friend | 150 | 50 | - | - | - | 3 | 10 | - |
| Close Friend | 300 | 70 | - | 50 | - | 7 | 25 | - |
| Romantic Interest | 450 | 75 | 30 | - | - | 10 | - | first_deep_conversation, shared_vulnerability |
| Dating | 600 | 85 | 50 | - | - | 14 | - | confession_accepted |
| Committed | 800 | 95 | 75 | 80 | - | 30 | - | commitment_discussion |
| Soulmate | 950 | 100 | 90 | 95 | 90 | 60 | - | deep_bond_moment |

### State Updates

Delta-based updates applied to character state.

```typescript
interface StateUpdates {
  moodChange?: {
    emotion: Emotion;
    intensityDelta?: number;
    cause?: string;
  };
  energyDelta?: number;
  affectionDelta?: number;
  trustDelta?: number;
  intimacyDelta?: number;
  comfortDelta?: number;
  respectDelta?: number;
  newMemory?: string;
  newInsideJoke?: string;
  triggeredEvent?: string;
}
```

## Memory System

### Three-Tier Memory

1. **Working Memory** (in-memory): Last 20 conversation turns, current session context
2. **Facts** (IndexedDB): Extracted knowledge about the user
3. **Sessions** (IndexedDB): Summaries of past conversations

### Fact Structure

```typescript
interface Fact {
  id?: number;
  content: string;
  category: FactCategory;  // 'user' | 'relationship' | 'shared_experience'
  importance: number;      // 0-100, for retrieval ranking
  confidence: number;      // 0-1, how sure we are this is accurate
  source?: string;         // conversation or event that created this
  referenceCount: number;
  createdAt: Date;
  lastAccessed?: Date;
}

type FactCategory = 'user' | 'relationship' | 'shared_experience';
```

### Memory Sources

Facts are captured from two sources:

1. **LLM Observations**: The LLM can output a `new_memory` field in its JSON response with insights about the user (e.g., "User seems to prefer brief conversations"). These are automatically saved to IndexedDB.

2. **Pattern Extraction**: Regex patterns extract facts from user messages (e.g., "My name is...", "I work at...", "I like...").

### Memory Retrieval

When building prompts, the system retrieves:
- Recent turns from working memory
- Relevant facts by keyword search
- Triggered memories (high-importance facts matching conversation keywords)
- Recent session summaries (if returning after absence)

## Time-Based Recovery & Decay

When the app loads, it calculates hours since the last interaction and applies recovery or decay. This happens in `loadState()` in the character store.

### Energy Recovery

- **Full Recovery**: 6+ hours away = energy restored to 100
- **Partial Recovery**: Ratio-based (hours / 6), minimum 1 energy recovered per session
- Recovery starts immediately - no minimum threshold

```typescript
// From src/lib/engine/state-updates.ts
if (state.energy < 100) {
  if (hoursSinceLastInteraction >= 6) {
    updates.energyDelta = 100 - state.energy;
  } else {
    const recoveryRate = Math.min(1, hoursSinceLastInteraction / 6);
    const recovery = Math.ceil((100 - state.energy) * recoveryRate);
    updates.energyDelta = Math.max(1, recovery); // Always recover at least 1
  }
}
```

### Affection Decay

- **Threshold**: 48+ hours away
- **Rate**: 1-5% per session based on days away
- **Cap**: Maximum 50 affection lost per session

```typescript
if (hoursSinceLastInteraction > 48 && state.affection > 0) {
  const daysAway = Math.floor(hoursSinceLastInteraction / 24) - 2;
  const decayRate = Math.min(0.05, 0.01 * daysAway);
  const decay = Math.floor(state.affection * decayRate);
  updates.affectionDelta = -Math.min(decay, 50);
}
```

### Trust Decay

- **Threshold**: 7+ days (168 hours) away
- **Rate**: 2 trust per week away
- **Cap**: Maximum 10 trust lost per session

```typescript
if (hoursSinceLastInteraction > 168 && state.trust > 0) {
  const weeksAway = Math.floor(hoursSinceLastInteraction / 168);
  updates.trustDelta = -Math.min(weeksAway * 2, 10);
}
```

### Mood Shift

- **Threshold**: 3+ days (72 hours) away
- **Effect**: Mood shifts to 'melancholy'
- **Intensity**: Increases 5 per day away (max 30)
- **Cause**: "missing you"

```typescript
if (hoursSinceLastInteraction > 72) {
  updates.moodChange = {
    emotion: 'melancholy',
    intensityDelta: Math.min(30, Math.floor(hoursSinceLastInteraction / 24) * 5),
    cause: 'missing you'
  };
}
```

## Event System

### Event Definition

```typescript
interface EventDefinition {
  id: string;
  name: string;
  type: 'milestone' | 'random' | 'conditional';
  conditions: EventCondition[];
  scene: Scene;
  stateChanges?: Partial<StateUpdates>;
  unlocks?: string[];
  cooldownDays?: number;
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
| time_of_day | morning/afternoon/evening/night |
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
  intro?: string;        // Narration before dialogue
  dialogue?: string;     // What companion says
  choices?: SceneChoice[];
  outro?: string;        // Narration after
  expressionOverride?: string;
}

interface SceneChoice {
  text: string;          // Player's response option
  response?: string;     // Companion's response to choice
  stateChanges?: Partial<StateUpdates>;
}
```

### Event Categories

1. **Milestone Events**: First meeting, anniversaries, deep conversations, streak achievements
2. **Random Events**: Questions, compliments, memories, teases
3. **Romantic Events**: Confession, dates, commitment ceremonies
4. **Time-Based Events**: Morning greetings, late night chats, weekend vibes

## Prompt Architecture

### Layers

The system prompt is built from 5 layers:

```
<system>
  Rules, output format, current time
</system>

<character>
  Name, personality, background, speech patterns
</character>

<current_state>
  Mood (primary + secondary + causes)
  Energy level
  Relationship stage + stats
  Days known, total interactions
</current_state>

<memory>
  Recent conversation (last 6 turns)
  Relevant facts about user
  Session context (if returning)
</memory>

<instructions>
  Stage-specific behavior guidance
  Output format requirements (JSON block)
</instructions>
```

### LLM Output Format

The LLM is instructed to:
1. Respond naturally in character
2. Optionally output a JSON block with state updates

```json
{
  "mood_change": { "emotion": "happy", "intensity_delta": 10 },
  "affection_delta": 5,
  "trust_delta": 2,
  "new_memory": "User mentioned they like hiking"
}
```

## Heuristics Engine

### Message Analysis

Each user message is analyzed for:
- **Sentiment**: Positive/negative based on keyword matching
- **Topic Depth**: shallow/moderate/deep
- **Emotional Content**: Presence of emotional language
- **Questions**: Whether the message asks something

### Baseline Calculations

| Factor | Effect |
|--------|--------|
| Positive sentiment | +2 affection, +1 comfort |
| Deep topic | +2 intimacy, +1 trust, -2 energy |
| Emotional content | +2 intimacy, +1 trust, +1 affection |
| Questions asked | +1 respect, +1 trust |
| Non-linear affection | Fast early (1.5x), normal middle, slow late (0.7x) |
| Randomness | ±20% variance on all deltas |

### State Merging

When LLM provides JSON suggestions:
1. LLM mood change overrides baseline
2. LLM stat deltas are capped relative to baseline
3. Energy delta always comes from heuristics
4. Memory and event suggestions pass through

## Storage Architecture

All data is stored client-side in the browser using IndexedDB via Dexie.js. No server database required. No localStorage used for companion data.

### Database Schema (Dexie.js v2)

```typescript
// src/lib/db/index.ts
const db = new Dexie('utsuwa-db');

// Version 2: Single companion architecture
db.version(2).stores({
  characterStates: '++id, updatedAt',
  facts: '++id, category, importance, createdAt',
  sessions: '++id, startedAt',
  conversationTurns: '++id, sessionId, createdAt',
  completedEvents: '++id, eventId, completedAt'
});
```

**Note**: Version 1 had `personaId` indexes for multi-persona support. Version 2 removes these and uses a single-companion model. Migration automatically merges the first character state with persona data from localStorage.

### Data Export/Import

Users can export all their data as a JSON save file and import it later.

```typescript
// V2.0 SaveFile structure (src/lib/db/export.ts)
interface SaveFile {
  version: string;      // "2.0"
  exportedAt: string;
  appVersion: string;
  data: {
    character: CharacterState;  // Single unified record
    facts: Fact[];
    sessions: SessionSummary[];
    conversationTurns: ConversationTurn[];
    completedEvents: CompletedEventRecord[];
  };
}
```

**Legacy Import**: V1.x save files (with `characterStates[]`, `personas[]`, `companion[]`) are automatically migrated to V2.0 format on import.

## Interaction Flow

```
User sends message
    ↓
[App] Calculate baseline state updates (heuristics.ts)
    ↓
[App] Retrieve relevant memories (memory.ts)
    ↓
[App] Build prompt with context (prompt-builder.ts)
    ↓
[LLM] Generate response
    ↓
[App] Parse response + JSON (response-parser.ts)
    ↓
[App] Merge LLM suggestions with baseline (state-updates.ts)
    ↓
[App] Apply state updates (character store)
    ↓
[App] Check stage transitions (stages.ts)
    ↓
[App] Check event triggers (events.ts)
    ↓
[App] If event triggered, present scene (EventScene.svelte)
    ↓
[App] Save state to IndexedDB
    ↓
[UI] Display response + trigger talking animation + update status
```

## File Structure

```
src/lib/
├── types/
│   ├── character.ts      # CharacterState, MoodState, RelationshipStage
│   ├── memory.ts         # Fact, Session, ConversationTurn, WorkingMemory
│   └── events.ts         # EventDefinition, Scene, SceneChoice, conditions
├── stores/
│   ├── character.svelte.ts  # Svelte 5 runes store (unified persona + stats)
│   ├── persona.svelte.ts    # Thin wrapper delegating to character store
│   └── vrm.svelte.ts        # VRM model and animation state
├── db/
│   ├── index.ts          # Dexie database v2 (IndexedDB)
│   └── export.ts         # Save file export/import (v2.0)
├── engine/
│   ├── stages.ts         # Stage requirements, behaviors, instructions
│   ├── state-updates.ts  # Apply deltas, time decay/recovery, transitions
│   ├── heuristics.ts     # Message analysis, baseline calculations
│   ├── memory.ts         # Working memory, retrieval
│   └── events.ts         # Condition checking, event API
├── ai/
│   ├── prompt-builder.ts # Multi-layer prompt construction
│   └── response-parser.ts # Extract dialogue + JSON
├── data/
│   └── events/
│       ├── milestones.ts     # Milestone events
│       ├── random.ts         # Random events
│       ├── romantic.ts       # Romantic events
│       ├── time-based.ts     # Time-based events
│       └── index.ts          # Exports all events
└── components/events/
    ├── EventScene.svelte    # Scene presentation
    ├── ChoiceDialog.svelte  # Choice buttons
    └── index.ts
```

## Self-Hosting Guide

### Requirements

- Node.js 18+
- npm or pnpm
- Modern browser (Chrome, Firefox, Safari, Edge)

No database setup required - all data is stored in the browser's IndexedDB.

### Installation

```bash
# Clone the repository
git clone https://github.com/dyascj/utsuwa.git
cd utsuwa

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

### Docker (Optional)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
```

## Extension Guide

### Adding New Stats

1. Add field to `CharacterState` interface in `types/character.ts`
2. Add to Dexie schema in `db/index.ts` (increment version if needed)
3. Add delta field to `StateUpdates` interface
4. Add bounds checking in `state-updates.ts`
5. Update prompt builder if stat affects behavior

### Adding New Events

1. Create event definition in appropriate file under `data/events/`
2. Export from `data/events/index.ts`
3. Define conditions using existing condition types
4. Add scene with dialogue and optional choices
5. Set appropriate priority, cooldown, and one-time flag

### Adding New Emotions

1. Add to `Emotion` type in `types/character.ts`
2. Add to `MOOD_INFO` constant with display info
3. Add to `VALID_EMOTIONS` array in `response-parser.ts`
4. Update prompt instructions if emotion has specific behavior

### Adding Condition Types

1. Add to `EventCondition` union type in `types/events.ts`
2. Add case in `checkCondition` function in `engine/events.ts`
3. Document in this file

## Data Persistence

All data is stored locally in the browser using IndexedDB via Dexie.js:

- **Character State**: Unified persona + stats record
- **Facts**: Long-term memories about the user
- **Sessions**: Conversation summaries
- **Conversation Turns**: Individual messages
- **Completed Events**: Event history

**API Keys**: Stored in localStorage (never exported in save files)

### Backup & Restore

Use Settings > Data to:
- **Export Save**: Download a JSON file with all your data
- **Import Save**: Restore from a save file (Replace or Merge modes)

Save files include character state (with persona), facts, sessions, conversation history, and completed events.
