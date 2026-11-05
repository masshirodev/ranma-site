import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';

export default defineConfig(
	includeIgnoreFile(path.resolve(import.meta.dirname, '.gitignore')),
	js.configs.recommended,
	prettier,
	{
		languageOptions: { globals: { ...globals.node } },
		rules: {
			// An unused binding is either dead code or a forgotten use; `_` marks
			// the deliberate ones (a callback's ignored argument).
			'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
		}
	},
	// The one script the page loads runs in the browser, not in node.
	{
		files: ['static/**/*.js'],
		languageOptions: { globals: { ...globals.browser } }
	},
	// Playwright specs run in node, but what they pass to page.evaluate runs
	// in the page.
	{
		files: ['e2e/**/*.mjs'],
		languageOptions: { globals: { ...globals.node, ...globals.browser } }
	}
);
