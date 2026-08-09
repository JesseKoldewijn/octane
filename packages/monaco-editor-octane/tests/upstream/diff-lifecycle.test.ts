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

	// @parity-case adapted:c71f7eeee6
	it('updates original content and theme', async () => {
		const view = mount(DiffEditorFixture, {
			original: 'left-a',
			modified: 'right',
			theme: 'light',
		});
		try {
			await settle();
			view.update(DiffEditorFixture, {
				original: 'left-b',
				modified: 'right',
				theme: 'vs-dark',
			});
			await settle();
			expect(monaco.__diffEditors[0]!.getOriginalEditor().getValue()).toBe('left-b');
			expect(monaco.__getTheme()).toBe('vs-dark');
		} finally {
			act(() => view.unmount());
		}
	});

	// @parity-case adapted:4c531229c1
	it('applies language and model path props', async () => {
		const view = mount(DiffEditorFixture, {
			original: 'o',
			modified: 'm',
			originalLanguage: 'javascript',
			modifiedLanguage: 'typescript',
			originalModelPath: 'file:///orig.js',
			modifiedModelPath: 'file:///mod.ts',
		});
		try {
			await settle();
			const diff = monaco.__diffEditors[0]!;
			expect(diff.getOriginalEditor().getModel()!._language).toBe('javascript');
			expect(diff.getModifiedEditor().getModel()!._language).toBe('typescript');
			expect(diff.getOriginalEditor().getModel()!.uri.toString()).toBe('file:///orig.js');
			expect(diff.getModifiedEditor().getModel()!.uri.toString()).toBe('file:///mod.ts');
		} finally {
			act(() => view.unmount());
		}
	});

	// @parity-case adapted:169626cc19
	it('keeps original/modified models when keep flags are set', async () => {
		const view = mount(DiffEditorFixture, {
			original: 'keep-o',
			modified: 'keep-m',
			originalModelPath: 'file:///keep-o.ts',
			modifiedModelPath: 'file:///keep-m.ts',
			keepCurrentOriginalModel: true,
			keepCurrentModifiedModel: true,
		});
		await settle();
		const original = monaco.__diffEditors[0]!.getOriginalEditor().getModel()!;
		const modified = monaco.__diffEditors[0]!.getModifiedEditor().getModel()!;
		act(() => view.unmount());
		await settle(2);
		expect(original._disposed).toBe(false);
		expect(modified._disposed).toBe(false);
		original.dispose();
		modified.dispose();
	});

	// @parity-case adapted:a9aba43e31
	it('disposes the diff editor and allows remount', async () => {
		const onMount = vi.fn();
		const view = mount(DiffEditorFixture, { original: 'a', modified: 'b', onMount });
		await settle();
		expect(onMount).toHaveBeenCalledTimes(1);
		const first = monaco.__diffEditors[0]!;
		const createdBefore = monaco.__diffEditors.length;
		act(() => view.unmount());
		await settle(2);
		expect(first._disposed).toBe(true);
		const view2 = mount(DiffEditorFixture, { original: 'c', modified: 'd', onMount });
		try {
			await settle();
			expect(monaco.__diffEditors.length).toBeGreaterThan(createdBefore);
			expect(monaco.__diffEditors.some((editor) => !editor._disposed)).toBe(true);
			expect(onMount).toHaveBeenCalledTimes(2);
		} finally {
			act(() => view2.unmount());
		}
	});
});
