import test from 'node:test';
import assert from 'node:assert/strict';
import {
	classifyReminder,
	extractReminderTags,
	isOldExecutedReminder,
	parseReminderTime,
	tryExtractReminderFromUserMessage
} from './reminders.ts';

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

test('parseReminderTime handles shorthand and combined units', () => {
	const before = Date.now();

	const mResult = parseReminderTime('90m');
	assert.ok(mResult);
	assert.ok(mResult!.getTime() >= before + 90 * 60 * 1000);

	const combined = parseReminderTime('1h30m');
	assert.ok(combined);
	assert.ok(combined!.getTime() >= before + 90 * 60 * 1000);
});

test('parseReminderTime returns null for empty or invalid input', () => {
	assert.equal(parseReminderTime(''), null);
	assert.equal(parseReminderTime('later'), null);
	assert.equal(parseReminderTime('tomorrow'), null);
	assert.equal(parseReminderTime('-5min'), null);
	assert.equal(parseReminderTime('0min'), null);
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

test('tryExtractReminderFromUserMessage rejects negative or zero durations', () => {
	assert.equal(tryExtractReminderFromUserMessage('Remind me in -5 minutes to stretch'), null);
	assert.equal(tryExtractReminderFromUserMessage('Remind me in 0 minutes to stretch'), null);
});

test('tryExtractReminderFromUserMessage ignores sentences without reminder intent', () => {
	assert.equal(tryExtractReminderFromUserMessage('Taxi in 10 Minuten zu meinem Termin'), null);
	assert.equal(tryExtractReminderFromUserMessage('Ich fahre in 5 Minuten nach Hause'), null);
	assert.equal(tryExtractReminderFromUserMessage('In 10 minutes to the airport'), null);
	assert.equal(tryExtractReminderFromUserMessage('Das Meeting ist in 30 Minuten'), null);
});

test('tryExtractReminderFromUserMessage keeps explicit reminder forms', () => {
	const a = tryExtractReminderFromUserMessage('Reminder in 10 minutes drink water');
	assert.ok(a);
	assert.equal(a!.content, 'drink water');

	const b = tryExtractReminderFromUserMessage('Erinnerung in 10 Minuten Kaffee trinken');
	assert.ok(b);
	assert.equal(b!.content, 'Kaffee trinken');
});

test('classifyReminder distinguishes pending, fire and missed', () => {
	const now = Date.now();
	assert.equal(classifyReminder(new Date(now + 1000), now, 5000), 'pending');
	assert.equal(classifyReminder(new Date(now - 1000), now, 5000), 'fire');
	assert.equal(classifyReminder(new Date(now - 6000), now, 5000), 'missed');
	assert.equal(classifyReminder(new Date(now), now, 5000), 'fire');
});

test('extractReminderTags ignores invalid time strings', () => {
	const { reminders, cleanedText } = extractReminderTags(
		'[reminder:abc]do something[/reminder] [reminder:-5min]invalid[/reminder] Hello'
	);

	assert.equal(reminders.length, 0);
	assert.equal(cleanedText, 'Hello');
});

test('extractReminderTags ignores empty content tags', () => {
	const { reminders, cleanedText } = extractReminderTags(
		'[reminder:5min][/reminder] [reminder:1h]   [/reminder] Hello'
	);

	assert.equal(reminders.length, 0);
	assert.equal(cleanedText, 'Hello');
});

test('isOldExecutedReminder identifies executed reminders past the TTL', () => {
	const now = Date.now();
	const ttl = 7 * 24 * 60 * 60 * 1000;
	assert.equal(
		isOldExecutedReminder(
			{ executed: true, triggerAt: new Date(now - ttl - 1000) },
			now,
			ttl
		),
		true
	);
	assert.equal(
		isOldExecutedReminder({ executed: true, triggerAt: new Date(now - ttl + 1000) }, now, ttl),
		false
	);
	assert.equal(
		isOldExecutedReminder({ executed: false, triggerAt: new Date(now - ttl - 1000) }, now, ttl),
		false
	);
});
