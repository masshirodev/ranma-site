import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chapters, excerpt, latestRelease } from '../lib/data.mjs';
import { contrast, lua, swatchCss, toml } from '../lib/highlight.mjs';
import { esc, html, raw, toString } from '../lib/html.mjs';
import { keyName, parseTape, seconds, vtt } from '../lib/tape.mjs';
import { ranmaDir } from '../build.mjs';

test('html escapes what it interpolates, and only that', () => {
	const evil = '<script>"&\'';
	assert.equal(esc(evil), '&lt;script&gt;&quot;&amp;&#39;');
	assert.equal(toString(html`<p title="${evil}">${evil}</p>`), `<p title="${esc(evil)}">${esc(evil)}</p>`);
	assert.equal(toString(html`<b>${raw('<i>x</i>')}</b>`), '<b><i>x</i></b>');
	assert.equal(toString(html`${[html`<a>`, 'b&', null, false, undefined, 0]}`), '<a>b&amp;0');
	assert.equal(
		toString(html`<ul>${['a', 'b'].map((x) => html`<li>${x}</li>`)}</ul>`),
		'<ul><li>a</li><li>b</li></ul>'
	);
});

test('latestRelease reads the last v* tag and its day', () => {
	const calls = [];
	const git = (_repo, args) => {
		calls.push(args.join(' '));
		return args[0] === 'describe' ? 'v0.4.0' : '2026-10-16';
	};
	assert.deepEqual(latestRelease('/r', git), { tag: 'v0.4.0', version: '0.4.0', date: '2026-10-16' });
	assert.match(calls[0], /--match v\[0-9\]\*/);
	assert.equal(calls[1], 'log -1 --format=%cs v0.4.0');
});

test('latestRelease refuses a missing tag, an odd one, or no date', () => {
	assert.throws(
		() =>
			latestRelease('/r', () => {
				throw new Error('no names');
			}),
		/fetch-depth: 0/
	);
	assert.throws(() => latestRelease('/r', () => 'nightly'), /unexpected tag/);
	assert.throws(() => latestRelease('/r', (_r, a) => (a[0] === 'describe' ? 'v1.0.0' : '')), /no date/);
});

test('the ranma checkout has a release', () => {
	const r = latestRelease(ranmaDir());
	assert.match(r.version, /^\d+\.\d+\.\d+/);
	assert.match(r.date, /^\d{4}-\d{2}-\d{2}$/);
});

test('excerpt quotes numbered ranges with a gap, and refuses lines that moved', () => {
	const text = ['a1', 'b2', 'c3', 'd4', 'e5'].join('\n');
	assert.deepEqual(
		excerpt(
			text,
			[
				[1, 2],
				[4, 5]
			],
			['a', 'd']
		),
		[{ n: 1, text: 'a1' }, { n: 2, text: 'b2' }, { gap: true }, { n: 4, text: 'd4' }, { n: 5, text: 'e5' }]
	);
	assert.throws(() => excerpt(text, [[2, 3]], ['a']), /line 2 reads "b2"/);
	assert.throws(() => excerpt(text, [[4, 9]], ['d']), /outside a 5-line file/);
	assert.throws(() => excerpt(text, [[3, 2]], ['c']), /outside/);
	assert.throws(() => excerpt(text, [[0, 1]], ['a']), /outside/);
});

test('chapters reads a WebVTT chapters track', () => {
	const track =
		'WEBVTT\n\n1\n00:00:00.000 --> 00:00:13.300\nfirst one\n\n2\n00:00:13.300 --> 00:01:02.500\nsecond\n\nNOTE no timing here\n\n3\n00:01:02.500 --> 00:01:03.000\n\n';
	assert.deepEqual(chapters(track), [
		{ start: 0, label: 'first one' },
		{ start: 13.3, label: 'second' }
	]);
	assert.deepEqual(chapters('WEBVTT\n\n00:05.000 --> 00:06.000\nshort stamps'), [
		{ start: 5, label: 'short stamps' }
	]);
	assert.throws(() => chapters('1\n00:00 --> 00:01\nx'), /not a WebVTT/);
});

test('lua colours the API, strings, numbers, keywords and comments', () => {
	assert.equal(
		lua('ranma.set { theme = "sumi" } -- a <note>'),
		'<span class="t-api">ranma.set</span> { theme = <span class="t-str">&quot;sumi&quot;</span> } <span class="t-comment">-- a &lt;note&gt;</span>'
	);
	assert.equal(lua('  interval = 60,'), '  interval = <span class="t-num">60</span>,');
	assert.equal(
		lua('render = function() return x end'),
		'render = <span class="t-kw">function</span>() <span class="t-kw">return</span> x <span class="t-kw">end</span>'
	);
	assert.equal(lua('"a \\" b"'), '<span class="t-str">&quot;a \\&quot; b&quot;</span>');
	assert.equal(lua('"unterminated'), '<span class="t-str">&quot;unterminated</span>');
});

test('toml colours tables, values and comments, and swatches hex colours', () => {
	const panels = ['#18171a', '#f8f5ee'];
	assert.equal(toml('# sumi', panels), '<span class="t-comment"># sumi</span>');
	assert.equal(toml('[colors]', panels), '<span class="t-table">[colors]</span>');
	assert.equal(toml('style = "rounded"', panels), 'style = <span class="t-str">&quot;rounded&quot;</span>');
	assert.equal(toml('width = 2', panels), 'width = <span class="t-num">2</span>');
	assert.equal(toml('not toml at all', panels), 'not toml at all');
	assert.match(toml('a = "#d9a55b"', panels), /class="swatch sw-d9a55b" aria-hidden/);
	// Near the dark panel, and near the light one: both outlined.
	assert.match(toml('a = "#3a3631"', panels), /sw-3a3631 swatch-edge/);
	assert.match(toml('a = "#e8e1d3"', panels), /sw-e8e1d3 swatch-edge/);
});

test('contrast is WCAG 2 contrast', () => {
	assert.equal(contrast('#000000', '#ffffff'), 21);
	assert.equal(contrast('#777777', '#777777'), 1);
});

test('swatchCss writes one rule per colour, once', () => {
	const css = swatchCss(
		'<span class="swatch sw-d9a55b"></span><span class="sw-d9a55b"></span><span class="sw-3a3631"></span>'
	);
	assert.equal(css, '.sw-3a3631{background:#3a3631}\n.sw-d9a55b{background:#d9a55b}');
	assert.equal(swatchCss('none here'), '');
});

test('seconds reads vhs durations', () => {
	assert.equal(seconds('500ms'), 0.5);
	assert.equal(seconds('1.5s'), 1.5);
	assert.equal(seconds('2'), 2);
	assert.equal(seconds('1m'), 60);
	assert.throws(() => seconds('soon'), /not a duration/);
});

test('keyName gives kitty the names vhs uses', () => {
	assert.deepEqual(keyName('Enter'), { key: 'enter', speed: undefined, count: 1 });
	assert.deepEqual(keyName('Ctrl+B'), { key: 'ctrl+b', speed: undefined, count: 1 });
	assert.deepEqual(keyName('PageUp@200ms 3'), { key: 'page_up', speed: '200ms', count: 3 });
	assert.deepEqual(keyName('Ctrl+Shift+Left'), { key: 'ctrl+shift+left', speed: undefined, count: 1 });
	assert.equal(keyName('b'), null, 'a bare letter is typed, not pressed');
	assert.equal(keyName('Ctrl+Nope'), null);
	assert.equal(keyName('two words here'), null);
});

test('parseTape reads every command, in order, with its line', () => {
	const steps = parseTape(
		[
			'# a comment',
			'Set Screen 2560x1520',
			'Set TypingSpeed 60ms',
			'Output temp/demo.mkv',
			'Hide',
			'Type "ranma"',
			'Enter',
			'Show',
			'# chapter: the start',
			'Type@10ms "fast"',
			'Ctrl+B',
			'Left 3',
			'Sleep 1.5s',
			'Wait@40s /test result: ok/',
			'Wait /\\$ $/',
			'Poster',
			'Screenshot temp/hero.png'
		].join('\n')
	);
	const kinds = steps.map((s) => s.kind);
	assert.deepEqual(kinds, [
		'set',
		'set',
		'output',
		'hide',
		'type',
		'key',
		'show',
		'chapter',
		'type',
		'key',
		'key',
		'sleep',
		'wait',
		'wait',
		'poster',
		'screenshot'
	]);
	assert.deepEqual(steps[0], { kind: 'set', key: 'Screen', value: '2560x1520', line: 2 });
	assert.equal(steps[7].label, 'the start');
	assert.equal(steps[8].speed, 0.01);
	assert.equal(steps[4].speed, undefined, "the tape's TypingSpeed applies");
	assert.deepEqual([steps[10].key, steps[10].count], ['left', 3]);
	assert.equal(steps[11].s, 1.5);
	assert.equal(steps[12].timeout, 40);
	assert.ok(steps[12].re.test('test result: ok. 9 passed'));
	assert.equal(steps[13].timeout, 15, 'a wait gives up after 15s unless it says');
	assert.ok(steps[13].re.test('one\n$ '), 'multiline: $ ends a row');
	assert.equal(steps[15].path, 'temp/hero.png');
});

test('parseTape refuses what it does not know, naming the line', () => {
	assert.throws(() => parseTape('Show\nTpye "x"'), /line 2: not a command/);
	assert.throws(() => parseTape('Set Colour red'), /line 1: no setting Colour/);
	assert.throws(() => parseTape('Set Screen big'), /line 1: Screen can't be "big"/);
	assert.throws(() => parseTape('# chapter: early\nShow'), /line 1: a chapter before Show/);
	assert.throws(() => parseTape('Show\nHide\n# chapter: hidden'), /line 3: a chapter before Show/);
	assert.throws(() => parseTape('Sleep soon'), /not a duration/);
	assert.throws(() => parseTape('Poster'), /line 1: a poster before Show/);
});

test('vtt writes a chapters track the page can read back', () => {
	const track = vtt(
		[
			{ start: 0, label: 'one' },
			{ start: 61.25, label: 'two' }
		],
		3725.5
	);
	assert.equal(
		track,
		'WEBVTT\n\n1\n00:00:00.000 --> 00:01:01.250\none\n\n2\n00:01:01.250 --> 01:02:05.500\ntwo\n'
	);
	assert.deepEqual(chapters(track), [
		{ start: 0, label: 'one' },
		{ start: 61.25, label: 'two' }
	]);
	assert.throws(() => vtt([{ start: 5, label: 'late' }], 5), /no length/);
});

test('every tape in capture/tapes parses, and the demo has its six chapters', () => {
	const { readdirSync, readFileSync } = process.getBuiltinModule('node:fs');
	const dir = new URL('../capture/tapes/', import.meta.url);
	const tapes = readdirSync(dir).filter((f) => f.endsWith('.tape'));
	assert.ok(tapes.includes('demo.tape') && tapes.includes('screenshot.tape'), tapes.join(' '));
	for (const name of tapes) parseTape(readFileSync(new URL(name, dir), 'utf8'));
	const demo = parseTape(readFileSync(new URL('demo.tape', dir), 'utf8'));
	assert.equal(demo.filter((s) => s.kind === 'chapter').length, 6);
});
