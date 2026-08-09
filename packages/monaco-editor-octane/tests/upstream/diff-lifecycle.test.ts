import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, loader, monaco, mount, settle } from '../_helpers';
import { DiffEditorFixture } from '../_fixtures/upstream.tsrx';

beforeEach(() => {
	loader.__reset();
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('DiffEditor lifecycle', () => {
	// @parity-case adapted:b132df9018
	it('creates a diff editor and reports onMount', async () => {
		const onMount = vi.fn();
		const view = mount(DiffEditorFixture, {
			original: 'left',
			modified: 'right',
			language: 'javascript',
			onMount,
		});
		try {
			await settle();
			expect(onMount).toHaveBeenCalledTimes(1);
			expect(monaco.__diffEditors.length).toBeGreaterThan(0);
			const diff = monaco.__diffEditors[0]!;
			expect(diff.getOriginalEditor().getValue()).toBe('left');
			expect(diff.getModifiedEditor().getValue()).toBe('right');
		} finally {
			act(() => view.unmount());
		}
	});

	// @parity-case adapted:ca39744630
	it('updates modified content from props', async () => {
		const view = mount(DiffEditorFixture, {
			original: 'a',
			modified: 'b',
		});
		try {
			await settle();
			view.update(DiffEditorFixture, {
				original: 'a',
				modified: 'c',
			});
			await settle();
			expect(monaco.__diffEditors[0]!.getModifiedEditor().getValue()).toBe('c');
		} finally {
			act(() => view.unmount());
		}
	});
});
