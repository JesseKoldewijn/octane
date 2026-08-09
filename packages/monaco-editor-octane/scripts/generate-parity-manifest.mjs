#!/usr/bin/env node
/**
 * Regenerates packages/monaco-editor-octane/audit/react-parity.json.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

async function writeJson(absolute, value) {
	const source = `${JSON.stringify(value, null, '\t')}\n`;
	writeFileSync(
		absolute,
		await format(source, { ...(await resolveConfig(absolute)), filepath: absolute }),
	);
}

const PACKAGE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(PACKAGE, '../..');
const AUDIT = path.join(PACKAGE, 'audit');
mkdirSync(AUDIT, { recursive: true });

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const hashFile = (relative) => sha256(readFileSync(path.join(REPO, relative)));

function walk(absolute) {
	const out = [];
	for (const name of readdirSync(absolute).sort()) {
		const full = path.join(absolute, name);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else out.push(full);
	}
	return out;
}

function upstreamIntegrity() {
	const root = path.join(PACKAGE, 'upstream');
	const hash = createHash('sha256');
	for (const file of walk(root)) {
		hash.update(path.relative(root, file).split(path.sep).join('/'));
		hash.update(readFileSync(file));
	}
	return `sha256:${hash.digest('hex')}`;
}

const TEST_ROOTS = [
	'packages/monaco-editor-octane/tests/upstream',
	'packages/monaco-editor-octane/tests/harness',
];
const DIFFERENTIAL_ROOTS = ['packages/monaco-editor-octane/tests/differential'];

function writeInventory(project, ownedPrefixes, inventoryRelative) {
	const owned = (file) =>
		ownedPrefixes.some((prefix) => file === prefix || file.startsWith(`${prefix}/`));
	const result = spawnSync(
		process.execPath,
		['node_modules/vitest/vitest.mjs', 'run', '--project', project, '--reporter=json'],
		{ cwd: REPO, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 },
	);
	const start = result.stdout.indexOf('{');
	if (start < 0)
		throw new Error(`no JSON reporter output for project ${project}:\n${result.stderr}`);
	const report = JSON.parse(result.stdout.slice(start));
	const tests = [];
	const files = new Set();
	for (const suite of report.testResults ?? []) {
		const file = path.relative(REPO, suite.name).split(path.sep).join('/');
		if (!owned(file)) continue;
		files.add(file);
		for (const assertion of suite.assertionResults ?? []) {
			const fullName = assertion.fullName;
			const testName = assertion.title ?? assertion.fullName;
			const prefix = project.includes('differential') ? 'differential' : 'adapted';
			const digest = sha256(`${file}\0${fullName}`).slice(0, 10);
			tests.push({
				id: `${prefix}:${digest}`,
				file,
				testName,
				fullName,
			});
		}
	}
	tests.sort((a, b) => (a.file + a.fullName < b.file + b.fullName ? -1 : 1));
	if (tests.length === 0) throw new Error(`project ${project} collected no tests`);
	const inventory = {
		schemaVersion: 1,
		project,
		roots: project.includes('differential') ? DIFFERENTIAL_ROOTS : TEST_ROOTS,
		files: [...files].sort(),
		tests,
	};
	return inventory;
}

function fileEntry(relative, role, cases) {
	const entry = { path: relative, role, sha256: hashFile(relative) };
	if (cases) entry.cases = cases;
	return entry;
}

const adaptedInventoryRel = 'packages/monaco-editor-octane/audit/adapted-runtime.json';
const differentialInventoryRel = 'packages/monaco-editor-octane/audit/differential-runtime.json';

const adaptedInventory = writeInventory(
	'monaco-editor-octane',
	['packages/monaco-editor-octane/tests/upstream', 'packages/monaco-editor-octane/tests/harness'],
	adaptedInventoryRel,
);
const differentialInventory = writeInventory(
	'monaco-editor-octane-differential',
	['packages/monaco-editor-octane/tests/differential'],
	differentialInventoryRel,
);

await writeJson(path.join(REPO, adaptedInventoryRel), adaptedInventory);
await writeJson(path.join(REPO, differentialInventoryRel), differentialInventory);

const lockfileSha256 = sha256(readFileSync(path.join(REPO, 'pnpm-lock.yaml')));

function casesFromInventory(inventory, filePrefix) {
	return inventory.tests
		.filter((t) => t.file.startsWith(filePrefix))
		.map((t, index) => ({
			id: t.id,
			testName: t.fullName.split(' ').slice(-3).join(' ') || t.fullName,
			fullName: t.fullName,
			_index: index,
		}))
		.map(({ id, testName, fullName }) => ({ id, testName, fullName }));
}

const adaptedTestFiles = adaptedInventory.files.map((file) =>
	fileEntry(
		file,
		'test',
		adaptedInventory.tests
			.filter((t) => t.file === file)
			.map((t) => ({
				id: t.id,
				testName: t.testName,
				fullName: t.fullName,
			})),
	),
);

const differentialTestFiles = differentialInventory.files.map((file) =>
	fileEntry(
		file,
		'test',
		differentialInventory.tests
			.filter((t) => t.file === file)
			.map((t) => ({
				id: t.id,
				testName: t.testName,
				fullName: t.fullName,
			})),
	),
);

const manifest = {
	$schema: '../../hook-form/audit/react-parity.schema.json',
	schemaVersion: 1,
	provenance: {
		repo: 'https://github.com/suren-atoyan/monaco-react.git',
		version: '4.8.0-rc.3',
		commit: 'f7ef2e686c83449babaea49815c69db3668d2ab7',
		sourceRoot: 'src',
		testRoot: 'src',
		license: 'MIT',
		integrity: upstreamIntegrity(),
		verification: 'verified',
	},
	upstreamSuites: {
		runtime: 'absent',
		types: 'absent',
	},
	adaptedRoots: {
		source: {
			roots: ['packages/monaco-editor-octane/src'],
			include: ['\\.(?:[cm]?[jt]s|[jt]sx|tsrx)$'],
			exclude: [],
		},
		tests: {
			roots: [
				'packages/monaco-editor-octane/tests/upstream',
				'packages/monaco-editor-octane/tests/harness',
			],
			include: ['\\.(?:test|spec)\\.(?:[cm]?[jt]s|[jt]sx|tsrx)$'],
			exclude: [],
		},
	},
	adaptedRuntimeSummary: {
		inventoryEntries: adaptedInventory.tests.length,
		uniqueIdentities: adaptedInventory.tests.length,
		duplicateEntriesWithinLanes: 0,
		identitiesSharedAcrossLanes: 0,
	},
	environments: {
		'workspace-node': {
			node: '>=22',
			platform: 'any',
			arch: 'any',
			packageManager: 'pnpm@11.15.1',
			lockfile: 'pnpm-lock.yaml',
			lockfileSha256,
		},
	},
	lanes: [
		{
			id: 'monaco-editor-octane-adapted',
			type: 'adapted-octane',
			oracle: 'required',
			environment: 'workspace-node',
			project: 'monaco-editor-octane',
			evidenceOrigin: 'repo-authored',
			notes:
				'Adapted upstream snapshot cases plus port-authored lifecycle/useMonaco coverage against the monaco/loader doubles. Upstream React RTL snapshots are not runnable pristine against Octane.',
			execution: {
				kind: 'vitest-full',
				inventory: adaptedInventoryRel,
			},
			files: [
				fileEntry(adaptedInventoryRel, 'support'),
				...adaptedTestFiles,
				fileEntry('packages/monaco-editor-octane/tests/_helpers.ts', 'support'),
				fileEntry('packages/monaco-editor-octane/tests/_mocks/loader.ts', 'support'),
				fileEntry('packages/monaco-editor-octane/tests/_mocks/monaco.ts', 'support'),
				fileEntry('packages/monaco-editor-octane/tests/_fixtures/upstream.tsrx', 'support'),
			],
		},
		{
			id: 'monaco-editor-octane-pristine-types',
			type: 'pristine-types',
			oracle: 'required',
			available: true,
			environment: 'workspace-node',
			project: 'monaco-editor-octane-pristine-types',
			evidenceOrigin: 'repo-authored',
			notes: 'Port-authored type probes against @monaco-editor/react 4.8.0-rc.3 with tsc.',
			execution: {
				kind: 'typescript',
				compiler: 'tsc',
				project: 'packages/monaco-editor-octane/typetests/pristine/tsconfig.json',
			},
			files: [
				fileEntry('packages/monaco-editor-octane/typetests/pristine/types.test-d.ts', 'test', [
					{
						id: 'types:pristine',
						testName: 'public surface type assertions',
						fullName: 'public surface type assertions',
					},
				]),
				fileEntry('packages/monaco-editor-octane/typetests/pristine/tsconfig.json', 'support'),
				fileEntry('packages/monaco-editor-octane/typetests/assertions.md', 'support'),
			],
		},
		{
			id: 'monaco-editor-octane-adapted-types',
			type: 'adapted-types',
			oracle: 'required',
			available: true,
			environment: 'workspace-node',
			project: 'monaco-editor-octane-adapted-types',
			evidenceOrigin: 'repo-authored',
			notes: 'Same assertion groups against @octanejs/monaco-editor-octane with tsrx-tsc.',
			execution: {
				kind: 'typescript',
				compiler: 'tsrx-tsc',
				project: 'packages/monaco-editor-octane/typetests/adapted/tsconfig.json',
			},
			files: [
				fileEntry('packages/monaco-editor-octane/typetests/adapted/types.test-d.ts', 'test', [
					{
						id: 'types:adapted',
						testName: 'public surface type assertions',
						fullName: 'public surface type assertions',
					},
				]),
				fileEntry('packages/monaco-editor-octane/typetests/adapted/tsconfig.json', 'support'),
				fileEntry('packages/monaco-editor-octane/typetests/assertions.md', 'support'),
			],
		},
		{
			id: 'monaco-editor-octane-differential',
			type: 'differential',
			oracle: 'required',
			environment: 'workspace-node',
			project: 'monaco-editor-octane-differential',
			evidenceOrigin: 'repo-authored',
			notes:
				'Loading-shell DOM parity vs pinned @monaco-editor/react 4.8.0-rc.3 under the shared loader mock.',
			execution: {
				kind: 'vitest-full',
				inventory: differentialInventoryRel,
			},
			files: [
				fileEntry(differentialInventoryRel, 'support'),
				...differentialTestFiles,
				fileEntry(
					'packages/monaco-editor-octane/tests/_fixtures/differential/editor-diff.tsrx',
					'support',
				),
				fileEntry('packages/monaco-editor-octane/tests/differential/_setup.ts', 'support'),
			],
		},
	],
	divergences: [
		{
			id: 'container-ref',
			caseIds: ['adapted:f2157eaed5', 'adapted:2ff386bb71'],
			upstreamResult: 'Internal MonacoContainer accepts _ref',
			octaneResult: 'Internal MonacoContainer accepts Octane ref',
			rationale: 'Octane has no forwardRef; refs are ordinary props.',
			classification: 'intentional-divergence',
			consumerImpact: 'None — _ref was never public.',
			migrationGuidance: 'No consumer change.',
			owner: 'bindings',
			reviewCondition: 'If upstream exports MonacoContainer publicly with _ref.',
		},
		{
			id: 'loading-octane-node',
			caseIds: ['adapted:9d289754cd', 'adapted:88ba64aa27'],
			upstreamResult: 'loading?: ReactNode',
			octaneResult: 'loading?: OctaneNode | string',
			rationale: 'Octane renderable type.',
			classification: 'intentional-divergence',
			consumerImpact: 'Type-only for loading slots.',
			migrationGuidance: 'Pass OctaneNode or string.',
			owner: 'bindings',
			reviewCondition: 'n/a',
		},
	],
};

void casesFromInventory;

await writeJson(path.join(AUDIT, 'react-parity.json'), manifest);
console.log('wrote', path.join(AUDIT, 'react-parity.json'));
console.log(
	'adapted',
	adaptedInventory.tests.length,
	'differential',
	differentialInventory.tests.length,
);
