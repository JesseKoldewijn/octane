# @octanejs/grab

Select context for coding agents directly from your Octane website. This is an
API-compatible port of [`react-grab@0.2.0`](https://github.com/aidenybai/react-grab)
that keeps the Solid overlay UI and replaces React Fiber inspection (`bippy`)
with Octane's `octane/inspect` adapter.

## Installation

```sh
npm install @octanejs/grab octane solid-js @react-grab/cli
```

```sh
pnpm add @octanejs/grab octane solid-js @react-grab/cli
```

## Usage

```ts
import { init } from '@octanejs/grab';
import '@octanejs/grab/styles.css';

const api = init();
// Prefer the Octane global; `__REACT_GRAB__` remains as a compatibility alias.
```

Primitives such as `isElementGrabbable`, `freeze`, and `unfreeze` are available
from `@octanejs/grab/primitives`.

See `UPSTREAM.md` for the export crosswalk, license boundary, and known gaps
(CLI bin packaging, Next/R3F-specific paths).
