# Type assertion groups (port-authored)

Upstream ships no typetests. Groups below are mirrored in pristine (React oracle)
and adapted (Octane) suites.

1. `EditorProps` accepts `value`, `language`, `onChange`, `loading` string
2. `EditorProps.onChange` rejects a wrong-arity callback
3. `DiffEditorProps` accepts `original` / `modified`
4. `OnChange` callback arity
5. `useMonaco` return is `Monaco | null`
6. Default export is the Editor component type
