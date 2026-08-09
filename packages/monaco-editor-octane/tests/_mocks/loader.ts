import monaco, { type Monaco } from './monaco';

let instance: Monaco | null = null;
let canceled = false;
let holdInit = false;
let pendingResolvers: Array<(value: Monaco) => void> = [];

type Cancelable = Promise<Monaco> & { cancel(): void };

function init(): Cancelable {
	canceled = false;
	if (holdInit) {
		const promise = new Promise<Monaco>((resolve, reject) => {
			pendingResolvers.push((value) => {
				if (canceled) {
					const error = new Error('cancelation') as Error & { type?: string };
					error.type = 'cancelation';
					reject(error);
					return;
				}
				instance = value;
				resolve(value);
			});
		}) as Cancelable;
		promise.cancel = () => {
			canceled = true;
		};
		return promise;
	}
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
	__reset(options?: { holdInit?: boolean }) {
		instance = null;
		canceled = false;
		holdInit = options?.holdInit === true;
		pendingResolvers = [];
		monaco.__reset();
	},
	__releaseInit() {
		const resolvers = pendingResolvers.splice(0, pendingResolvers.length);
		for (const resolve of resolvers) resolve(monaco);
	},
};

export default loader;
