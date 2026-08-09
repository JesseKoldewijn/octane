import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { defineConfig } from 'vite';
import { octane } from 'octane/compiler/vite';

function resolveMonacoEditorRoot(): string {
	const require = createRequire(import.meta.url);
	let candidate = dirname(require.resolve('monaco-editor'));
	while (candidate !== dirname(candidate)) {
		const packageJsonPath = join(candidate, 'package.json');
		if (existsSync(packageJsonPath)) {
			const name = JSON.parse(readFileSync(packageJsonPath, 'utf8')).name as string;
			if (name === 'monaco-editor') return candidate;
		}
		candidate = dirname(candidate);
	}
	throw new Error('Could not locate the monaco-editor package root');
}

const monacoEditorCss = resolve(resolveMonacoEditorRoot(), 'min/vs/editor/editor.main.css');

export default defineConfig({
	plugins: [octane()],
	resolve: {
		extensions: ['.tsrx', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
		alias: [
			// monaco-editor 0.56 `exports` maps `./*` → `./esm/vs/*.js`, so CSS is not
			// importable via package subpaths. Alias the stylesheet explicitly.
			{ find: 'monaco-editor/editor/editor.main.css', replacement: monacoEditorCss },
		],
	},
	optimizeDeps: {
		exclude: ['monaco-editor'],
	},
	worker: {
		format: 'es',
	},
	build: { target: 'esnext' },
	server: { port: 5215, strictPort: true },
});
