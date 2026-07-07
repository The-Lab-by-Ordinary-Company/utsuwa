import test from 'node:test';
import assert from 'node:assert/strict';
import { extractReminderTags, parseReminderTime, tryExtractReminderFromUserMessage } from './reminders.ts';

test('extractReminderTags parses a single tag', () => {
	const { reminders, cleanedText } = extractReminderTags(
		'Sure! [reminder:5min]drink water[/reminder] See you soon.'
	);

	assert.equal(reminders.length, 1);
	assert.equal(reminders[0].content, 'drink water');
	assert.ok(reminders[0].triggerAt.getTime() > Date.now() + 4 * 60 * 1000);
	assert.equal(cleanedText, 'Sure! See you soon.');
});

test('extractReminderTags parses multiple tags', () => {
	const { reminders, cleanedText } = extractReminderTags(
		'[reminder:1h]walk the dog[/reminder] and [reminder:30s]stretch[/reminder]'
	);

	assert.equal(reminders.length, 2);
	assert.equal(reminders[0].content, 'walk the dog');
	assert.equal(reminders[1].content, 'stretch');
	assert.ok(cleanedText.includes('and'));
	assert.ok(!cleanedText.includes('[reminder'));
});

test('extractReminderTags ignores invalid time tags', () => {
	const { reminders, cleanedText } = extractReminderTags(
		'[reminder:soon]do something[/reminder] Hello'
	);

	assert.equal(reminders.length, 0);
	assert.equal(cleanedText, 'Hello');
});

test('parseReminderTime handles minutes, hours and seconds', () => {
	const before = Date.now();
	const result = parseReminderTime('1h 5min 30s');
	const after = Date.now();

	assert.ok(result);
	assert.ok(result!.getTime() >= before + 60 * 60 * 1000 + 5 * 60 * 1000 + 30 * 1000);
	assert.ok(result!.getTime() <= after + 60 * 60 * 1000 + 5 * 60 * 1000 + 30 * 1000 + 100);
});

test('parseReminderTime returns null for empty or invalid input', () => {
	assert.equal(parseReminderTime(''), null);
	assert.equal(parseReminderTime('later'), null);
	assert.equal(parseReminderTime('tomorrow'), null);
});

test('tryExtractReminderFromUserMessage matches German request', () => {
	const result = tryExtractReminderFromUserMessage('Erinnere mich in 10 Minuten an den Kaffee');

	assert.ok(result);
	assert.equal(result!.content, 'den Kaffee');
	assert.ok(result!.triggerAt.getTime() > Date.now() + 9 * 60 * 1000);
});

test('tryExtractReminderFromUserMessage matches English request', () => {
	const result = tryExtractReminderFromUserMessage('Remind me in 20 seconds to stretch');

	assert.ok(result);
	assert.equal(result!.content, 'stretch');
	assert.ok(result!.triggerAt.getTime() > Date.now() + 19 * 1000);
});

test('tryExtractReminderFromUserMessage returns null for unrelated input', () => {
	assert.equal(tryExtractReminderFromUserMessage('What is the weather?'), null);
	assert.equal(tryExtractReminderFromUserMessage('Hello'), null);
});

test('tryExtractReminderFromUserMessage handles content-before-time order', () => {
	const result = tryExtractReminderFromUserMessage('Remind me to call mom in 5 minutes');

	assert.ok(result);
	assert.equal(result!.content, 'call mom');
	assert.ok(result!.triggerAt.getTime() > Date.now() + 4 * 60 * 1000);
});
