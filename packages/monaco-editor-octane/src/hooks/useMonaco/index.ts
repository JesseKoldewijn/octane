import loader from '@monaco-editor/loader';
import { useState } from 'octane';

import { splitSlot, subSlot } from '../../internal';
import useMount from '../useMount';
import type { Monaco } from '../..';

function useMonaco(...args: unknown[]): Monaco | null {
	const [, slot] = splitSlot(args);
	const [monaco, setMonaco] = useState<Monaco | null>(
		loader.__getMonacoInstance(),
		subSlot(slot, 'monaco:state'),
	);

	useMount(
		() => {
			let cancelable: ReturnType<typeof loader.init> | undefined;

			if (!monaco) {
				cancelable = loader.init();

				cancelable.then((instance) => {
					setMonaco(instance);
				});
			}

			return () => cancelable?.cancel();
		},
		subSlot(slot, 'monaco:mount'),
	);

	return monaco;
}

export default useMonaco;
