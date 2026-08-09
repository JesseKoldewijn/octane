import { useEffect, useRef } from 'octane';

import { splitSlot, subSlot } from '../../internal';

type EffectCallback = () => void | (() => void);
type DependencyList = readonly unknown[];

function useUpdate(...args: unknown[]) {
	const [userArgs, slot] = splitSlot(args);
	const effect = userArgs[0] as EffectCallback;
	const deps = userArgs[1] as DependencyList;
	const applyChanges = (userArgs[2] as boolean | undefined) ?? true;

	const isInitialMount = useRef(true, subSlot(slot, 'update:initial'));

	useEffect(
		isInitialMount.current || !applyChanges
			? () => {
					isInitialMount.current = false;
				}
			: effect,
		deps as unknown[] | null,
		subSlot(slot, 'update:effect'),
	);
}

export default useUpdate;
