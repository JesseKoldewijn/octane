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

The package re-exports `@monaco-editor/loader`. Workers and CSS stay in the
consuming app.

### Default (recommended): npm `monaco-editor` + Vite workers

Pin the same `monaco-editor` minor your peer range resolves to (workspace
oracle / catalog: `0.56.0`). monaco-editor **0.56** maps
`monaco-editor/<path>` → `esm/vs/<path>.js` — do **not** prefix `esm/vs/` in
`?worker` imports (that double-prefixes and fails resolution).

```ts
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';
import { loader } from '@octanejs/monaco-editor-octane';
// CSS is not on the 0.56 package exports map — alias it in vite.config (see example).
import 'monaco-editor/editor/editor.main.css';

globalThis.MonacoEnvironment = {
	getWorker(_id, label) {
		switch (label) {
			case 'json':
				return new jsonWorker();
			case 'css':
			case 'scss':
			case 'less':
				return new cssWorker();
			case 'html':
			case 'handlebars':
			case 'razor':
				return new htmlWorker();
			case 'typescript':
			case 'javascript':
				return new tsWorker();
			default:
				return new editorWorker();
		}
	},
};

loader.config({ monaco });
```

Add a Vite alias so the CSS specifier resolves to
`monaco-editor/min/vs/editor/editor.main.css` (see
`examples/monaco-playground/vite.config.ts`).

Working consumer recipe: [`examples/monaco-playground`](../../examples/monaco-playground).

### Alternate: CDN AMD build

Apps that intentionally avoid bundling Monaco can keep the loader CDN paths:

```ts
import { loader } from '@octanejs/monaco-editor-octane';

loader.config({
	paths: {
		vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs',
	},
});
```

Give the editor a non-zero height (default `height`/`width` are `100%`, and
`automaticLayout` is on).

## SSR / Hydrate

Do not call `loader.init()` on the server. `Editor` / `DiffEditor` render a
loading shell during SSR; after `hydrateRoot`, effects create the editor. Prefer
client-only mount or Octane `lazy` when the page does not need the shell in HTML.

## Multi-model

`path` / `defaultPath` create models via `monaco.Uri.parse`. View state is kept
in a process-global `Map` (same as upstream) when `saveViewState` is true.
