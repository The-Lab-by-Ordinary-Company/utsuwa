import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	define: {
		'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version)
	},
	ssr: {
		noExternal: ['bits-ui']
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
