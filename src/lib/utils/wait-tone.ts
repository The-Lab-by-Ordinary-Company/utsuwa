import { browser } from '$app/environment';

let ctx: AudioContext | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

function getContext(): AudioContext | null {
	if (!browser) return null;
	if (!ctx || ctx.state === 'closed') {
		ctx = new AudioContext();
	}
	return ctx;
}

function playPing() {
	const ac = getContext();
	if (!ac) return;

	const t = ac.currentTime;

	function note(freq: number, startOffset: number, peak: number) {
		const osc = ac!.createOscillator();
		const gain = ac!.createGain();
		osc.connect(gain);
		gain.connect(ac!.destination);
		osc.type = 'triangle';
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(0, t + startOffset);
		gain.gain.linearRampToValueAtTime(peak, t + startOffset + 0.015);
		gain.gain.exponentialRampToValueAtTime(0.001, t + startOffset + 0.4);
		osc.start(t + startOffset);
		osc.stop(t + startOffset + 0.45);
	}

	// Descending two-tone "ding-dong": ~G4 → ~D4
	note(400, 0, 0.28);
	note(300, 0.2, 0.22);
}

export function startWaitTone() {
	if (running) return;
	running = true;
	getContext()?.resume();
	playPing();
	intervalId = setInterval(playPing, 2200);
}

export function stopWaitTone() {
	running = false;
	if (intervalId !== null) {
		clearInterval(intervalId);
		intervalId = null;
	}
}
