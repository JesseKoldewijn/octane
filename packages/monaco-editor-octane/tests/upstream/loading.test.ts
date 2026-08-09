import { afterEach, describe, expect, it } from 'vitest';
import { act, mount } from '../_helpers';
import { LoadingFixture } from '../_fixtures/upstream.tsrx';

afterEach(() => {
	document.body.innerHTML = '';
});

describe('<Loading />', () => {
	// Per upstream/src/Loading/index.spec.tsx:6
	// OCTANE DIVERGENCE[loading-octane-node][adapted:9d289754cd]: loading accepts OctaneNode | string
	// @parity-case adapted:9d289754cd
	it('should check render with snapshot', () => {
		const view = mount(LoadingFixture, {});
		try {
			const el = view.container.firstElementChild as HTMLElement;
			expect(el?.tagName).toBe('DIV');
			expect(el.style.display).toBe('flex');
			expect(el.style.height).toBe('100%');
			expect(el.style.width).toBe('100%');
			expect(el.style.justifyContent).toBe('center');
			expect(el.style.alignItems).toBe('center');
		} finally {
			act(() => view.unmount());
		}
	});

	// Per upstream/src/Loading/index.spec.tsx:12
	// @parity-case adapted:fd6f96e4b6
	it('should check is it wrapped with <div />', () => {
		const view = mount(LoadingFixture, {});
		try {
			expect((view.container.firstChild as HTMLElement)?.tagName).toBe('DIV');
		} finally {
			act(() => view.unmount());
		}
	});

	// Per upstream/src/Loading/index.spec.tsx:24
	// OCTANE DIVERGENCE[loading-octane-node][adapted:88ba64aa27]: loading children are OctaneNode | string
	// @parity-case adapted:88ba64aa27
	it('should check content', () => {
		const content = 'Loading...';
		const view = mount(LoadingFixture, { children: content });
		try {
			expect(view.container.textContent).toBe(content);
		} finally {
			act(() => view.unmount());
		}
	});
});
