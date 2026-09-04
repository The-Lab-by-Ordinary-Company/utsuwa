import test from 'node:test';
import assert from 'node:assert/strict';
import { stripThinkingBlocks } from './thinking-blocks.ts';

test('stripThinkingBlocks removes complete reasoning blocks keeping the rest', () => {
	assert.equal(
		stripThinkingBlocks('<thinking>Der User wirkt müde. Ich sei warm.</thinking>').trim(),
		''
	);
	assert.equal(
		stripThinkingBlocks('Hola <thinking>Sie liebt Spanisch.</thinking> ¿Qué tal? gerne'),
		'Hola  ¿Qué tal? gerne'
	);
});

test('stripThinkingBlocks drops an unclosed block from its opener on (streaming)', () => {
	assert.equal(
		stripThinkingBlocks('Klar! <thinking>Der User wirkt müde. Ich sollte'),
		'Klar! '
	);
});

test('stripThinkingBlocks keeps the text after a stray closing tag', () => {
	assert.equal(stripThinkingBlocks('<thinking>vergessen</thinking>Hola!'), 'Hola!');
});

test('stripThinkingBlocks never touches the plain word thinking', () => {
	assert.equal(
		stripThinkingBlocks('Ich bin gerade am thinking über Sprache.'),
		'Ich bin gerade am thinking über Sprache.'
	);
});
