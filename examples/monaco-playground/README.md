# Monaco Playground

Consumer example for [`@octanejs/monaco-editor-octane`](../../packages/monaco-editor-octane).

Uses Vite `?worker` imports + `loader.config({ monaco })` so language workers load
from the app bundle rather than the CDN.

```bash
pnpm --filter monaco-playground-example dev
pnpm --filter monaco-playground-example test:e2e
```
