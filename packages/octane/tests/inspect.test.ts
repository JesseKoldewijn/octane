import { describe, it, expect } from 'vitest';
import { mount } from './_helpers.js';
import {
	getOwnerFromHostInstance,
	getOwnerStackFromHost,
	isInstrumentationActive,
	pauseUpdates,
} from '../src/inspect.js';
import { InspectCounter, InspectLabel } from './_fixtures/inspect.tsrx';
import { InspectOuter } from './_fixtures/inspect-nested.tsx';

describe('octane/inspect', () => {
	it('registers roots and maps host nodes to owners', () => {
		const r = mount(InspectLabel, { text: 'hello' });
		expect(isInstrumentationActive()).toBe(true);
		const host = r.find('[data-testid="label"]');
		const owner = getOwnerFromHostInstance(host);
		expect(owner).not.toBeNull();
		expect(typeof owner!.displayName).toBe('string');
		expect(getOwnerStackFromHost(host).length).toBeGreaterThan(0);
		r.unmount();
	});

	it('maps nested single-root hosts through the owner stack', () => {
		const r = mount(InspectOuter);
		const inner = r.find('[data-testid="inspect-inner"]');
		const owner = getOwnerFromHostInstance(inner);
		expect(owner).not.toBeNull();
		const stackNames = getOwnerStackFromHost(inner).map((frame) => frame.name);
		const dump = JSON.stringify({ owner: owner!.displayName, stackNames });
		// Before single-root marker containment, the walk stopped at the root and
		// never reached nested component frames.
		expect(stackNames, dump).toContain('InspectInner');
		expect(stackNames, dump).toContain('InspectOuter');
		r.unmount();
	});

	it('pauses scheduled updates until resume', async () => {
		let setCount: ((n: number) => void) | undefined;
		const r = mount(InspectCounter, {
			expose(set) {
				setCount = set;
			},
		});
		expect(r.find('[data-testid="count"]').textContent).toBe('0');

		const resume = pauseUpdates();
		setCount!(1);
		await Promise.resolve();
		expect(r.find('[data-testid="count"]').textContent).toBe('0');

		resume();
		await Promise.resolve();
		await Promise.resolve();
		expect(r.find('[data-testid="count"]').textContent).toBe('1');
		r.unmount();
	});
});
