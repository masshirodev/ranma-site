# AGENTS.md

ranma-site builds ranma.masshiro.pro, the website of ranma (the terminal tiling
window manager, `masshirodev/ranma`), and keeps the pictures and videos that
show ranma: the page's, and the ones ranma's README links. Read
`doc/DESIGN.md` before changing behaviour: it records the decisions.
`doc/WEBSITE.md` is the manual.

## Before any change

- **Do it right, not quick.** Between a way that works now and the way that
  holds, take the one that holds, even when it is more work. Say what the
  cheaper way would cost instead of quietly taking it.
- A decision that changes how the project works goes into `doc/DESIGN.md` in
  the same commit.
- New sections of the page, or a reshaped one, get a brief in `doc/briefs/`
  and a design handoff before a plan is approved.
- `AGENTS.local.md` is gitignored and describes this checkout on this machine.
  Read it when it exists; never commit it.
- **The build reads a ranma checkout** at `../ranma` or `$RANMA_DIR`, with its
  tags. Never copy ranma's files into this repository to get around that.

## Before a commit

```sh
yarn run lint && yarn run test:coverage
yarn run test:e2e    # when the page, its CSS or its script changed
```

The git hooks in `.husky/` enforce the first line. `commit-msg` refuses
`Co-Authored-By` trailers, `Claude-Session` references and the robot emoji.
Make the hooks pass; skip flags are for emergencies, not routine use.
`doc/TESTING.md` says what each check covers and where it runs.

**Coverage is held at 95%** (lines, branches and functions). A change that
drops it below adds the tests in the same commit; it does not lower the bar.

## Conventions

- The build's logic lives in `lib/` and `build.mjs`, tested in `test/` on
  `node:test`; the page's behaviour is tested in the browser in `e2e/`.
- Captures (`static/media/`, `readme/`) are recorded by `capture/` and
  committed; a deploy never records anything. Re-record after a change to
  ranma that shows (doc/WEBSITE.md, "Captures").
- Never write to `/tmp` directly; a test that needs a directory makes one under
  `os.tmpdir()` and removes it in an `after` hook (`/tmp` is RAM on the workstation).
- Always `yarn run <name>`, never bare `yarn <name>`.
- Work is tracked on ranma's board in Kumiko; `AGENTS.local.md` names it.
  Name cards by id and title together.
- Comments explain why, not what. No emoji in code or commits.
- Push to `main`; a push deploys.
- hajime holds this repository to the house conventions (`.hajime.json`);
  `hajime check` says what has drifted from them.
