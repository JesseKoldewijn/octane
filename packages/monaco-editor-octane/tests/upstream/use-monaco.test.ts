import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, loader, mount, settle } from '../_helpers';
import { UseMonacoProbe } from '../_fixtures/upstream.tsrx';

beforeEach(() => {
	loader.__reset();
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('useMonaco', () => {
	// @parity-case adapted:a3baf63022
	it('is null until loader.init resolves, then returns the instance', async () => {
		const view = mount(UseMonacoProbe);
		try {
			expect(view.container.textContent).toBe('pending');
			await settle();
			expect(view.container.getAttribute('data-monaco') || view.container.textContent).toContain(
				'ready',
			);
			expect(view.container.textContent).toBe('ready');
		} finally {
			act(() => view.unmount());
		}
	});

	// @parity-case adapted:4961ee849e
	it('stays pending when unmounted before loader.init resolves', async () => {
		loader.__reset({ holdInit: true });
		const view = mount(UseMonacoProbe);
		expect(view.container.textContent).toBe('pending');
		act(() => view.unmount());
		loader.__reset();
		const again = mount(UseMonacoProbe);
		try {
			expect(again.container.textContent).toBe('pending');
			await settle();
			expect(again.container.textContent).toBe('ready');
		} finally {
			act(() => again.unmount());
		}
	});
});
