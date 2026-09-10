import { expect, test, type Page } from '@playwright/test';
import {
	collectBrowserDiagnostics,
	settleBrowserFrames,
	type BrowserDiagnostics,
} from '../../_shared/e2e/browser.ts';

const runtimeDiagnostics = new WeakMap<Page, BrowserDiagnostics>();

test.beforeEach(async ({ page }) => {
	runtimeDiagnostics.set(page, collectBrowserDiagnostics(page));
	await page.goto('/?activate=1');
	await expect(page.getByTestId('grab-smoke-target')).toBeVisible();
});

test.afterEach(async ({ page }, testInfo) => {
	const diagnostics = runtimeDiagnostics.get(page);
	if (diagnostics === undefined) return;
	try {
		await settleBrowserFrames(page);
		diagnostics.assertClean(testInfo.title);
	} finally {
		diagnostics.stop();
	}
});

test('activates grab and mounts the overlay host', async ({ page }) => {
	await expect
		.poll(async () =>
			page.evaluate(() => {
				const api = (window as Window & { __OCTANE_GRAB__?: { isActive?: () => boolean } })
					.__OCTANE_GRAB__;
				return Boolean(api?.isActive?.());
			}),
		)
		.toBe(true);

	const hasOverlayHost = await page.evaluate(() =>
		[...document.querySelectorAll('*')].some(
			(node) => node.getAttribute?.('data-react-grab') != null && Boolean(node.shadowRoot),
		),
	);
	expect(hasOverlayHost).toBe(true);

	const todo = page.getByText('Buy groceries', { exact: true });
	const box = await todo.boundingBox();
	expect(box).toBeTruthy();
	// Grab freezes the page with `html { pointer-events: none }`; Playwright's
	// hover action refuses that, so drive the pointer directly.
	await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
	await expect
		.poll(async () =>
			page.evaluate(() => {
				const api = (
					window as Window & {
						__OCTANE_GRAB__?: {
							getState?: () => { isSelectionBoxVisible?: boolean; targetElement?: Element | null };
						};
					}
				).__OCTANE_GRAB__;
				const state = api?.getState?.();
				return Boolean(state?.isSelectionBoxVisible && state.targetElement);
			}),
		)
		.toBe(true);
});
