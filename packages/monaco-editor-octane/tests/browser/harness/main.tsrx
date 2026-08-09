import './monaco-env';
import Editor, { DiffEditor } from '@octanejs/monaco-editor-octane';
import { createRoot, useState } from 'octane';

function App() @{
	const [value, setValue] = useState('const answer = 42;\n');
	const [ready, setReady] = useState(false);
	const [mounted, setMounted] = useState(true);

	<div>
		<h1>Monaco browser harness</h1>
		<button
			type="button"
			data-testid="remount"
			onClick={() => {
				setReady(false);
				setMounted(false);
				queueMicrotask(() => setMounted(true));
			}}
		>
			Remount
		</button>
		<div class="editor-host" data-editor-ready={ready ? 'true' : 'false'}>
			@if (mounted) {
				<Editor
					height="320px"
					defaultLanguage="typescript"
					value={value}
					onChange={(next) => setValue(next ?? '')}
					onMount={() => setReady(true)}
				/>
			}
		</div>
		<section data-testid="diff-host" style={{ height: '200px' }}>
			<DiffEditor height="200px" original="a" modified="b" language="plaintext" />
		</section>
		<pre data-testid="value">{value as string}</pre>
	</div>
}

const root = createRoot(document.getElementById('root')!);
root.render(App);
