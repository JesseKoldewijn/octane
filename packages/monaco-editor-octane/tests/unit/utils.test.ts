import { beforeEach, describe, expect, it } from 'vitest';
import { getOrCreateModel } from '../../src/utils';
import monaco from '../_mocks/monaco';

beforeEach(() => {
	monaco.__reset();
});

describe('getOrCreateModel', () => {
	it('creates a model for a new path and reuses it', () => {
		const first = getOrCreateModel(monaco as any, 'alpha', 'typescript', 'file:///a.ts');
		const second = getOrCreateModel(monaco as any, 'ignored', 'typescript', 'file:///a.ts');
		expect(first).toBe(second);
		expect(first.getValue()).toBe('alpha');
	});
});
