/**
 * Ensure the vendored Solid 1.9 babel preset can resolve
 * babel-plugin-jsx-dom-expressions (workspace pins Solid 2's preset).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const vendorRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'vendor');
const pluginRoot = join(vendorRoot, 'babel-plugin-jsx-dom-expressions-0.40.10');
const presetRoot = join(vendorRoot, 'babel-preset-solid-1.9.9');
const marker = join(pluginRoot, 'node_modules', 'html-entities');

if (!existsSync(pluginRoot) || !existsSync(presetRoot)) {
	console.error('missing vendored Solid 1.9 babel packages under vendor/');
	process.exit(1);
}

if (!existsSync(marker)) {
	const result = spawnSync('npm', ['install', '--omit=dev', '--ignore-scripts'], {
		cwd: pluginRoot,
		stdio: 'inherit',
		shell: true,
	});
	if (result.status !== 0) process.exit(result.status ?? 1);
}

const link = join(presetRoot, 'node_modules', 'babel-plugin-jsx-dom-expressions');
if (!existsSync(link)) {
	const { mkdirSync, symlinkSync } = await import('node:fs');
	mkdirSync(join(presetRoot, 'node_modules'), { recursive: true });
	symlinkSync(pluginRoot, link);
}

console.log('solid babel vendor ready');
