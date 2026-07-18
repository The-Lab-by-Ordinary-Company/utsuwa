import test from 'node:test';
import assert from 'node:assert/strict';

import { wrapWordsInHtml } from './reveal-markup.ts';

test('wraps plain text words with sequential indexes', () => {
	const { html, wordCount } = wrapWordsInHtml('hello there world');
	assert.equal(wordCount, 3);
	assert.equal(
		html,
		'<span class="reveal-word" style="--word-index:0">hello</span> ' +
			'<span class="reveal-word" style="--word-index:1">there</span> ' +
			'<span class="reveal-word" style="--word-index:2">world</span>'
	);
});

test('preserves inline tags around and inside words', () => {
	const { html, wordCount } = wrapWordsInHtml('so <strong>very good</strong> today');
	assert.equal(wordCount, 4);
	assert.equal(
		html,
		'<span class="reveal-word" style="--word-index:0">so</span> ' +
			'<strong><span class="reveal-word" style="--word-index:1">very</span> ' +
			'<span class="reveal-word" style="--word-index:2">good</span></strong> ' +
			'<span class="reveal-word" style="--word-index:3">today</span>'
	);
});

test('handles nested strong and em', () => {
	const { html, wordCount } = wrapWordsInHtml('<strong><em>wow</em></strong>');
	assert.equal(wordCount, 1);
	assert.equal(
		html,
		'<strong><em><span class="reveal-word" style="--word-index:0">wow</span></em></strong>'
	);
});

test('wraps words inside code spans', () => {
	const { html, wordCount } = wrapWordsInHtml('run <code>pnpm test</code> now');
	assert.equal(wordCount, 4);
	assert.equal(
		html,
		'<span class="reveal-word" style="--word-index:0">run</span> ' +
			'<code><span class="reveal-word" style="--word-index:1">pnpm</span> ' +
			'<span class="reveal-word" style="--word-index:2">test</span></code> ' +
			'<span class="reveal-word" style="--word-index:3">now</span>'
	);
});

test('keeps entities intact within a word', () => {
	const { html, wordCount } = wrapWordsInHtml('salt &amp; pepper');
	assert.equal(wordCount, 3);
	assert.ok(html.includes('>&amp;</span>'));
});

test('preserves multiple spaces and newlines between words', () => {
	const { html } = wrapWordsInHtml('a  b\nc');
	assert.ok(html.includes('</span>  <span'));
	assert.ok(html.includes('</span>\n<span'));
});

test('empty string yields empty result', () => {
	const { html, wordCount } = wrapWordsInHtml('');
	assert.equal(html, '');
	assert.equal(wordCount, 0);
});
