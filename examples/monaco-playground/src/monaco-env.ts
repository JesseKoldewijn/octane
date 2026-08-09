/**
 * Default consumer recipe: npm `monaco-editor@0.56.0` via Vite `?worker` imports
 * and `loader.config({ monaco })`. monaco-editor 0.56 exports map as
 * `monaco-editor/<path>` → `esm/vs/<path>.js` (do not prefix `esm/vs/` in the
 * specifier or resolution double-prefixes).
 *
 * CSS is not on the package exports map — Vite aliases
 * `monaco-editor/editor/editor.main.css` to `min/vs/editor/editor.main.css`.
 *
 * CDN AMD `loader.config({ paths: { vs } })` remains a documented alternate in
 * the package README for apps that intentionally avoid bundling Monaco.
 */
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';
import { loader } from '@octanejs/monaco-editor-octane';
import 'monaco-editor/editor/editor.main.css';

globalThis.MonacoEnvironment = {
	getWorker(_workerId: string, label: string): Worker {
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
