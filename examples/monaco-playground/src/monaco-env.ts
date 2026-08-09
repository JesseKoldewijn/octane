/**
 * Consumer recipe: pin the Monaco AMD build from the CDN so language workers
 * load without a bundler worker plugin. For a fully bundled Vite setup, swap
 * this for `loader.config({ monaco })` plus `MonacoEnvironment.getWorker` with
 * `monaco-editor/.../ *.worker?worker` imports (see package README).
 */
import { loader } from '@octanejs/monaco-editor-octane';

loader.config({
	paths: {
		vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs',
	},
});
