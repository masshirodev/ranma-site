# The website: ranma.masshiro.pro

One page that says what ranma is, shows it, and gets it installed. Its source is
this repository; it is built into plain files and served by Caddy on the
`masshiro.pro` VPS. Card c409 ("A website at ranma.masshiro.pro") on the Ranma
board made it; the brief is [`briefs/done/WEBSITE.md`](briefs/done/WEBSITE.md)
and the design handoff is mirrored in [`handoffs/website/`](handoffs/website).

**A repository of its own.** The page began as `site/` in ranma's repository.
On 2026-11-05 it moved here, history and all (card c475, "The website in a
repository of its own, with real captures in the sumi look"): someone cloning
ranma to build or update it should not download a website, its fonts, and the
videos and screenshots that show ranma off. The README's pictures moved with
it (`readme/`), and ranma's README links them here by URL.

The site is not where ranma is installed from. `install.sh`, the apt and dnf
repositories and the signing key stay on ranma's GitHub Pages
(`masshirodev.github.io/ranma`, ranma's `doc/RELEASING.md`), because installed
machines already point there. The page shows those URLs; it never copies the
files.

## How it builds

```sh
yarn install          # dev tools only: Playwright, Prettier, ESLint, two font packages
yarn run build        # → build/
yarn run serve        # http://localhost:4173/, plain files as Caddy serves them
```

**It reads a ranma checkout**: `../ranma`, beside this repository (as
`~/projects/ranma` is beside `~/projects/ranma-site`), or wherever `RANMA_DIR`
says. It needs ranma's tags, so not a shallow clone. Without one the build
stops and says so.

`build.mjs` has no dependencies. It reads:

| What the page says       | Where it comes from                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| The version and its date | ranma's newest `v*` tag reachable from HEAD (`git describe`), not Cargo.toml, which runs ahead |
| The `init.lua` excerpt   | ranma's `doc/examples/screenshot/init.lua`, lines 10-18 and 33-46                              |
| The `sumi.toml` excerpt  | ranma's `doc/examples/screenshot/themes/sumi.toml`, lines 1-16 and 50-55                       |
| The demo's chapters      | `static/media/demo.vtt`, written as `capture/tapes/demo.tape` was recorded                     |
| The pictures and videos  | `static/media/`, committed (below)                                                             |

Each excerpt pins the start of its first line, so editing the example config
fails the build ("line 10 reads …") instead of quietly quoting the wrong lines.
Move the range in `build.mjs` (and its test) when that happens. Before pushing
such an edit to ranma, build the page against it: `RANMA_DIR=../ranma yarn run build`.

Every asset is written under a content-hashed name (`site.696dfb7191.css`) so
Caddy can let browsers keep it for a year; `index.html` is never cached. The
page sets no inline style and runs no inline script, so the CSP can forbid both
(the swatches in the theme excerpt are classes the build writes into the
stylesheet for that reason).

## Captures

Pictures and videos are recorded and **committed**; a deploy never records
anything. That was the plan the owner approved on 2026-11-03: a deploy stays
fast, a half-finished UI never reaches the site by accident, and a new capture
shows up as a diff to review. The cost is that the page shows ranma as of the
last capture, so re-record after a change that shows.

They are **real**: ranma in a real kitty, driven by a script. The README used
to show an AI-made picture of ranma; `screenshot.tape` is that picture's scene,
recorded. Its look is ranma's `doc/examples/screenshot` (the `sumi` theme)
exactly as a visitor can copy it, and the toast in it is raised by that
example's own `command_finished` hook, from a release build that really ran.

```sh
yarn run capture                    # every tape
yarn run capture screenshot demo    # these
CAPTURE_VERBOSE=1 yarn run capture copy   # each step, as it plays
KEEP=1 yarn run capture mobile      # leave the staged world for a look
CAPTURE_WAIT=60 yarn run capture demo     # wait up to an hour for a quiet machine
```

**A take waits for a quiet machine.** ranma's cpu module and btop show what
the box is doing, and another suite running beside a take puts red 90%
figures in the picture that have nothing to do with ranma. Before each take
the rig waits for the one-minute load to fall under half the cores, for up to
`CAPTURE_WAIT` minutes (15), then records anyway and says so. A failed take
leaves a picture of what was on screen, `failed-<tape>.png`, beside the
staged world, and one run at a time holds `capture.lock` there.

What each tape makes:

| Tape              | Makes                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `screenshot.tape` | `readme/screenshot.png` (2560×1520), and from it `static/media/screenshot.webp`, `og.jpg` |
| `demo.tape`       | `static/media/demo.{webm,mp4,vtt}`, `demo-poster.webp`, and `readme/demo.gif`             |
| `sessions.tape`   | `static/media/sessions.{webm,mp4}`, `sessions-poster.webp`                                |
| `copy.tape`       | `static/media/copy.{webm,mp4}`, `copy-poster.webp`                                        |
| `images.tape`     | `static/media/images.webp`: a picture in a pane, by the kitty graphics protocol           |
| `mobile.tape`     | `static/media/mobile.webp`: the mobile view, on a terminal that says it is a phone        |

### How a take is recorded

`capture/run.mjs`, for each tape:

1. **Stages a world** (`capture/stage.sh`) under `/mnt/hdd2/ranma-capture`
   (`CAPTURE_DIR`), never `/tmp`, which is RAM on the workstation: a home of its
   own with ranma's example config (plus no plugin manager and no restore, and
   mobile.ranma for the mobile view), a zsh that marks its commands with OSC 133
   and titles panes as the design does (`capture/zshrc`), nvim in sumi's colours
   (`capture/nvim`), and a clone of ranma at `~/src/ranma` to work in. Its
   `XDG_RUNTIME_DIR` is its own, so the ranma it starts is a private server that
   sees none of the machine's sessions. cargo's target for that clone stays in
   `/mnt/hdd2/ranma-capture/target` between takes.
2. **Makes an output no one sees**: a headless Hyprland output, `RANMACAP`, at
   the tape's `Screen` and `Scale`, whose default workspace is the capture's own.
   kitty opens there (a window rule sends it, `silent`), so nobody's focus or
   screen moves. A desktop shell puts its bar on every output, this one too,
   above even a fullscreen window; so kitty is tiled, filling what the shell
   leaves, the output is grown by what the shell reserves, and every capture
   takes kitty's rectangle only. The picture is the `Screen` size exactly,
   whatever the desktop draws.
3. **Starts kitty** with `capture/kitty.conf` and nothing of the machine's
   kitty: sumi's colours as the ANSI palette, JetBrains Mono Nerd Font, no
   clipboard writes (the copy loop's OSC 52 must not reach the desktop's
   clipboard).
4. **Plays the tape** into kitty over its remote-control socket, speaking the
   protocol directly (the `kitty @` CLI costs 40 ms a call, too slow to type
   at a person's pace). `wf-recorder` records from `Show` to the end; `grim`
   takes the stills.
5. **Takes it all down**, whatever happened: kitty, every process of the
   world (the ranma server, a build in a pane), the output.

A recording becomes a WebM (AV1, for browsers that have it) and an MP4 (H.264,
for the rest) at 1920 wide, a poster from its first second, and, for the demo,
the README's gif from the same take.

It needs Hyprland, kitty, grim, wf-recorder, ffmpeg with libsvtav1 and libx264,
ImageMagick, zsh, nvim, git, cargo, kitten, btop, and an installed ranma
(`RANMA_BIN`, else the one on `PATH`). It runs on the workstation only; nothing
in CI records.

### The tapes

vhs's language, the part of it a script of keys needs (`lib/tape.mjs` reads it,
strictly: a line it does not know fails the take, naming the line):

- `Set Screen 2560x1520`, `Set Scale 2`, `Set FontSize 10.5`,
  `Set TypingSpeed 60ms`, `Set Mobile true` (`RANMA_MOBILE=1`).
- `Output demo`: the tape is a video, named so in `static/media/`.
- `Hide` / `Show`: recording starts at the first `Show`; what comes before it
  sets the scene unseen.
- `Type "text"`, `Type@10ms "text"`; keys as vhs names them, `Enter`,
  `Escape`, `Ctrl+B`, `Shift+Right 6`, `Left@200ms 3`.
- `Sleep 1.5s`.
- `Wait /regex/`, `Wait@600s /regex/`: until kitty's screen matches (15 s
  unless it says). A take waits for what it shows, a test result or a toast,
  rather than guessing how long it takes.
- `Screenshot path`: a PNG as grim takes it, or WebP or JPEG from it.
- `# chapter: label`: a chapter starts here, timed as the tape plays.
- `$CAPTURE_ROOT` in a typed command is this repository's root.

## Fonts

Self-hosted woff2 subsets in `static/fonts/`, committed and made by
`scripts/fonts.sh`, about 69 KB together:

- **JetBrains Mono** from JetBrains' own v2.304 release (sha256-pinned), not
  fontsource: fontsource's copy drops `← → ❯ ⋯`, which the page sets in mono.
- **IBM Plex Sans** from `@fontsource-variable/ibm-plex-sans`, weights 400-600.
- **Shippori Mincho**, cut down to the two characters it sets: 欄 and 間.

Run `fonts.sh` again only to change what they cover. It needs fontTools and
brotli (`/usr/bin/python3`; mise's Python has neither).

## Tests

```sh
yarn run lint            # Prettier, then ESLint
yarn run test:coverage   # the build's logic and the tape grammar, node:test, 95% floor
yarn run test:e2e        # builds, then Playwright at 1440 and on a 390-wide phone
```

[`TESTING.md`](TESTING.md) says where each runs.

- `e2e/frame.spec.mjs` is **generated** from the handoff by
  `~/.config/myconf/design-tools/gen-conformance.mjs` (map: `e2e/frame.map.json`)
  and pins every grid and flex frame the design declares. Its numbers are the
  design's hand-set values; don't tidy them onto a scale, and regenerate rather
  than edit it.
- `e2e/page.spec.mjs` covers what the frame can't: the page without JavaScript
  (every command as text, no copy button or theme toggle that would do nothing),
  the theme toggle and its memory, a copy button, the workspace pill following
  the section, no horizontal scroll, and no request to another origin.

Prettier leaves the markup in `lib/page.mjs` alone
(`embeddedLanguageFormatting: off`): it formats an `html`-tagged template as
HTML, which reflowed the page and its `<pre>` blocks the first time it ran.

## Deploying

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) builds the page with
masshirodev/ranma's `main` checked out beside this repository, runs the three
checks above, and on `main` deploys:

- **What triggers it**: a push to `main`; a daily run (06:17 UTC), which picks
  up a release or an edit to ranma's example without anyone touching this
  repository; or a run by hand, `gh workflow run ci -R masshirodev/ranma-site`,
  after a release that should show at once. Pull requests only build and test.
- **How**: `rsync --delete-delay --delay-updates` of `build/` to the VPS, so
  the new files land together at the end and an old page is never served
  half-replaced.
- **The key** (`SITE_DEPLOY_KEY`, a GitHub Actions secret of this repository)
  is a deploy-only ed25519 key, made for it on 2026-11-05 (ranma's own went
  with the move). On the VPS it sits in `~/.ssh/authorized_keys` forced through
  `rrsync` and rooted at `~/sites/ranma`, with `restrict`: it can write there
  and nothing else, no shell, no forwarding. If it leaks, the damage is the
  website's contents. Its private half exists only as that secret.
- **The destination is named**, `public/`, never a bare `host:`. Through rrsync
  the two mean the same folder, but without the lock a bare `host:` is the home
  directory, and an `rsync --delete` aimed at one deleted most of the VPS home
  on 2026-11-03 (Masshiro card c60). Named, the worst a broken lock can do is
  write `~/public`.
- **The host key** is pinned (`SITE_KNOWN_HOSTS`), never accepted on first sight.
- **On the VPS** Caddy serves `~/sites/ranma/public` (`~/sites` is mounted
  read-only at `/srv/sites`) for `ranma.masshiro.pro`, from the homelab repo's
  `caddy/`: hashed assets `immutable` for a year, the page `no-cache`, a strict
  CSP. The hub lists it from `sites.yaml`, and the `blackbox-public` probe watches
  it.

Wildcard DNS already points `*.masshiro.pro` at the VPS, so there is no record
to add.

## Where it departs from the handoff

The handoff is [`handoffs/website/Main.dc.html`](handoffs/website/Main.dc.html)
(desktop, dark) and `Phone.dc.html` (390, light). Each departure, and why:

- **The tuios panel says nothing against tuios.** The design had "ranma aims to
  be the faster, less buggy daily driver". The owner, 2026-11-03: "dont say tuios
  is buggy, seems like we are throwing shade". It now credits tuios as the model
  for the feel and lists ranma's own trade-offs. `page.spec.mjs` holds this; the
  internal comparison in ranma's DESIGN.md, "Why not tuios", stays where it is
  and is not copy for the site.
- **Chapter four is "leader 2 · another workspace"**, not "alt+2": the tape
  presses the leader, and the label says what the video shows. **Chapter five
  is the toast a command raises when it ends out of sight**, not `ranma
notify`: the recording shows the sumi example's hook, which is what the
  screenshot's toast is too.
- **The copy-mode loop ends at the yank.** The design drew a paste on the local
  side of an ssh pane; the staged home has no ssh server, and the capture kitty
  refuses clipboard writes, so a recording could not show it honestly. The
  panel's text still says what OSC 52 does.
- **Captures not yet recorded show no picture**, rather than the design's
  dashed placeholder with its "capture · loop · 1200×675" caption, which was a
  note to the builder, not page content.
- **The workspace pills mark the section on screen** only with JavaScript; the
  design drew "1 demo" as always current, which is wrong once you scroll.
- **Without JavaScript the theme toggle and copy buttons are not shown**: the
  handoff's note asked for that, and a control that does nothing is worse than
  none.
- **The videos don't autoplay for a visitor who asked for reduced motion**, and
  play only while on screen.

## What it doesn't do yet

- No rendered docs. The man pages and CONFIG.md are linked on GitHub; the
  handoff suggested rendering them at build time as a later step.
- One language, English.
