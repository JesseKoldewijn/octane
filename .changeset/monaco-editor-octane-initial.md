---
"@octanejs/monaco-editor-octane": patch
---

Add `@octanejs/monaco-editor-octane`, an Octane port of `@monaco-editor/react@4.8.0-rc.3` (master tip `f7ef2e6`) over `@monaco-editor/loader` and `monaco-editor`. Ships Editor, DiffEditor, `useMonaco`, and the loader re-export as source; keeps the library `onChange` prop name; uses Octane `ref` on the internal container host instead of upstream `_ref`.
