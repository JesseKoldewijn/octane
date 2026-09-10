# Upstream boundary — `@octanejs/grab`

| Field | Value |
| --- | --- |
| Upstream package | `react-grab@0.2.0` |
| Immutable commit | `23bce0e56f2808902f1126ad581f6d8c3b5f639e` |
| Repository | https://github.com/aidenybai/react-grab |
| Source scope | `packages/react-grab` (+ root `LICENSE`) |
| License | MIT (`LICENSE.upstream`, byte-exact) |
| npm integrity | `sha512-ohhsfXD4qN0j6cMQd56aaVJBPDF3kUdviF/Od1Eak/rEIXQ3svQ4gjkwTfuTZwTBnxHRL16p9JqdlVQO5nUHqA==` |

Pinned pristine tree: `packages/grab/upstream/` verified by `audit/upstream.lock.json`.
Adapted unit/e2e suites regenerate under `tests/upstream/` (gitignored).

## Source boundary

- `upstream/` is the immutable git tree for `packages/react-grab` (+ root `LICENSE`) at the pinned commit; integrity is `audit/upstream.lock.json`.
- `upstream-artifact/` holds the published npm tarball bytes used for pristine type evidence (prettier-ignored, not in `files`).
- `src/` is the Octane binding: adapted overlay/UI modules from upstream plus authored `octane-adapter` / freeze bridges.
- `tests/upstream/` is regenerated adapted evidence (not committed); Playwright e2e cases stay dispositioned in `audit/crosswalk.json`.
- CLI packaging stays out of this package: reuse `@react-grab/cli` directly.

## Dependency plan

| Upstream | Disposition |
| --- | --- |
| `bippy` | **reimplement-in-parent** via `src/octane-adapter.ts` → `octane/inspect` |
| `@react-grab/cli` | **reuse-package** (`@react-grab/cli@0.2.0` runtime dependency) |
| Overlay UI | SolidJS 1.9 — kept/adapted under MIT |
| `react` peer | Dropped; Octane is the host framework |

## Public export crosswalk

| Upstream export | Octane binding | Notes |
| --- | --- | --- |
| `react-grab` (`init`, plugins, types, errors, `generateSnippet`, globals) | `@octanejs/grab` → `src/index.ts` | Auto-init also sets `__OCTANE_GRAB__` (and keeps `__REACT_GRAB__`) |
| `react-grab/core` | `@octanejs/grab/core` | Solid core + overlay |
| `react-grab/primitives` | `@octanejs/grab/primitives` | Freeze/hit-testing helpers |
| `react-grab/styles.css` | `@octanejs/grab/styles.css` | Authored Tailwind source CSS |
| `bin` / `react-grab` CLI | **Gap** | Use `@react-grab/cli` directly; no `@octanejs/grab` bin yet |

### Notable divergences

- Fiber APIs are opaque Octane owners (`octane-adapter`), not React Fibers.
- `freezeUpdates` calls `octane/inspect` `pauseUpdates` instead of patching React's dispatcher.
- Window globals: prefer `__OCTANE_GRAB__` / `__OCTANE_GRAB_DISABLED__`; React-named aliases remain.
- Next.js server-frame symbolication and R3F selection remain blocked pending bridges.
- Host→owner mapping requires registered Octane inspect roots (devtools/profile builds stamp richest metadata).

## Attribution

Binding-authored MIT: `LICENSE`. Upstream MIT retained byte-exact: `LICENSE.upstream`.
