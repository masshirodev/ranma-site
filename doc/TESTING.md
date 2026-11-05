# Testing

## Suite

Two halves:

- **`test/*.test.mjs`**: `node --test` over the build's logic (`lib/`,
  `build.mjs`): excerpts, chapters, hashing, the page's markup. Seconds. Some
  read the ranma checkout the build reads (`../ranma` or `$RANMA_DIR`), so
  they need one.
- **`e2e/*.spec.mjs`**: Playwright on the built page, at 1440 and on a
  390-wide phone. `frame.spec.mjs` is generated from the design handoff
  (doc/WEBSITE.md, "Tests") and pins its frames; `page.spec.mjs` covers what a
  frame can't: the page without JavaScript, the theme toggle, copy buttons, no
  horizontal scroll, no request to another origin.

## Commands

| Command                  | What                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `yarn run test`          | The suite                                                                    |
| `yarn run test:coverage` | The suite, failing below 95% lines, branches, functions                      |
| `yarn run test:e2e`      | Builds, then Playwright (a Chromium: `yarn run playwright install chromium`) |
| `yarn run lint`          | Prettier check, then ESLint                                                  |
| `yarn run format`        | Prettier, writing                                                            |

Always `yarn run <name>`: Yarn 1 has a builtin `check` that exits 0 having
checked nothing, and the habit is what keeps that from biting.

## Coverage

**The floor is 95%** for lines, branches and functions, set in the
`test:coverage` script and enforced at every push. A change that lowers it
adds tests in the same commit; the floor is not lowered to make a push pass.
What is measured is `lib/` and `build.mjs`; the tests, the browser script and
the capture rig are not.

## Where each check runs

| Check                        | pre-commit   | pre-push | CI  |
| ---------------------------- | ------------ | -------- | --- |
| Prettier, ESLint             | staged files | tree     | yes |
| Agent instruction budget     | yes          |          |     |
| House rules (`hajime check`) |              | yes      |     |
| Hooks armed                  |              | yes      |     |
| Suite + 95% coverage         |              | yes      | yes |
| Playwright (`test:e2e`)      |              |          | yes |

## Git hooks

| Hook         | Runs                                                           | Skip flags                                             |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------------ |
| `pre-commit` | lint-staged (ESLint, Prettier), `agent-docs-budget`            | `SKIP_LINT SKIP_FORMAT SKIP_AGENT_DOCS SKIP_ALL`       |
| `pre-push`   | hooks armed, `lint`, `test:coverage`, `hajime check --offline` | `SKIP_HOOKS SKIP_LINT SKIP_TESTS SKIP_HAJIME SKIP_ALL` |
| `commit-msg` | refuses co-author trailers, `Claude-Session`, robot emoji      | `SKIP_COAUTHOR SKIP_ALL`                               |

A worktree has no `.husky/_` until `npx husky` has run in it, and git then
runs no hook without saying so; `yarn run hooks:check` is the check.
