# `@octanejs/monaco-editor-octane`

Octane bindings for [Monaco Editor](https://microsoft.github.io/monaco-editor/),
ported from [`@monaco-editor/react`](https://github.com/suren-atoyan/monaco-react)
`4.8.0-rc.3` (master tip `f7ef2e6`).

```bash
pnpm add @octanejs/monaco-editor-octane monaco-editor octane
```

```tsrx
import Editor, { DiffEditor, useMonaco, loader } from '@octanejs/monaco-editor-octane';

function App() @{
	<Editor
		height="400px"
		defaultLanguage="typescript"
		defaultValue="// hello"
		onChange={(value) => console.log(value)}
	/>
}
```

## Compatibility

| Upstream | Octane |
| --- | --- |
| `loading?: ReactNode` | `loading?: OctaneNode \| string` |
| Internal `_ref` on MonacoContainer | Octane `ref` on the host div (internal only) |
| React `memo` | Octane `memo` |
| Library `onChange` | **Same name** (not DOM `onInput`) |

See `UPSTREAM.md` for the full export crosswalk and `status.json` for the
binding scorecard.

## Loader and workers

The package re-exports `@monaco-editor/loader`. The recommended v1 recipe (used
by `examples/monaco-playground` and the package Chromium harness) pins the AMD
build from the CDN so language workers resolve without a bundler worker plugin:

```ts
import { loader } from '@octanejs/monaco-editor-octane';

loader.config({
	paths: {
		vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs',
	},
});
```

For a fully bundled Vite app, configure `loader.config({ monaco })` plus
`MonacoEnvironment.getWorker` with `monaco-editor/.../*.worker?worker` imports
instead (worker entry paths vary by `monaco-editor` minor).

Give the editor a non-zero height (default `height`/`width` are `100%`, and
`automaticLayout` is on).

Working consumer recipe: [`examples/monaco-playground`](../../examples/monaco-playground).

## SSR / Hydrate

Do not call `loader.init()` on the server. `Editor` / `DiffEditor` render a
loading shell during SSR; after `hydrateRoot`, effects create the editor. Prefer
client-only mount or Octane `lazy` when the page does not need the shell in HTML.

## Multi-model

`path` / `defaultPath` create models via `monaco.Uri.parse`. View state is kept
in a process-global `Map` (same as upstream) when `saveViewState` is true.
