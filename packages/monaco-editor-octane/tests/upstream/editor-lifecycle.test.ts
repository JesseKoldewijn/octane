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
	// @parity-case adapted:c4d6ff1c6a
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

	// @parity-case adapted:e453d061c4
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

	// @parity-case adapted:47b1162701
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

	// @parity-case adapted:f1eb7c31d0
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

	// @parity-case adapted:e27f5a89fe
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
});
