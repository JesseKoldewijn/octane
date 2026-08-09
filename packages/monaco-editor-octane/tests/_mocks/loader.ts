import monaco, { type Monaco } from './monaco';

let instance: Monaco | null = null;
let canceled = false;

type Cancelable = Promise<Monaco> & { cancel(): void };

function init(): Cancelable {
	canceled = false;
	const promise = Promise.resolve().then(() => {
		if (canceled) {
			const error = new Error('cancelation') as Error & { type?: string };
			error.type = 'cancelation';
			throw error;
		}
		instance = monaco;
		return monaco;
	}) as Cancelable;
	promise.cancel = () => {
		canceled = true;
	};
	return promise;
}

const loader = {
	init,
	config() {},
	__getMonacoInstance(): Monaco | null {
		return instance;
	},
	__reset() {
		instance = null;
		canceled = false;
		monaco.__reset();
	},
};

export default loader;
