# Upstream @monaco-editor/react audit

This port targets `@monaco-editor/react@4.8.0-rc.3` at master tip
`f7ef2e686c83449babaea49815c69db3668d2ab7` (README-only ahead of npm tag
`c94cd77eb45e34473ae75711eede15523fbd25e4`). The tip includes remount-safe
Editor dispose (`editorRef` / `preventCreation` / `isEditorReady` cleared).

- repository: `https://github.com/suren-atoyan/monaco-react`
- package version: `4.8.0-rc.3`
- vendored commit: `f7ef2e686c83449babaea49815c69db3668d2ab7`
- source root: `src/`; tests live beside source as `*.spec.tsx`
- license: MIT, Copyright (c) 2018 Suren Atoyan

Advertised peers match upstream: `monaco-editor >= 0.25.0 < 1`, plus Octane
instead of React. The immutable Monaco oracle is `monaco-editor@0.56.0`.
Loader is reused as `@monaco-editor/loader@^1.7.0` (framework-neutral).

## Source boundary

Vendored byte-exact under `upstream/` (prettier-ignored, unpublished):

- `upstream/src/**` — React binding source + Vitest specs + snapshots
- `upstream/LICENSE`, `upstream/package.json`, `upstream/COMMIT`

Everything under `src/` is re-implemented against Octane hooks / `.tsrx`.
`@monaco-editor/loader` is imported unchanged (not vendored).

## Export crosswalk

Every runtime and type export of `src/index.ts` at the pin.

| Export | Kind | Disposition | Evidence |
| --- | --- | --- | --- |
| `Editor` (also `default`) | component | ported | `tests/upstream/editor-shell.test.ts`, `tests/upstream/editor-lifecycle.test.ts`, differential, browser, SSR |
| `DiffEditor` | component | ported | `tests/upstream/diff-editor-shell.test.ts`, `tests/upstream/diff-lifecycle.test.ts`, differential |
| `loader` | re-export | reused verbatim (`@monaco-editor/loader`) | shell tests + browser recipe |
| `useMonaco` | hook | ported | `tests/upstream/use-monaco.test.ts`, differential |
| `OnMount` / `BeforeMount` / `OnChange` / `OnValidate` / `EditorProps` | types | ported (`ReactNode`→`OctaneNode`) | typetests |
| `MonacoDiffEditor` / `DiffOnMount` / `DiffBeforeMount` / `DiffEditorProps` | types | ported | typetests |
| `Monaco` | type | ported | typetests |
| `Theme` | type | ported | typetests |

### Intentional divergences

| Surface | Notes |
| --- | --- |
| JSX dialect | `.tsrx` / `@jsxImportSource octane`; ship source, never compiler output |
| `loading` | `OctaneNode \| string` instead of `ReactNode` |
| MonacoContainer ref | Internal host uses Octane `ref` prop; upstream `_ref` dropped (not public) |
| `'use client'` | Omitted; browser-only via effects |
| `CSSProperties` | Plain style records |
| StrictMode double-invoke | N/A — not tested |

## Test disposition

| Upstream file | Disposition |
| --- | --- |
| `src/Loading/index.spec.tsx` | **ported** → `tests/upstream/loading.test.ts` (+ `.tsrx` fixture) |
| `src/MonacoContainer/index.spec.tsx` | **ported** → `tests/upstream/monaco-container.test.ts` (passes `ref=`, not `_ref`) |
| `src/Editor/index.spec.tsx` | **ported** → `tests/upstream/editor-shell.test.ts` (loader mocked) |
| `src/DiffEditor/index.spec.tsx` | **ported** → `tests/upstream/diff-editor-shell.test.ts` |
| `**/__snapshots__/*.snap` | Adapted to container HTML snapshots — RTL render-object snapshots are harness noise |

Upstream ships **no type tests**. Both type lanes are port-authored.

## Evidence lanes

- Adapted upstream shell/lifecycle suites (mocked loader + monaco doubles)
- React/Octane differential with pinned `@monaco-editor/react@4.8.0-rc.3`
- SSR loading shell / hydration adopt
- Package Chromium browser + workers (`tests/browser`)
- Example Playwright (`examples/monaco-playground`)
