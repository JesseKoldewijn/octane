import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const playgroundRoot = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(playgroundRoot, 'package.json'));
const babel = require('@babel/core') as typeof import('@babel/core');
// Workspace pins babel-preset-solid@2 for @tsrx/solid; grab's overlay is Solid 1.9.
const solidPreset = resolve(playgroundRoot, 'vendor/babel-preset-solid-1.9.9');

/**
 * Solid 1.x JSX transform for packages/grab only.
 * Avoids the workspace Solid 2 babel-preset-solid pin (emits `@solidjs/web`).
 */
export function solidBabelForGrab(): Plugin {
	return {
		name: 'grab-playground-solid-babel',
		enforce: 'pre',
		transform(code, id) {
			if (!/packages\/grab\/src\/.*\.(tsx|jsx)([?#]|$)/.test(id)) return;
			const result = babel.transformSync(code, {
				filename: id,
				sourceMaps: true,
				babelrc: false,
				configFile: false,
				presets: [
					[require.resolve('@babel/preset-typescript'), { onlyRemoveTypeImports: true }],
					[solidPreset, { generate: 'dom', hydratable: false }],
				],
			});
			if (!result?.code) return;
			return { code: result.code, map: result.map };
		},
	};
}
