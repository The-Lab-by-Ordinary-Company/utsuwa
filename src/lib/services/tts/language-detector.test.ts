import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLanguageTag, initLanguageDetector } from './language-detector.ts';

// Initialise the detector before running tests.
await initLanguageDetector(['de', 'es']);

test('validateLanguageTag matches regional tags to their base language (H1)', () => {
	// "es-ES" (regional) must match "es" (what ELD returns).
	assert.equal(validateLanguageTag('el amigo', 'es-ES'), 'es-ES');
	assert.equal(validateLanguageTag('Hoy el sol brilla', 'es-MX'), 'es-MX');
	// German text stays German even with a regional tag.
	assert.equal(validateLanguageTag('Der Tisch', 'de-DE'), 'de-DE');
});

test('validateLanguageTag falls back to primary when ELD disagrees', () => {
	// German text tagged as Spanish → ELD detects "de" → falls back to primary.
	assert.equal(validateLanguageTag('Der Tisch', 'es'), 'de');
});

test('validateLanguageTag keeps correct tags', () => {
	assert.equal(validateLanguageTag('el amigo', 'es'), 'es');
	assert.equal(validateLanguageTag('der Tisch', 'de'), 'de');
});