/**
 * Same fixtures through @octanejs/monaco-editor-octane and pinned
 * @monaco-editor/react@4.8.0-rc.3 on React, against the shared loader mock.
 *
 * Lifecycle create/dispose is covered by adapted upstream tests with the monaco
 * double. The published React bundle's async loader.init path does not reliably
 * finish editor.create under jsdom with that double, so this lane pins the
 * consumer-visible loading shell both implementations emit on first paint.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { resolve } from 'node:path';
import { mountDifferential } from '../../../octane/tests/differential/_rig.ts';
import loader from '../_mocks/loader';

const EDITOR_FIXTURE = resolve(__dirname, '../_fixtures/differential/editor-diff.tsrx');
const CACHE = resolve(__dirname, '.react-cache');

beforeEach(() => {
	loader.__reset();
});

function sectionShell(container: HTMLElement) {
	const section = container.querySelector('section');
	const host = section?.querySelector(':scope > div:last-of-type') as HTMLElement | null;
	const loading = section?.querySelector(':scope > div') as HTMLElement | null;
	return {
		hasSection: Boolean(section),
		hasLoadingText: Boolean(section?.textContent?.includes('Loading...')),
		loadingDisplay: loading?.style.display ?? null,
		hostDisplay: host?.style.display ?? null,
		width: (section as HTMLElement | null)?.style.width ?? null,
		height: (section as HTMLElement | null)?.style.height ?? null,
	};
}

describe('differential: @octanejs/monaco-editor-octane vs @monaco-editor/react 4.8.0-rc.3', () => {
	// @parity-case differential:04a77bc772
	it('renders matching Editor loading shells before monaco resolves', async () => {
		const differential = await mountDifferential(
			EDITOR_FIXTURE,
			'EditorDiff',
			{ defaultValue: 'parity', defaultLanguage: 'javascript' },
			CACHE,
		);

		await differential.observe('initial loading shell', (octaneMount, reactMount) => {
			expect(sectionShell(octaneMount.container)).toEqual(sectionShell(reactMount.container));
			expect(sectionShell(octaneMount.container)).toMatchObject({
				hasSection: true,
				hasLoadingText: true,
				hostDisplay: 'none',
				height: '200px',
			});
		});

		differential.unmount();
	});

	// @parity-case differential:3d1e46413d
	it('renders matching DiffEditor loading shells', async () => {
		const differential = await mountDifferential(
			EDITOR_FIXTURE,
			'DiffEditorDiff',
			{ original: 'a', modified: 'b', language: 'plaintext' },
			CACHE,
		);

		await differential.observe('diff loading shell', (octaneMount, reactMount) => {
			expect(sectionShell(octaneMount.container)).toEqual(sectionShell(reactMount.container));
			expect(sectionShell(octaneMount.container).hasLoadingText).toBe(true);
		});

		differential.unmount();
	});

	// @parity-case differential:3fc3dcb918
	it('renders matching useMonaco pending markup before init', async () => {
		const differential = await mountDifferential(EDITOR_FIXTURE, 'UseMonacoDiff', {}, CACHE);
		await differential.observe('useMonaco pending', (octaneMount, reactMount) => {
			expect(octaneMount.container.textContent).toBe(reactMount.container.textContent);
			expect(octaneMount.container.textContent).toBe('pending');
		});
		differential.unmount();
	});
});
