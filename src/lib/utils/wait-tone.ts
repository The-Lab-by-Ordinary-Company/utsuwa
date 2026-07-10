export interface WaitToneController {
	start: () => void;
	stop: () => void;
	destroy: () => void;
}

const DEFAULT_PING_MS = 2200;
const NOTE_A_FREQ = 400;
const NOTE_B_FREQ = 300;
const NOTE_A_PEAK = 0.28;
const NOTE_B_PEAK = 0.22;
const NOTE_A_OFFSET_MS = 0;
const NOTE_B_OFFSET_MS = 200;
const NOTE_ATTACK_S = 0.015;
const NOTE_DECAY_S = 0.4;
const NOTE_DURATION_S = 0.45;

export function createWaitTone(options?: { pingIntervalMs?: number }): WaitToneController {
	let ctx: AudioContext | null = null;
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let running = false;
	let destroyed = false;
	const pingIntervalMs = options?.pingIntervalMs ?? DEFAULT_PING_MS;

	function ensureContext(): AudioContext | null {
		if (typeof window === 'undefined') return null;
		if (!ctx || ctx.state === 'closed') {
			ctx = new AudioContext();
		}
		return ctx;
	}

	function playPing() {
		const ac = ensureContext();
		if (!ac) return;

		const t = ac.currentTime;

		function note(target: AudioContext, freq: number, startOffset: number, peak: number) {
			const osc = target.createOscillator();
			const gain = target.createGain();
			osc.connect(gain);
			gain.connect(target.destination);
			osc.type = 'triangle';
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0, t + startOffset);
			gain.gain.linearRampToValueAtTime(peak, t + startOffset + NOTE_ATTACK_S);
			gain.gain.exponentialRampToValueAtTime(0.001, t + startOffset + NOTE_DECAY_S);
			osc.start(t + startOffset);
			osc.stop(t + startOffset + NOTE_DURATION_S);
		}

		// Descending two-tone "ding-dong": ~G4 → ~D4
		note(ac, NOTE_A_FREQ, NOTE_A_OFFSET_MS / 1000, NOTE_A_PEAK);
		note(ac, NOTE_B_FREQ, NOTE_B_OFFSET_MS / 1000, NOTE_B_PEAK);
	}

	function start() {
		if (running || destroyed) return;
		const ac = ensureContext();
		if (!ac) return;
		running = true;
		ac.resume();
		playPing();
		intervalId = setInterval(playPing, pingIntervalMs);
	}

	function stop() {
		running = false;
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
		if (ctx && ctx.state !== 'closed') {
			ctx.suspend();
		}
	}

	function destroy() {
		if (destroyed) return;
		destroyed = true;
		stop();
		if (ctx && ctx.state !== 'closed') {
			void ctx.close();
			ctx = null;
		}
	}

	return { start, stop, destroy };
}

const singleton = createWaitTone();

export function startWaitTone() {
	singleton.start();
}

export function stopWaitTone() {
	singleton.stop();
}

export function destroyWaitTone() {
	singleton.destroy();
}
