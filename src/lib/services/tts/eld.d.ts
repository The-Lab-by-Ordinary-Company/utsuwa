declare module 'eld/medium' {
	interface LanguageResult {
		language: string;
		isReliable(): boolean;
		getScores(): Record<string, number>;
	}
	interface ELDInstance {
		detect(text: string): LanguageResult;
		setLanguageSubset(languages: string[]): void;
		enableTextCleanup(enabled: boolean): void;
		cleanText(text: string): string;
	}
	const eld: ELDInstance;
	export default eld;
}
