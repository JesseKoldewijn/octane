import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, loader, monaco, mount, settle } from '../_helpers';
import { EditorFixture } from '../_fixtures/upstream.tsrx';

beforeEach(() => {
	loader.__reset();
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('Editor lifecycle', () => {
	it('calls onMount after monaco init and editor.create', async () => {
		const onMount = vi.fn();
		const view = mount(EditorFixture, {
			defaultValue: 'hello',
			defaultLanguage: 'javascript',
			onMount,
		});
		try {
			await settle();
			expect(onMount).toHaveBeenCalledTimes(1);
			expect(monaco.__editors.length).toBe(1);
			expect(monaco.__editors[0]!.getValue()).toBe('hello');
		} finally {
			act(() => view.unmount());
		}
	});

	it('syncs controlled value without firing onChange', async () => {
		const onChange = vi.fn();
		const view = mount(EditorFixture, {
			value: 'one',
			language: 'plaintext',
			onChange,
		});
		try {
			await settle();
			onChange.mockClear();
			view.update(EditorFixture, {
				value: 'two',
				language: 'plaintext',
				onChange,
			});
			await settle();
			expect(monaco.__editors[0]!.getValue()).toBe('two');
			expect(onChange).not.toHaveBeenCalled();
		} finally {
			act(() => view.unmount());
		}
	});

	it('fires onChange for model content edits', async () => {
		const onChange = vi.fn();
		const view = mount(EditorFixture, {
			defaultValue: 'start',
			onChange,
		});
		try {
			await settle();
			const editor = monaco.__editors[0]!;
			editor.executeEdits('', [{ text: 'edited' }]);
			expect(onChange).toHaveBeenCalled();
			expect(onChange.mock.calls[0]![0]).toBe('edited');
		} finally {
			act(() => view.unmount());
		}
	});

	it('disposes editor on unmount and allows remount', async () => {
		const view = mount(EditorFixture, { defaultValue: 'x' });
		await settle();
		const first = monaco.__editors[0]!;
		act(() => view.unmount());
		await settle(2);
		expect(first._disposed).toBe(true);

		const view2 = mount(EditorFixture, { defaultValue: 'y' });
		try {
			await settle();
			expect(monaco.__editors.some((editor) => !editor._disposed)).toBe(true);
		} finally {
			act(() => view2.unmount());
		}
	});

	it('keeps model when keepCurrentModel is true', async () => {
		const view = mount(EditorFixture, {
			defaultValue: 'kept',
			path: 'file:///kept.ts',
			keepCurrentModel: true,
		});
		await settle();
		const model = monaco.__editors[0]!.getModel()!;
		act(() => view.unmount());
		await settle(2);
		expect(model._disposed).toBe(false);
		model.dispose();
	});

	it('syncs language onto the active model', async () => {
		const view = mount(EditorFixture, {
			defaultValue: 'x',
			language: 'javascript',
			path: 'file:///lang.ts',
		});
		try {
			await settle();
			expect(monaco.__editors[0]!.getModel()!._language).toBe('javascript');
			view.update(EditorFixture, {
				defaultValue: 'x',
				language: 'typescript',
				path: 'file:///lang.ts',
			});
			await settle();
			expect(monaco.__editors[0]!.getModel()!._language).toBe('typescript');
		} finally {
			act(() => view.unmount());
		}
	});

	it('applies theme on mount and on update', async () => {
		const view = mount(EditorFixture, {
			defaultValue: 'x',
			theme: 'light',
		});
		try {
			await settle();
			expect(monaco.__getTheme()).toBe('light');
			view.update(EditorFixture, {
				defaultValue: 'x',
				theme: 'vs-dark',
			});
			await settle();
			expect(monaco.__getTheme()).toBe('vs-dark');
		} finally {
			act(() => view.unmount());
		}
	});

	it('swaps path models and restores saved view state', async () => {
		const view = mount(EditorFixture, {
			defaultValue: 'one',
			path: 'file:///a.ts',
			saveViewState: true,
		});
		try {
			await settle();
			const editor = monaco.__editors[0]!;
			expect(editor.getModel()!.uri.toString()).toBe('file:///a.ts');
			// Force a distinct saved view-state for path A before switching away.
			editor.saveViewState();
			view.update(EditorFixture, {
				defaultValue: 'two',
				path: 'file:///b.ts',
				saveViewState: true,
			});
			await settle();
			expect(editor.getModel()!.uri.toString()).toBe('file:///b.ts');
			view.update(EditorFixture, {
				defaultValue: 'one',
				path: 'file:///a.ts',
				saveViewState: true,
			});
			await settle();
			expect(editor.getModel()!.uri.toString()).toBe('file:///a.ts');
			expect(editor._restoredViewState).toEqual({ scrollTop: expect.any(Number) });
		} finally {
			act(() => view.unmount());
		}
	});

	it('fires onValidate when markers change for the editor model', async () => {
		const onValidate = vi.fn();
		const view = mount(EditorFixture, {
			defaultValue: 'const x: number = 1;',
			language: 'typescript',
			path: 'file:///validate.ts',
			onValidate,
		});
		try {
			await settle();
			const model = monaco.__editors[0]!.getModel()!;
			const markers = [{ severity: 8, message: 'demo' }];
			monaco.__setMarkers(model.uri, markers);
			monaco.__emitMarkers([model.uri]);
			await settle(2);
			expect(onValidate).toHaveBeenCalled();
			expect(onValidate.mock.calls[0]![0]).toEqual(markers);
		} finally {
			act(() => view.unmount());
		}
	});

	it('runs beforeMount, reveals line, and applies options updates', async () => {
		const beforeMount = vi.fn();
		const view = mount(EditorFixture, {
			defaultValue: 'line1\nline2\nline3',
			line: 2,
			options: { fontSize: 14 },
			beforeMount,
		});
		try {
			await settle();
			expect(beforeMount).toHaveBeenCalledTimes(1);
			expect(beforeMount.mock.calls[0]![0]).toBe(monaco);
			expect(monaco.__editors[0]!._revealedLine).toBe(2);
			expect(monaco.__editors[0]!._options.fontSize).toBe(14);
			view.update(EditorFixture, {
				defaultValue: 'line1\nline2\nline3',
				line: 3,
				options: { fontSize: 18 },
				beforeMount,
			});
			await settle();
			expect(monaco.__editors[0]!._revealedLine).toBe(3);
			expect(monaco.__editors[0]!._options.fontSize).toBe(18);
		} finally {
			act(() => view.unmount());
		}
	});
});
