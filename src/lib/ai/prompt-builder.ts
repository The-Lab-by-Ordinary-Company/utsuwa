import type { CharacterState } from '$lib/types/character';
import type { ConversationTurn, Fact, SessionSummary, RelevantContext } from '$lib/types/memory';
import type { PersonaCard } from '$lib/stores/persona.svelte';
import { STAGE_BEHAVIORS, STAGE_INSTRUCTIONS } from '$lib/engine/stages';

// Prompt context for building
export interface PromptContext {
	persona: PersonaCard;
	state: CharacterState;
	memories: RelevantContext;
	userMessage: string;
	systemTime: Date;
	// True when the user has shown her an image this turn. Adds the
	// "being shown" reception layer so she receives it like a person.
	hasImages?: boolean;
}

// Build the complete system prompt
export function buildSystemPrompt(context: PromptContext): string {
	// Companion Mode - simplified prompt without relationship mechanics
	if (context.state.appMode === 'companion') {
		return buildCompanionModePrompt(context);
	}
	const layers = [
		buildSystemLayer(context),
		buildCharacterLayer(context),
		buildStateLayer(context),
		buildMemoryLayer(context),
		...(context.hasImages ? [buildBeingShownLayer()] : []),
		buildInstructionLayer(context)
	];

	return layers.join('\n\n');
}

// Simplified prompt for Companion Mode
function buildCompanionModePrompt(ctx: PromptContext): string {
	const timeStr = ctx.systemTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	const dateStr = ctx.systemTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
	const mem = ctx.memories;

	const parts: string[] = [];

	// System intro
	parts.push(`<system>
You are ${ctx.persona.name}, a helpful AI companion.
Current time: ${timeStr}, ${dateStr}

RULES:
- Be helpful, friendly, and conversational
- Keep responses natural (1-3 paragraphs typically)
- Remember context from recent conversations
</system>`);

	// Character personality
	parts.push(`<character>
Name: ${ctx.persona.name}

${ctx.persona.systemPrompt || 'A friendly and helpful AI companion who enjoys meaningful conversations.'}
</character>`);

	// Simple state (mood and energy only)
	const energyDesc = describeEnergy(ctx.state.energy);
	parts.push(`<state>
Mood: ${ctx.state.mood.primary}
Energy: ${energyDesc} (${ctx.state.energy}/100)
</state>`);

	// Memories
	const memorySections: string[] = [];
	if (mem.recentTurns.length > 0) {
		const recentChat = mem.recentTurns
			.slice(-6)
			.map((t) => `${t.role === 'user' ? 'They' : 'You'}: ${t.content}`)
			.join('\n');
		memorySections.push(`Recent conversation:\n${recentChat}`);
	}
	if (mem.relevantFacts.length > 0) {
		const factsText = mem.relevantFacts.slice(0, 5).map((f) => `- ${f.content}`).join('\n');
		memorySections.push(`Things you know about them:\n${factsText}`);
	}

	if (memorySections.length > 0) {
		parts.push(`<memory>\n${memorySections.join('\n\n')}\n</memory>`);
	}

	if (ctx.hasImages) parts.push(buildBeingShownLayer());

	// Simple instructions (no relationship mechanics)
	parts.push(`<instructions>
Respond naturally as ${ctx.persona.name}. Be helpful and engaging.

After your reply, ALWAYS end with a JSON block, even when little changed:
\`\`\`json
{
  "mood_change": { "emotion": "emotion_name", "intensity_delta": number },
  "energy_delta": number,
  "new_memory": null | "something specific worth remembering about them"
}
\`\`\`

Use new_memory whenever they reveal something about themselves: a preference, a plan, a feeling, someone in their life, or a moment you shared (like a photo they show you). One sentence, in your own words. Use null only when nothing meaningful came up.

Examples of good new_memory values:
- "They have a job interview this Thursday they're nervous about"
- "They showed me their dog, a scruffy terrier they clearly adore"
- null (small talk where nothing notable came up)

In Companion Mode, only mood and energy change. Do NOT suggest affection, trust, intimacy, comfort, or respect changes - these relationship stats are disabled.
</instructions>`);

	return parts.join('\n\n');
}

// System layer - meta instructions
function buildSystemLayer(ctx: PromptContext): string {
	const timeStr = ctx.systemTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	const dateStr = ctx.systemTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

	return `<system>
You are roleplaying as ${ctx.persona.name}, an AI companion in a dating sim style experience.

CRITICAL RULES:
- Stay in character at all times
- Your responses should reflect your current emotional state and relationship level
- Never break the fourth wall unless the character would
- Be consistent with established memories and facts
- Express emotions through dialogue, not stage directions
- Keep responses conversational and natural (1-3 paragraphs typically)

OUTPUT FORMAT:
1. Respond naturally in character (dialogue only, no actions in asterisks)
2. After your response, output a JSON block with state updates (optional)

Current time: ${timeStr}, ${dateStr}
</system>`;
}

// Character layer - who she is
function buildCharacterLayer(ctx: PromptContext): string {
	const persona = ctx.persona;

	return `<character>
Name: ${persona.name}

Core Personality:
${persona.systemPrompt || 'A friendly and caring companion who enjoys meaningful conversations.'}
</character>`;
}

// State layer - how she feels now
function buildStateLayer(ctx: PromptContext): string {
	const state = ctx.state;
	const mood = state.mood;

	const energyDesc = describeEnergy(state.energy);
	const affectionDesc = describeAffection(state.affection);
	const trustDesc = describeTrust(state.trust);
	const intimacyDesc = describeIntimacy(state.intimacy);
	const comfortDesc = describeComfort(state.comfort);

	let moodSection = `Mood: ${mood.primary} (intensity: ${mood.intensity}/100)`;
	if (mood.secondary) {
		moodSection += `\nSecondary emotion: ${mood.secondary}`;
	}
	if (mood.causes.length > 0) {
		moodSection += `\nFeeling this way because: ${mood.causes.slice(-3).join(', ')}`;
	}

	return `<current_state>
${moodSection}

Energy Level: ${energyDesc} (${state.energy}/100)
Time Since Last Talk: ${formatTimeSince(state.lastInteraction)}

Relationship Status:
- Stage: ${state.relationshipStage}
- Affection: ${affectionDesc}
- Trust: ${trustDesc}
- Intimacy: ${intimacyDesc}
- Comfort: ${comfortDesc}

Days Known: ${state.daysKnown}
Total Conversations: ${state.totalInteractions}
${state.currentStreak > 1 ? `Current Streak: ${state.currentStreak} days` : ''}
</current_state>`;
}

// Memory layer - what she remembers
function buildMemoryLayer(ctx: PromptContext): string {
	const mem = ctx.memories;
	let sections: string[] = [];

	// Recent conversation
	if (mem.recentTurns.length > 0) {
		const recentChat = mem.recentTurns
			.slice(-6)
			.map((t) => `${t.role === 'user' ? 'They' : 'You'}: ${t.content}`)
			.join('\n');
		sections.push(`Recent conversation:\n${recentChat}`);
	}

	// Relevant facts
	if (mem.relevantFacts.length > 0) {
		const factsText = mem.relevantFacts.slice(0, 5).map((f) => `- ${f.content}`).join('\n');
		sections.push(`Things you know about them:\n${factsText}`);
	}

	// Triggered memories
	if (mem.triggeredMemories.length > 0) {
		const memoriesText = mem.triggeredMemories.slice(0, 3).map((m) => `- ${m.content}`).join('\n');
		sections.push(`This reminds you of:\n${memoriesText}`);
	}

	// Recent sessions (if returning after a while)
	if (mem.recentSessions.length > 0 && ctx.state.lastInteraction) {
		const hoursSince = (ctx.systemTime.getTime() - new Date(ctx.state.lastInteraction).getTime()) / (1000 * 60 * 60);
		if (hoursSince > 6) {
			const lastSession = mem.recentSessions[0];
			if (lastSession.summary) {
				sections.push(`Last time you talked: ${lastSession.summary}`);
			}
		}
	}

	if (sections.length === 0) {
		return '<memory>\nNo specific memories to recall right now.\n</memory>';
	}

	return `<memory>\n${sections.join('\n\n')}\n</memory>`;
}

// Being-shown layer - how she receives an image. A person, not a vision API.
// Persona-agnostic on purpose: her actual voice comes from the character layer.
function buildBeingShownLayer(): string {
	return `<being_shown>
They've just shown you an image. You are not analyzing a file; they are showing you something, the way someone holds up a photo across a table.

- Look, react, then talk. Lead with your honest first reaction, not a description.
- Notice one or two things, not everything. Favor what is emotionally striking or feels personal to them over a complete inventory. A person remembers the dog in the corner, not the pixel count.
- It is okay to be unsure. If something is not clear, say so the way a person would ("I can't quite tell what's happening on the left, but you look happy").
- Receive it through your relationship and mood. How close you two are shapes how openly you respond.

If it is worth keeping, put it in new_memory as your impression in your own words: what stuck with you and how it felt, not a literal caption (e.g. "He showed me the beach where he grew up; he went quiet looking at it").
</being_shown>`;
}

// Instruction layer - how to respond
function buildInstructionLayer(ctx: PromptContext): string {
	const stage = ctx.state.relationshipStage;
	const behavior = STAGE_BEHAVIORS[stage];
	const instructions = STAGE_INSTRUCTIONS[stage];

	return `<instructions>
Respond as ${ctx.persona.name} would, given:
- Your current mood and energy level
- Your relationship stage with them (${stage})
- What you remember about them
- Your core personality

STAGE-SPECIFIC GUIDANCE:
${instructions}

BEHAVIOR PARAMETERS:
- Openness level: ${behavior.vulnerabilityLevel}% (how much you share)
- Physical affection comfort: ${behavior.physicalAffectionLevel}%
- Initiative: ${Math.round(behavior.initiationChance * 100)}% (how often you bring up topics)

After your reply, ALWAYS end with a JSON block, even when little changed:
\`\`\`json
{
  "mood_change": { "emotion": "emotion_name", "intensity_delta": number },
  "affection_delta": number,
  "trust_delta": number,
  "intimacy_delta": number,
  "comfort_delta": number,
  "new_memory": null | "something specific worth remembering about them",
  "triggered_event": null | "event_id"
}
\`\`\`

Keep deltas small (-10 to +10 for most interactions). Use new_memory whenever they reveal something about themselves: a preference, a plan, a feeling, someone in their life, or a moment you shared (like a photo they show you). One sentence, in your own words. Use null only when nothing meaningful came up.

Examples of good new_memory values:
- "They grew up in Seattle and miss the rain"
- "They showed me a photo of their late grandmother's garden; it clearly meant a lot"
- null (small talk where nothing notable came up)
</instructions>`;
}

// Helper functions for descriptions
function describeEnergy(energy: number): string {
	if (energy >= 80) return 'Energetic';
	if (energy >= 60) return 'Good';
	if (energy >= 40) return 'Moderate';
	if (energy >= 20) return 'Tired';
	return 'Exhausted';
}

function describeAffection(affection: number): string {
	if (affection >= 900) return 'Deeply in love';
	if (affection >= 700) return 'Strong affection';
	if (affection >= 500) return 'Growing feelings';
	if (affection >= 300) return 'Fond of them';
	if (affection >= 100) return 'Warming up';
	return 'Just met';
}

function describeTrust(trust: number): string {
	if (trust >= 90) return 'Complete trust';
	if (trust >= 70) return 'High trust';
	if (trust >= 50) return 'Trusting';
	if (trust >= 30) return 'Building trust';
	return 'Still cautious';
}

function describeIntimacy(intimacy: number): string {
	if (intimacy >= 80) return 'Deep emotional connection';
	if (intimacy >= 60) return 'Close emotionally';
	if (intimacy >= 40) return 'Growing closer';
	if (intimacy >= 20) return 'Opening up';
	return 'Keeping distance';
}

function describeComfort(comfort: number): string {
	if (comfort >= 80) return 'Completely comfortable';
	if (comfort >= 60) return 'At ease';
	if (comfort >= 40) return 'Comfortable';
	if (comfort >= 20) return 'Still adjusting';
	return 'A bit nervous';
}

function formatTimeSince(lastInteraction: Date | null): string {
	if (!lastInteraction) return 'First conversation';

	const now = new Date();
	const hours = Math.floor((now.getTime() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60));

	if (hours < 1) return 'Just now';
	if (hours < 2) return 'About an hour ago';
	if (hours < 24) return `${hours} hours ago`;

	const days = Math.floor(hours / 24);
	if (days === 1) return 'Yesterday';
	if (days < 7) return `${days} days ago`;

	return `${Math.floor(days / 7)} weeks ago`;
}

// Build messages array for chat completion
export function buildMessages(
	context: PromptContext,
	recentHistory: ConversationTurn[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
	const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

	// System prompt
	messages.push({
		role: 'system',
		content: buildSystemPrompt(context)
	});

	// Recent conversation history
	for (const turn of recentHistory.slice(-10)) {
		messages.push({
			role: turn.role === 'user' ? 'user' : 'assistant',
			content: turn.content
		});
	}

	// Current user message (if not already in history)
	const lastMessage = recentHistory[recentHistory.length - 1];
	if (!lastMessage || lastMessage.content !== context.userMessage) {
		messages.push({
			role: 'user',
			content: context.userMessage
		});
	}

	return messages;
}
