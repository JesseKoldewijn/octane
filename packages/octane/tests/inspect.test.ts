import { describe, it, expect } from 'vitest';
import { mount } from './_helpers.js';
import {
	getOwnerFromHostInstance,
	getOwnerStackFromHost,
	isInstrumentationActive,
	pauseUpdates,
} from '../src/inspect.js';
import { InspectCounter, InspectLabel } from './_fixtures/inspect.tsrx';

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
