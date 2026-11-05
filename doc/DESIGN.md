# Design

What this repository is for, what it is not, and the decisions it runs on.

## What it is

The source of ranma.masshiro.pro, and the home of every picture and video that
shows ranma: the page's, and the README's (`readme/`), which ranma's README
links by URL.

## What it is not

- **Not where ranma is installed from.** `install.sh`, the apt and dnf
  repositories and the signing key stay on ranma's GitHub Pages
  (`masshirodev.github.io/ranma`), because installed machines already point
  there. The page shows those URLs and never copies the files.
- **Not ranma's documentation.** CONFIG.md, DESIGN.md and the man pages stay in
  ranma and are linked, not rendered.

## Decisions

- **A repository of its own** (2026-11-05, card c475): someone cloning ranma
  should not download a website and its media. History came along
  (`git filter-repo` over `site/` and the capture scripts). The cost is that a
  change to ranma's example config no longer redeploys the page by itself: the
  daily run picks it up, or a run by hand does (`doc/WEBSITE.md`, "Deploying").
- **The build reads ranma, never a copy of it**: the version from its latest
  tag, the code excerpts from its example config, so nothing on the page is
  typed twice and a moved line fails the build.
- **Captures are recorded and committed, never made at deploy**: a deploy stays
  fast, a half-finished UI never reaches the page by accident, and a new
  capture shows as a diff to review (owner's call, 2026-11-03).
- **Captures are real.** Recorded in a real kitty driven by a script, on an
  output of the compositor no one sees (`capture/`), not drawn and not
  generated. The README once showed an AI-made picture of ranma; this
  repository exists partly to replace it with what ranma draws.
- **Plain files**: no framework, no analytics, no third-party requests, a
  strict CSP (no inline style or script). `doc/WEBSITE.md` has the details.
