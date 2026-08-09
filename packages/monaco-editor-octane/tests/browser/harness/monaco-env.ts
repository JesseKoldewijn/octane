/**
 * Browser harness uses the loader CDN defaults so workers resolve without a
 * bundler worker plugin. The example app documents the Vite `?worker` recipe.
 */
import { loader } from '@octanejs/monaco-editor-octane';

// Keep the default CDN paths from @monaco-editor/loader.
loader.config({
	paths: {
		vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs',
	},
});
