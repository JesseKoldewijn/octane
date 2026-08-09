import { useEffect } from 'octane';

import { splitSlot, subSlot } from '../../internal';

type EffectCallback = () => void | (() => void);

function useMount(effect: EffectCallback, ...args: unknown[]) {
	const [, slot] = splitSlot(args);
	useEffect(effect, [], subSlot(slot, 'mount'));
}

export default useMount;
