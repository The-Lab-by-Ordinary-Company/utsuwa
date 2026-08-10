import test from 'node:test';
import assert from 'node:assert/strict';
import { parseToolCall } from './tool-definitions.ts';

test('parseToolCall parses valid speak call', () => {
	const result = parseToolCall({ name: 'speak', arguments: { text: 'Hello', lang: 'de' } });
	assert.ok(result);
	assert.equal(result?.name, 'speak');
	assert.equal(result?.arguments.text, 'Hello');
	assert.equal(result?.arguments.lang, 'de');
});

test('parseToolCall omits invalid lang', () => {
	const result = parseToolCall({ name: 'speak', arguments: { text: 'Hello', lang: 'x' } });
	assert.ok(result);
	assert.equal(result?.arguments.lang, undefined);
});

test('parseToolCall clamps pause ms', () => {
	const result = parseToolCall({ name: 'pause', arguments: { ms: 50 } });
	assert.equal(result?.arguments.ms, 100);
	const result2 = parseToolCall({ name: 'pause', arguments: { ms: 8000 } });
	assert.equal(result2?.arguments.ms, 5000);
});

test('parseToolCall discards unknown gesture types', () => {
	assert.equal(parseToolCall({ name: 'gesture', arguments: { type: 'cry' } }), null);
});

test('parseToolCall returns null for unknown tools', () => {
	assert.equal(parseToolCall({ name: 'unknown', arguments: {} }), null);
});

test('parseToolCall accepts valid gesture types', () => {
	const result = parseToolCall({ name: 'gesture', arguments: { type: 'smile' } });
	assert.ok(result);
	assert.equal(result?.arguments.type, 'smile');
});
test('parseToolCall normalizes gesture type to lowercase', () => {
	const result = parseToolCall({ name: 'gesture', arguments: { type: 'Smile' } });
	assert.ok(result);
	assert.equal(result?.arguments.type, 'smile');
});

test('parseToolCall normalizes speak lang to lowercase', () => {
	const result = parseToolCall({ name: 'speak', arguments: { text: 'Hello', lang: 'DE' } });
	assert.ok(result);
	assert.equal(result?.arguments.lang, 'de');
});

test('parseToolCall accepts long language tags like zh-Hans', () => {
	const result = parseToolCall({
		name: 'speak',
		arguments: { text: '你好', lang: 'zh-Hans' }
	});
	assert.ok(result);
	assert.equal(result?.arguments.lang, 'zh-hans');
});
