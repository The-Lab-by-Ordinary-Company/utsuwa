import test from 'node:test';
import assert from 'node:assert/strict';

import { isPrivateHost, assertSafeProviderUrl } from './url-guard.ts';

test('loopback and localhost hosts are private', () => {
	for (const h of ['localhost', 'foo.localhost', '127.0.0.1', '127.5.5.5', '::1', '0.0.0.0']) {
		assert.equal(isPrivateHost(h), true, h);
	}
});

test('private IPv4 ranges are blocked', () => {
	for (const h of ['10.0.0.1', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254']) {
		assert.equal(isPrivateHost(h), true, h);
	}
});

test('public-range IPv4 near private blocks is allowed', () => {
	for (const h of ['172.32.0.1', '192.169.0.1', '11.0.0.1', '8.8.8.8']) {
		assert.equal(isPrivateHost(h), false, h);
	}
});

test('IPv6 link-local and unique-local are blocked; mapped loopback too', () => {
	assert.equal(isPrivateHost('fe80::1'), true);
	assert.equal(isPrivateHost('fd00::1'), true);
	assert.equal(isPrivateHost('[::1]'), true);
	assert.equal(isPrivateHost('::ffff:127.0.0.1'), true);
});

test('real provider hosts are allowed', () => {
	for (const h of ['api.openai.com', 'api.anthropic.com', 'generativelanguage.googleapis.com', 'api.x.ai']) {
		assert.equal(isPrivateHost(h), false, h);
	}
});

test('assertSafeProviderUrl accepts public https provider URLs', () => {
	const url = assertSafeProviderUrl('https://api.openai.com/v1');
	assert.equal(url.hostname, 'api.openai.com');
});

test('assertSafeProviderUrl rejects private hosts and non-http schemes', () => {
	assert.throws(() => assertSafeProviderUrl('http://169.254.169.254/latest/meta-data/'));
	assert.throws(() => assertSafeProviderUrl('http://localhost:11434/v1'));
	assert.throws(() => assertSafeProviderUrl('file:///etc/passwd'));
	assert.throws(() => assertSafeProviderUrl('not a url'));
});

test('allowPrivate lets self-hosters reach local models', () => {
	const url = assertSafeProviderUrl('http://localhost:11434/v1', true);
	assert.equal(url.hostname, 'localhost');
});

test('loopback expressed in non-decimal IPv4 encodings is still blocked', () => {
	// All of these resolve to 127.0.0.1 via inet_aton and used to bypass the guard.
	for (const h of ['2130706433', '0x7f000001', '0x7f.0.0.1', '0177.0.0.1', '017700000001', '127.1', '127.0.1']) {
		assert.equal(isPrivateHost(h), true, h);
	}
});

test('cloud metadata in integer form is blocked', () => {
	// 169.254.169.254 = 2852039166
	assert.equal(isPrivateHost('2852039166'), true);
});

test('assertSafeProviderUrl rejects encoded loopback', () => {
	assert.throws(() => assertSafeProviderUrl('http://2130706433:11434/v1'));
	assert.throws(() => assertSafeProviderUrl('http://0x7f000001/v1'));
});

test('hostnames that merely start with fc/fd are not misclassified as IPv6', () => {
	for (const h of ['fcbanking.com', 'fd-cdn.example.com', 'fcm.googleapis.com']) {
		assert.equal(isPrivateHost(h), false, h);
	}
});

test('public integer-form IPs are still allowed', () => {
	// 8.8.8.8 = 134744072
	assert.equal(isPrivateHost('134744072'), false);
});
