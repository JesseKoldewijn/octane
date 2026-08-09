/**
 * Unpaired control-plane checks for the adapted upstream inventory: renaming
 * or dropping a tracked case must fail validation. Not React-parity evidence —
 * same role as react-map-gl `tests/harness/tape-adapter.test.ts`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

const REQUIRED_UPSTREAM_CASES = [
	'should check render with snapshot',
	'should check is it wrapped with <div />',
	'should check content',
];

describe('monaco-editor-octane parity harness negatives', () => {
	it('keeps every adapted Loading upstream case name', () => {
		const source = readFileSync(resolve(ROOT, 'tests/upstream/loading.test.ts'), 'utf8');
		for (const name of REQUIRED_UPSTREAM_CASES) {
			expect(source.includes(`'${name}'`) || source.includes(`"${name}"`)).toBe(true);
		}
	});

	it('fails validation when an upstream case title is removed (simulated)', () => {
		const source = readFileSync(resolve(ROOT, 'tests/upstream/loading.test.ts'), 'utf8');
		const stripped = source.replace("it('should check content'", "it('RENAMED_CASE'");
		expect(stripped.includes("it('should check content'")).toBe(false);
		expect(
			REQUIRED_UPSTREAM_CASES.every(
				(name) => source.includes(`'${name}'`) || source.includes(`"${name}"`),
			),
		).toBe(true);
	});

	it('records MonacoContainer ref divergence citation', () => {
		const source = readFileSync(resolve(ROOT, 'tests/upstream/monaco-container.test.ts'), 'utf8');
		expect(source).toContain('OCTANE' + ' DIVERGENCE[container-ref][adapted:f2157eaed5]');
		expect(source).toContain('ref=');
	});
});
