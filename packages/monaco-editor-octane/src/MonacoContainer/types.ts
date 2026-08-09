import type { OctaneNode } from 'octane';

export type ContainerProps = {
	width: number | string;
	height: number | string;
	isEditorReady: boolean;
	loading: OctaneNode | string;
	/** Host div ref — Octane refs-as-props (upstream used internal `_ref`). */
	ref: { current: HTMLDivElement | null };
	className?: string;
	wrapperProps?: Record<string, unknown>;
};
