import test from 'node:test';
import assert from 'node:assert/strict';

import { renderMarkdown } from './render-markdown.ts';

test('returns empty string for empty input', () => {
	assert.equal(renderMarkdown(''), '');
});

test('escapes HTML and does not execute injected tags', () => {
	const input = 'Hello <script>alert("xss")</script> world';
	const result = renderMarkdown(input);
	assert.ok(!result.includes('<script>'));
	assert.ok(result.includes('&lt;script&gt;'));
	assert.ok(result.includes('&lt;/script&gt;'));
});

test('renders bold, italic and combined formatting', () => {
	assert.equal(renderMarkdown('**bold**'), '<strong>bold</strong>');
	assert.equal(renderMarkdown('*italic*'), '<em>italic</em>');
	assert.equal(renderMarkdown('***both***'), '<strong><em>both</em></strong>');
	assert.equal(renderMarkdown('__bold__'), '<strong>bold</strong>');
	assert.equal(renderMarkdown('_italic_'), '<em>italic</em>');
	assert.equal(renderMarkdown('___both___'), '<strong><em>both</em></strong>');
});

test('renders inline code', () => {
	assert.equal(renderMarkdown('use `code` here'), 'use <code>code</code> here');
});

test('renders mixed formatting in one line', () => {
	const input = '**bold**, *italic*, `code` and <html>';
	const result = renderMarkdown(input);
	assert.equal(
		result,
		'<strong>bold</strong>, <em>italic</em>, <code>code</code> and &lt;html&gt;'
	);
});

test('renders a phrase wrapped in underscores as italic', () => {
	assert.equal(renderMarkdown('_hello world_'), '<em>hello world</em>');
});

test('leaves underscores inside words untouched', () => {
	assert.equal(renderMarkdown('hello_world'), 'hello_world');
});

test('leaves plain text untouched', () => {
	const input = 'Just a normal sentence.';
	assert.equal(renderMarkdown(input), input);
});
