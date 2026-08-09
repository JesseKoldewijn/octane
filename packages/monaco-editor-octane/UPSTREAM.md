# Upstream @monaco-editor/react audit

This port targets `@monaco-editor/react@4.8.0-rc.3` at master tip
`f7ef2e686c83449babaea49815c69db3668d2ab7` (README-only ahead of npm tag
`c94cd77eb45e34473ae75711eede15523fbd25e4`). The tip includes remount-safe
Editor dispose (`editorRef` / `preventCreation` / `isEditorReady` cleared).
Upstream DiffEditor at the same tip still omits that reset; this port applies
the same remount-safe dispose to DiffEditor so createDiffEditor can run again
after effect cleanup that preserves component state.

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
| `Editor` (also `default`) | component | ported | `tests/upstream/editor-shell.test.ts`, `tests/runtime/editor-lifecycle.test.ts`, differential, browser, SSR |
| `DiffEditor` | component | ported | `tests/upstream/diff-editor-shell.test.ts`, `tests/runtime/diff-lifecycle.test.ts`, differential |
| `loader` | re-export | reused verbatim (`@monaco-editor/loader`) | shell tests + browser recipe |
| `useMonaco` | hook | ported | `tests/runtime/use-monaco.test.ts`, differential |
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

## Port-authored test classification

| File | Classification | Pairing |
| --- | --- | --- |
| `tests/upstream/*.test.ts` | adapted upstream | re-authors the four upstream RTL snapshot specs only |
| `tests/runtime/*.test.ts` | Octane-only runtime contract | unpaired — lifecycle/useMonaco against monaco doubles; ordinary shards |
| `tests/differential/parity.test.ts` | React/Octane differential | pinned `@monaco-editor/react@4.8.0-rc.3` |
| `tests/ssr/ssr.test.ts` | Octane-only framework contract | unpaired — upstream ships no SSR suite |
| `tests/hydration/hydration.test.ts` | Octane-only framework contract | unpaired — hydration adoption is Octane's |
| `tests/unit/utils.test.ts` | Octane-only package contract | unpaired |
| `tests/browser/editor.browser.test.ts` | Octane-only browser contract | unpaired — real Monaco + workers |
| `tests/harness/negative-controls.test.ts` | harness negative controls | unpaired — inventory titles / divergence citation; not adapted-lane evidence |
| `typetests/{pristine,adapted}/types.test-d.ts` | port-authored type lanes | paired with each other through `typetests/assertions.md` |

## Evidence lanes

- Adapted upstream snapshot ports (Loading / MonacoContainer / Editor / DiffEditor shells)
- Port-authored runtime lifecycle/useMonaco suites (mocked loader + monaco doubles), including
  language/theme/path+viewState/onValidate/beforeMount/options and DiffEditor
  original/theme/paths/keep-flags/remount coverage — ordinary shards, not adapted inventory
- React/Octane differential with pinned `@monaco-editor/react@4.8.0-rc.3`
  (full-DOM loading-shell + held-init useMonaco pending `step`s)
- SSR loading shell / hydration adopt
- Package Chromium browser + npm workers (`tests/browser`), including language/theme
  sync and controlled-value remount
- Example Playwright (`examples/monaco-playground`) with language-worker + controlled
  value journey
