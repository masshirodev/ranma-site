// Records the site's pictures and videos, and the README's, in a real kitty
// on an output of the compositor that no one sees (doc/WEBSITE.md,
// "Captures"). For each tape in capture/tapes: stage a home of its own
// (stage.sh), make a headless Hyprland output at the tape's size, start kitty
// on it with capture/kitty.conf, play the tape into kitty over its
// remote-control socket, record it with wf-recorder or take stills with grim,
// then take all of it down again, whatever happened.
//
//   yarn run capture                 # every tape
//   yarn run capture screenshot demo # these
//   KEEP=1 yarn run capture demo     # leave the staged world for a look
//
// Needs Hyprland (hyprctl), kitty, grim, wf-recorder, ffmpeg with libsvtav1
// and libx264, ImageMagick, zsh, nvim, git, cargo, and an installed ranma
// (RANMA_BIN, else the one on PATH). Reads ranma from ../ranma or RANMA_DIR.

import { execFileSync, spawn, spawnSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	symlinkSync,
	writeFileSync
} from 'node:fs';
import { connect } from 'node:net';
import { availableParallelism, loadavg } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ranmaDir } from '../build.mjs';
import { parseTape, vtt } from '../lib/tape.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const media = join(root, 'static/media');
// Scratch on the disk with room, not /tmp (RAM on the workstation): staged
// homes, the raw recordings, and cargo's target for the staged clone, kept
// between runs so a take does not wait for a cold build.
const scratch = process.env.CAPTURE_DIR || '/mnt/hdd2/ranma-capture';
const OUTPUT = 'RANMACAP';
const WORKSPACE = 'name:ranmacap';
const CLASS = 'ranma-capture';

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', ...opts }).trim();

// The Hyprland this desktop runs: the signature in the environment can be a
// session's that ended, so ask each instance until one answers.
function hyprland() {
	const dir = `/run/user/${process.getuid()}/hypr`;
	const sigs = [process.env.HYPRLAND_INSTANCE_SIGNATURE, ...readdirSync(dir)]
		.filter(Boolean)
		.filter((s, i, all) => all.indexOf(s) === i)
		.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
	for (const sig of sigs) {
		const env = { ...process.env, HYPRLAND_INSTANCE_SIGNATURE: sig };
		if (spawnSync('hyprctl', ['version'], { env }).status === 0) {
			return (...args) => run('hyprctl', args, { env });
		}
	}
	throw new Error('capture: no running Hyprland answers hyprctl');
}

// The output the takes are recorded on. Its workspace is the default there,
// set before the output exists, so it never shows any of the desktop's, and
// the window rule puts kitty on it without moving anyone's focus.
//
// kitty is tiled, not fullscreen: a desktop shell puts its bar on every
// output, the new one too, as a layer above even a fullscreen window. Tiled,
// kitty fills what the shell leaves free, the capture takes kitty's own
// rectangle, and the output is made larger by what the shell reserves, so
// that rectangle is the tape's Screen exactly, whatever the desktop draws.
function makeOutput(hypr, screen, scale) {
	const [w, h] = screen.split('x').map(Number);
	const monitor = () => JSON.parse(hypr('monitors', '-j')).find((m) => m.name === OUTPUT);
	const create = (pw, ph) => {
		if (monitor()) hypr('output', 'remove', OUTPUT);
		hypr(
			'eval',
			`hl.monitor({ output = "${OUTPUT}", mode = "${pw}x${ph}@30", position = "auto", scale = ${scale} })`
		);
		hypr('output', 'create', 'headless', OUTPUT);
	};
	hypr(
		'eval',
		`hl.workspace_rule({ workspace = "${WORKSPACE}", monitor = "${OUTPUT}", default = true, gaps_in = 0, gaps_out = 0, border_size = 0 })`
	);
	hypr(
		'eval',
		`hl.window_rule({ match = { class = "^(${CLASS})$" }, workspace = "${WORKSPACE} silent", no_anim = true, rounding = 0, no_shadow = true, border_size = 0, opacity = "1.0 override 1.0 override" })`
	);
	create(w, h);
	// What the desktop's bars reserve there, in logical pixels: left, top,
	// right, bottom. A moment for the shell to put its bar on the new output.
	spawnSync('sleep', ['1']);
	const [l, t, r, b] = monitor()?.reserved ?? [0, 0, 0, 0];
	if (l + t + r + b) create(w + Math.round((l + r) * scale), h + Math.round((t + b) * scale));
}

/** kitty's rectangle on the output, as grim and wf-recorder take it. */
function kittyGeometry(hypr) {
	const c = JSON.parse(hypr('clients', '-j')).find((c) => c.class === CLASS);
	return c && { at: c.at, size: c.size, geometry: `${c.at[0]},${c.at[1]} ${c.size[0]}x${c.size[1]}` };
}

const log = (...a) => process.env.CAPTURE_VERBOSE && process.stderr.write(`${a.join(' ')}\n`);

// kitty's remote control, spoken over its socket: a command per connection.
// The CLI (`kitty @`) costs 40 ms a call, too slow to type at a person's pace.
function kittyCmd(sock, cmd, payload, wantReply = false) {
	return new Promise((res, rej) => {
		const c = connect(sock);
		let buf = '';
		const msg = { cmd, version: [0, 48, 2], payload, ...(!wantReply && { no_response: true }) };
		c.on('connect', () => {
			c.write(`\x1bP@kitty-cmd${JSON.stringify(msg)}\x1b\\`);
			if (!wantReply) c.end();
		});
		c.on('data', (d) => {
			buf += d;
			if (buf.endsWith('\x1b\\')) {
				c.end();
				const reply = JSON.parse(buf.slice('\x1bP@kitty-cmd'.length, -2));
				reply.ok ? res(reply.data) : rej(new Error(`kitty ${cmd}: ${reply.error}`));
			}
		});
		c.on('close', () => !wantReply && res(null));
		c.on('error', rej);
	});
}

async function waitFor(what, test, timeout) {
	const until = Date.now() + timeout * 1000;
	for (;;) {
		if (await test()) return;
		if (Date.now() > until) throw new Error(`capture: gave up waiting for ${what}`);
		await sleep(0.15);
	}
}

// Every process of a staged world: the ones whose XDG_RUNTIME_DIR is its
// own. Its ranma server outlives the kitty that started it, by design, and
// whatever the panes ran (a cargo build) with it.
function worldPids(runDir) {
	return readdirSync('/proc')
		.filter((p) => /^\d+$/.test(p))
		.filter((pid) => {
			try {
				return readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0').includes(`XDG_RUNTIME_DIR=${runDir}`);
			} catch {
				return false; // Gone already, or not ours to read.
			}
		})
		.map(Number);
}

// End them, and wait until they have: a world removed under a process still
// writing to it is not removed (ENOTEMPTY).
async function killWorld(runDir) {
	const signal = (sig) =>
		worldPids(runDir).forEach((pid) => {
			try {
				process.kill(pid, sig);
			} catch {
				// Gone between the listing and the signal.
			}
		});
	signal('SIGTERM');
	try {
		await waitFor('the staged world to end', () => worldPids(runDir).length === 0, 5);
	} catch {
		signal('SIGKILL');
		await waitFor('the staged world to end after SIGKILL', () => worldPids(runDir).length === 0, 5);
	}
}

// A take shows what the machine is doing: ranma's cpu module, btop in a
// pane. Another suite running beside it puts red 90% figures in the picture
// that have nothing to do with ranma, so wait for a quiet machine first: the
// one-minute load under half the cores, for up to CAPTURE_WAIT minutes (15).
// Past that the take goes ahead, and says so.
async function quiet() {
	const limit = availableParallelism() / 2;
	const minutes = Number(process.env.CAPTURE_WAIT ?? 15);
	if (loadavg()[0] < limit) return;
	process.stdout.write(
		`capture: waiting for the load (${loadavg()[0].toFixed(1)}) to fall under ${limit}…\n`
	);
	try {
		await waitFor('a quiet machine', () => loadavg()[0] < limit, minutes * 60);
	} catch {
		process.stdout.write(
			`capture: still busy (load ${loadavg()[0].toFixed(1)}) after ${minutes} min; recording anyway\n`
		);
	}
}

/** Plays one tape. Returns what it made. */
async function take(name, hypr, ranma) {
	const steps = parseTape(readFileSync(join(here, 'tapes', `${name}.tape`), 'utf8'));
	const set = { Screen: '2560x1440', Scale: '2', FontSize: '10.5', TypingSpeed: '55ms', Mobile: 'false' };
	for (const s of steps.filter((s) => s.kind === 'set')) set[s.key] = s.value;
	const typing = parseTape(`Sleep ${set.TypingSpeed}`)[0].s;
	const output = steps.find((s) => s.kind === 'output')?.path;

	const world = join(scratch, 'world');
	const runDir = join(world, 'run');
	const sock = join(world, 'kitty.sock');
	const raw = join(scratch, `${name}.mkv`);
	mkdirSync(scratch, { recursive: true });
	const home = run('sh', [join(here, 'stage.sh'), world, ranmaDir()]);
	mkdirSync(join(world, 'bin'), { recursive: true });
	symlinkSync(ranma, join(world, 'bin/ranma'));

	makeOutput(hypr, set.Screen, set.Scale);
	const scale = Number(set.Scale);
	const env = {
		HOME: home,
		PATH: `${join(world, 'bin')}:/usr/local/bin:/usr/bin:/bin`,
		LANG: 'C.UTF-8',
		SHELL: '/usr/bin/zsh',
		EDITOR: 'nvim',
		// kitty finds the compositor by this path; everything it starts gets
		// the world's runtime directory, so ranma is a private server.
		WAYLAND_DISPLAY: `/run/user/${process.getuid()}/${process.env.WAYLAND_DISPLAY || 'wayland-1'}`,
		XDG_RUNTIME_DIR: runDir,
		RANMA_NO_UPDATE_CHECK: '1',
		// For a tape that shows one of this repository's files (images.tape).
		CAPTURE_ROOT: root,
		CARGO_TARGET_DIR: join(scratch, 'target'),
		CARGO_HOME: process.env.CARGO_HOME || join(process.env.HOME, '.cargo'),
		RUSTUP_HOME: process.env.RUSTUP_HOME || join(process.env.HOME, '.rustup'),
		...(set.Mobile === 'true' && { RANMA_MOBILE: '1' })
	};
	const kitty = spawn(
		'kitty',
		[
			'--config',
			join(here, 'kitty.conf'),
			'-o',
			`font_size=${set.FontSize}`,
			'--class',
			CLASS,
			'--listen-on',
			`unix:${sock}`,
			'--directory',
			join(home, 'src/ranma'),
			'zsh',
			'-i'
		],
		{ env, stdio: 'ignore' }
	);
	let recorder;
	const made = [];
	try {
		await waitFor('kitty', () => existsSync(sock), 10);
		const [w, h] = set.Screen.split('x').map(Number);
		await waitFor(
			`kitty at ${set.Screen} on the capture output`,
			() => {
				const g = kittyGeometry(hypr);
				return g && Math.round(g.size[0] * scale) === w && Math.round(g.size[1] * scale) === h;
			},
			10
		);
		const { geometry } = kittyGeometry(hypr);
		await sleep(0.5);
		const started = performance.now();
		const chapters = [];
		let t0 = 0;
		// The frame a video shows before it plays; the first second unless
		// the tape marks a better one (Poster).
		let poster = 1;
		for (const s of steps) {
			log(
				`${((performance.now() - started) / 1000).toFixed(1)}s`,
				`line ${s.line}`,
				s.kind,
				s.text ?? s.key ?? s.re ?? s.path ?? s.label ?? ''
			);
			switch (s.kind) {
				case 'show':
					if (output && !recorder) {
						recorder = spawn(
							'wf-recorder',
							[
								'-y',
								'-g',
								geometry,
								'-r',
								'30',
								'-c',
								'libx264rgb',
								'-p',
								'crf=0',
								'-p',
								'preset=ultrafast',
								'-f',
								raw
							],
							{ stdio: 'ignore' }
						);
						// The first frame comes a moment after the start.
						await sleep(0.4);
						t0 = performance.now();
					}
					break;
				case 'poster':
					poster = (performance.now() - t0) / 1000;
					break;
				case 'chapter':
					chapters.push({ start: Math.round((performance.now() - t0) / 100) / 10, label: s.label });
					break;
				case 'sleep':
					await sleep(s.s);
					break;
				case 'type': {
					const speed = s.speed ?? typing;
					for (const ch of s.text) {
						await kittyCmd(sock, 'send-text', { data: `text:${ch}` });
						await sleep(speed);
					}
					break;
				}
				case 'key':
					for (let i = 0; i < s.count; i++) {
						await kittyCmd(sock, 'send-key', { keys: [s.key] });
						await sleep(s.speed ?? typing);
					}
					break;
				case 'wait':
					await waitFor(
						`${s.re} (tape line ${s.line})`,
						async () => s.re.test(await kittyCmd(sock, 'get-text', { extent: 'screen' }, true)),
						s.timeout
					);
					break;
				case 'screenshot':
					made.push(still(s.path, geometry));
					break;
			}
		}
		if (recorder) {
			const length = (performance.now() - t0) / 1000;
			await stop(recorder);
			recorder = null;
			made.push(...encode(output, raw, chapters, length, poster));
		}
	} catch (e) {
		// What was on screen when the take failed: the first thing to look at.
		const shot = join(scratch, `failed-${name}.png`);
		const g = kittyGeometry(hypr);
		if (g && spawnSync('grim', ['-g', g.geometry, shot]).status === 0)
			e.message += `\n  on screen then: ${shot}`;
		throw e;
	} finally {
		if (recorder) await stop(recorder);
		kitty.kill();
		await killWorld(runDir);
		try {
			hypr('output', 'remove', OUTPUT);
		} catch {
			// Already gone.
		}
		if (!process.env.KEEP) rmSync(world, { recursive: true, force: true, maxRetries: 5 });
	}
	return made;
}

function stop(child) {
	return new Promise((res) => {
		if (child.exitCode !== null) return res();
		child.on('exit', res);
		child.kill('SIGINT');
	});
}

// A still of kitty: PNG as grim takes it, or WebP or JPEG from it.
function still(path, geometry) {
	const out = join(root, path);
	mkdirSync(dirname(out), { recursive: true });
	if (extname(out) === '.png') {
		run('grim', ['-g', geometry, '-l', '9', out]);
	} else {
		const png = join(scratch, 'still.png');
		run('grim', ['-g', geometry, png]);
		run('magick', [png, '-quality', '88', out]);
	}
	return path;
}

// One recording to what the page plays: a WebM (AV1, for browsers that have
// it) and an MP4 (H.264, for the rest) at 1920 wide, a poster (where the tape
// says Poster, else its first second), and the
// chapters as WebVTT when the tape marks any. A `Set Gif` tape also writes
// that gif (the README's), from the same recording.
function encode(name, raw, chapters, length, poster) {
	const base = join(media, name);
	const scale = 'scale=1920:-2:flags=lanczos';
	const ff = (...args) => run('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
	// crf 40 keeps flat terminal colour sharp at a fraction of the size;
	// -g 120: a seek lands within four seconds.
	ff(
		'-i',
		raw,
		'-an',
		'-vf',
		scale,
		'-c:v',
		'libsvtav1',
		'-crf',
		'40',
		'-preset',
		'6',
		'-g',
		'120',
		'-pix_fmt',
		'yuv420p',
		`${base}.webm`
	);
	ff(
		'-i',
		raw,
		'-an',
		'-vf',
		scale,
		'-c:v',
		'libx264',
		'-crf',
		'23',
		'-preset',
		'slow',
		'-tune',
		'animation',
		'-pix_fmt',
		'yuv420p',
		'-movflags',
		'+faststart',
		`${base}.mp4`
	);
	ff(
		'-ss',
		poster.toFixed(2),
		'-i',
		raw,
		'-frames:v',
		'1',
		'-vf',
		scale,
		'-c:v',
		'libwebp',
		'-quality',
		'85',
		`${base}-poster.webp`
	);
	const made = [`static/media/${name}.webm`, `static/media/${name}.mp4`, `static/media/${name}-poster.webp`];
	if (chapters.length) {
		// The recording runs a little past the tape's own clock; the last
		// chapter ends where the video does.
		const real = Number(
			run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw])
		);
		writeFileSync(`${base}.vtt`, vtt(chapters, Math.max(real, length)));
		made.push(`static/media/${name}.vtt`);
	}
	const gif = GIFS[name];
	if (gif) {
		const out = join(root, gif);
		mkdirSync(dirname(out), { recursive: true });
		// 1280 wide at 12 fps with one palette for the whole take: a gif is
		// the README's only moving picture, and GitHub plays nothing else
		// inline from a repository.
		ff(
			'-i',
			raw,
			'-vf',
			'fps=12,scale=1280:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
			out
		);
		made.push(gif);
	}
	if (!process.env.KEEP) rmSync(raw, { force: true });
	return made;
}

// Which recordings the README shows as a gif too.
const GIFS = { demo: 'readme/demo.gif' };

// The README's picture is the page's poster and link preview as well.
function derive() {
	const png = join(root, 'readme/screenshot.png');
	if (!existsSync(png)) return [];
	run('magick', [png, '-quality', '88', join(media, 'screenshot.webp')]);
	// 1200×630, the top of the screenshot: the bar and the panes.
	run('magick', [
		png,
		'-resize',
		'1200x',
		'-crop',
		'1200x630+0+0',
		'+repage',
		'-quality',
		'85',
		join(media, 'og.jpg')
	]);
	return ['static/media/screenshot.webp', 'static/media/og.jpg'];
}

const all = readdirSync(join(here, 'tapes'))
	.filter((f) => f.endsWith('.tape'))
	.map((f) => f.slice(0, -'.tape'.length));
const names = process.argv.slice(2).length ? process.argv.slice(2) : all;
for (const n of names)
	if (!all.includes(n)) throw new Error(`capture: no tape ${n} (have: ${all.join(', ')})`);
const ranma = process.env.RANMA_BIN || run('sh', ['-c', 'command -v ranma']);
const hypr = hyprland();

// One run at a time: two would share the output, its workspace and the
// staged world. A lock left by a run that died is taken over.
mkdirSync(scratch, { recursive: true });
const lock = join(scratch, 'capture.lock');
if (existsSync(lock)) {
	const pid = Number(readFileSync(lock, 'utf8'));
	if (pid && existsSync(`/proc/${pid}`))
		throw new Error(`capture: another run (pid ${pid}) is recording; wait for it`);
}
writeFileSync(lock, String(process.pid));
process.on('exit', () => rmSync(lock, { force: true }));
const made = [];
for (const n of names) {
	await quiet();
	process.stdout.write(`capture: ${n}…\n`);
	made.push(...(await take(n, hypr, ranma)));
	if (n === 'screenshot') made.push(...derive());
}
for (const m of made) process.stdout.write(`  ${m}\n`);
