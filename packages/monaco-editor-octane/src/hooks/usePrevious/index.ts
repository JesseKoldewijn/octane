import { useEffect, useRef } from 'octane';

import { splitSlot, subSlot } from '../../internal';

function usePrevious<T>(value: T, ...args: unknown[]): T | undefined {
	const [, slot] = splitSlot(args);
	const ref = useRef<T | undefined>(undefined, subSlot(slot, 'previous:ref'));

	useEffect(
		() => {
			ref.current = value;
		},
		[value],
		subSlot(slot, 'previous:effect'),
	);

	return ref.current;
}

export default usePrevious;
