import type { CompiledSegment } from './speech-compiler.ts';
import type { SpeechSegment } from '../voice-orchestrator.ts';
import type { VoiceOrchestrator } from '../voice-orchestrator.ts';
import type { TTSOptions } from './index.ts';

export interface GestureStore {
	active: boolean;
	type?: string;
}

export interface SubtitleStore {
	visible: boolean;
	text?: string;
	language?: string;
}

export interface SchedulerStores {
	gesture: GestureStore;
	subtitle: SubtitleStore;
}

/**
 * Thin adapter: translates CompiledSegment[] into VoiceOrchestrator calls
 * and publishes gesture/subtitle events to Svelte stores.
 *
 * The VoiceOrchestrator handles:
 *  - Pipelining (synth N+1 while play N)
 *  - Interrupt handling
 *  - Audio context management
 *  - Voice mapping (language → voiceId + instructions)
 */
export class SpeechScheduler {
	private orchestrator: VoiceOrchestrator;
	private storeGesture: GestureStore;
	private storeSubtitle: SubtitleStore;
	private timers: ReturnType<typeof setTimeout>[] = [];
	private abortController: AbortController | null = null;

	constructor(orchestrator: VoiceOrchestrator) {
		this.orchestrator = orchestrator;
		this.storeGesture = { active: false };
		this.storeSubtitle = { visible: false };
	}

	getStores(): SchedulerStores {
		return {
			gesture: this.storeGesture,
			subtitle: this.storeSubtitle
		};
	}

	async beginPlan(segments: CompiledSegment[], options: TTSOptions): Promise<void> {
		this.abortController = new AbortController();
		this.clearTimers();

		this.orchestrator.beginSession(options, {
			onSegmentStart: (segment: SpeechSegment) => {
				this.storeSubtitle.text = segment.text;
			},
			onComplete: () => {
				this.storeSubtitle.visible = false;
				this.clearTimers();
			}
		});

		for (const seg of segments) {
			if (this.abortController.signal.aborted) break;

			if (seg.type === 'gesture') {
				this.scheduleGesture(seg);
				continue;
			}

			if (seg.type === 'pause') {
				if (seg.durationMs && seg.durationMs > 0) {
					await this.delay(seg.durationMs);
				}
				continue;
			}

			// speak
			this.storeSubtitle.visible = true;
			this.storeSubtitle.text = seg.text;
			this.storeSubtitle.language = seg.language;

			this.orchestrator.pushSegment({
				text: seg.text ?? '',
				language: seg.language
			});
		}

		if (this.abortController.signal.aborted) return;
		await this.orchestrator.endSession();
	}

	interrupt(): void {
		this.abortController?.abort();
		this.orchestrator.interrupt();
		this.storeSubtitle.visible = false;
		this.clearTimers();
	}

	private scheduleGesture(seg: CompiledSegment): void {
		if (this.abortController?.signal.aborted) return;

		this.storeGesture.active = true;
		this.storeGesture.type = seg.gestureType;

		const duration = seg.durationMs ?? 1500;
		const timer = setTimeout(() => {
			if (this.abortController?.signal.aborted) return;
			this.storeGesture.active = false;
		}, duration);
		this.timers.push(timer);
	}

	private clearTimers(): void {
		for (const t of this.timers) {
			clearTimeout(t);
		}
		this.timers = [];
		this.storeGesture.active = false;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => {
			const signal = this.abortController?.signal;
			if (signal?.aborted) {
				resolve();
				return;
			}

			const timer = setTimeout(resolve, ms);
			this.timers.push(timer);

			signal?.addEventListener(
				'abort',
				() => {
					clearTimeout(timer);
					resolve();
				},
				{ once: true }
			);
		});
	}
}
