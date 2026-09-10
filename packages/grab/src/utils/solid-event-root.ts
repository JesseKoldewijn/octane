/**
 * Solid's `delegateEvents()` attaches to `document` by default and walks
 * `composedPath()` looking for `el[$$event]` function slots. Octane publishes
 * the same keys with HandlerBundle values, so a click on app DOM makes Solid
 * throw `handler.call is not a function`.
 *
 * Rebind Solid's delegated listeners onto the grab overlay shadow root so its
 * walker never enters Octane-managed light DOM.
 */
import { clearDelegatedEvents, delegateEvents } from 'solid-js/web';

const SOLID_DELEGATE_KEY = '_$DX_DELEGATE';

type DelegateRoot = Document | ShadowRoot;

let solidEventRoot: DelegateRoot | null = null;

function readRegisteredNames(root: DelegateRoot): string[] {
	const registered = (root as DelegateRoot & { [SOLID_DELEGATE_KEY]?: Set<string> })[
		SOLID_DELEGATE_KEY
	];
	return registered ? [...registered] : [];
}

/** Move Solid document listeners onto the overlay shadow root (idempotent). */
export function bindSolidDelegatedEventsToRoot(root: ShadowRoot): void {
	const documentNames = readRegisteredNames(document);
	const previousRootNames =
		solidEventRoot && solidEventRoot !== document ? readRegisteredNames(solidEventRoot) : [];
	clearDelegatedEvents(document);
	if (solidEventRoot && solidEventRoot !== document && solidEventRoot !== root) {
		clearDelegatedEvents(solidEventRoot as Document);
	}
	solidEventRoot = root;
	const names = [...new Set([...documentNames, ...previousRootNames])];
	if (names.length > 0) {
		delegateEvents(names, root as unknown as Document);
	}
}

/**
 * Redirect document add/removeEventListener used by Solid's delegateEvents
 * onto the overlay shadow root once it is known.
 */
export function installSolidDocumentListenerRedirect(): () => void {
	const proto = EventTarget.prototype;
	const originalAdd = proto.addEventListener;
	const originalRemove = proto.removeEventListener;
	const resolveTarget = (target: EventTarget): EventTarget =>
		target === document && solidEventRoot !== null && solidEventRoot !== document
			? solidEventRoot
			: target;
	proto.addEventListener = function (
		this: EventTarget,
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | AddEventListenerOptions,
	): void {
		return originalAdd.call(resolveTarget(this), type, listener as EventListener, options);
	};
	proto.removeEventListener = function (
		this: EventTarget,
		type: string,
		listener: EventListenerOrEventListenerObject | null,
		options?: boolean | EventListenerOptions,
	): void {
		return originalRemove.call(resolveTarget(this), type, listener as EventListener, options);
	};
	return () => {
		proto.addEventListener = originalAdd;
		proto.removeEventListener = originalRemove;
	};
}
