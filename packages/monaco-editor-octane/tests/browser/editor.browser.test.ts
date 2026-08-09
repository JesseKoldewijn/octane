import { createServer as createNetServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';

import { octane } from '../../../octane/src/compiler/vite.js';

const browserTestRoot = dirname(fileURLToPath(import.meta.url));
const harnessRoot = resolve(browserTestRoot, 'harness');
const packageSource = resolve(browserTestRoot, '../../src/index.ts');
const octaneSource = resolve(browserTestRoot, '../../../octane/src/index.ts');

function getFreePort(): Promise<number> {
	return new Promise((resolvePort, reject) => {
		const server = createNetServer();
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as import('node:net').AddressInfo;
			server.close(() => resolvePort(port));
		});
	});
}

let viteServer: ViteDevServer;
let browser: import('playwright').Browser;
let page: import('playwright').Page;
let origin = '';
let pageErrors: string[] = [];

beforeAll(async () => {
	try {
		const { chromium } = await import('playwright');
		browser = await chromium.launch({ headless: true });
	} catch (error) {
		throw new Error(
			'[@octanejs/monaco-editor-octane browser] Chromium is required ' +
				'(run `pnpm exec playwright install chromium`): ' +
				(error instanceof Error ? error.message.split('\n')[0] : String(error)),
		);
	}

	const { createRequire } = await import('node:module');
	const { existsSync, readFileSync } = await import('node:fs');
	const { join } = await import('node:path');
	const require = createRequire(import.meta.url);
	let monacoRoot = dirname(require.resolve('monaco-editor'));
	while (monacoRoot !== dirname(monacoRoot)) {
		const packageJsonPath = join(monacoRoot, 'package.json');
		if (existsSync(packageJsonPath)) {
			const name = JSON.parse(readFileSync(packageJsonPath, 'utf8')).name as string;
			if (name === 'monaco-editor') break;
		}
		monacoRoot = dirname(monacoRoot);
	}
	const monacoEditorCss = resolve(monacoRoot, 'min/vs/editor/editor.main.css');

	const port = await getFreePort();
	viteServer = await createServer({
		root: harnessRoot,
		logLevel: 'error',
		server: {
			host: '127.0.0.1',
			port,
			strictPort: true,
		},
		plugins: [octane()],
		resolve: {
			alias: [
				{ find: /^@octanejs\/monaco-editor-octane$/, replacement: packageSource },
				{ find: /^octane$/, replacement: octaneSource },
				// monaco-editor 0.56 exports map only covers JS; CSS needs an explicit alias.
				{ find: 'monaco-editor/editor/editor.main.css', replacement: monacoEditorCss },
			],
		},
		optimizeDeps: {
			exclude: ['monaco-editor'],
		},
		worker: {
			format: 'es',
		},
	});
	await viteServer.listen();
	origin = `http://127.0.0.1:${port}`;
}, 60_000);

afterAll(async () => {
	await page?.close().catch(() => {});
	await browser?.close().catch(() => {});
	await viteServer?.close().catch(() => {});
});

beforeEach(async () => {
	pageErrors = [];
	page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
	page.on('pageerror', (error) => pageErrors.push(String(error)));
	await page.goto(origin, { waitUntil: 'networkidle' });
	await page.locator('[data-editor-ready="true"]').waitFor({ timeout: 30_000 });
});

afterEach(async () => {
	try {
		expect(pageErrors, 'browser page errors').toEqual([]);
	} finally {
		await page.close();
	}
});

describe('@octanejs/monaco-editor-octane browser', () => {
	it('mounts a real editor with workers and accepts typed input', async () => {
		const editor = page.locator('.monaco-editor').first();
		await editor.waitFor({ timeout: 30_000 });
		expect(await editor.isVisible()).toBe(true);
		const before = await page.getByTestId('value').textContent();
		await editor.click();
		await page.keyboard.press('End');
		await page.keyboard.type('!');
		await expect
			.poll(async () => page.getByTestId('value').textContent(), { timeout: 10_000 })
			.not.toBe(before);
		expect(await page.getByTestId('value').textContent()).toContain('!');
	});

	it('remounts cleanly after dispose', async () => {
		await page.getByTestId('remount').click();
		await page.locator('[data-editor-ready="true"]').waitFor({ timeout: 30_000 });
		expect(await page.locator('.monaco-editor').first().isVisible()).toBe(true);
	});

	it('mounts DiffEditor without page errors', async () => {
		await page.getByTestId('diff-host').locator('.monaco-diff-editor').waitFor({ timeout: 30_000 });
		expect(
			await page.getByTestId('diff-host').locator('.monaco-diff-editor').count(),
		).toBeGreaterThan(0);
	});
});
