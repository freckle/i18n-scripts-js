# `@freckle/i18n-scripts`

Scripts for i18n validation.

## Install

```sh
pnpm add @freckle/i18n-scripts
```

## Usage

The package installs three bins:

- `check-i18n-variables <project-path>...` — extracts translation keys and the variables the
  code passes to them, then reports keys whose Locize value references a variable the code
  does not pass.
- `check-i18next-icu-parser <namespace>...` — reports Locize keys that `i18next` cannot parse
  as ICU.
- `check-missing-translations <namespace> [project-path]` — reports keys used in code but
  missing from Locize, and keys present in Locize but untranslated. Needs `git`, `curl` and
  `jq`.

## Development

- **Package manager**: pnpm (Node version pinned in `.nvmrc`)
- `pnpm build` — copies `src/` to `dist/` (minus tests); `dist/` is committed
- `pnpm test` — Vitest
- `pnpm coverage` — Vitest with coverage, gated at 70% (lines/branches/functions/statements)
- `pnpm lint` — ESLint
- `pnpm format` / `pnpm format-check` — Prettier
- `pnpm knip` — unused files/dependencies/exports
- CI runs all of the above on every PR, plus a check that `dist/` is up to date

## Release

See [RELEASE.md](./RELEASE.md) for more details.

---

[LICENSE](./LICENSE)
