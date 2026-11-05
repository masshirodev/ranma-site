// The tapes capture/run.mjs plays: vhs's language, the part of it a script
// of keys needs, read here so it can be tested without a terminal. A tape is
// one take: what to type and press into a real kitty, when to wait, when to
// take a picture, where chapters start. doc/WEBSITE.md, "Captures", has the
// whole language; this is its grammar.

const DURATION = /^(\d+(?:\.\d+)?)(ms|s|m)?$/;

/** "500ms", "1.5s", "2" (seconds, as vhs reads a bare number) → seconds. */
export function seconds(text) {
	const m = text.trim().match(DURATION);
	if (!m) throw new Error(`not a duration: ${JSON.stringify(text)}`);
	const n = Number(m[1]);
	return m[2] === 'ms' ? n / 1000 : m[2] === 'm' ? n * 60 : n;
}

// vhs's key names, as kitty's send-key names them.
const KEYS = {
	Enter: 'enter',
	Space: 'space',
	Tab: 'tab',
	Backspace: 'backspace',
	Delete: 'delete',
	Escape: 'escape',
	Up: 'up',
	Down: 'down',
	Left: 'left',
	Right: 'right',
	PageUp: 'page_up',
	PageDown: 'page_down',
	Home: 'home',
	End: 'end',
	Insert: 'insert'
};

// `Enter`, `Left 3`, `Ctrl+B`, `Ctrl+Shift+Left@200ms 2`.
const KEY = /^((?:(?:Ctrl|Alt|Shift)\+)*)(\S+?)(?:@(\S+))?(?:\s+(\d+))?$/;

/** kitty's name for a vhs key, or null when it is not one. */
export function keyName(text) {
	const m = text.match(KEY);
	if (!m) return null;
	const mods = m[1]
		.split('+')
		.filter(Boolean)
		.map((x) => x.toLowerCase());
	const base = KEYS[m[2]] ?? (mods.length && /^\S$/.test(m[2]) ? m[2].toLowerCase() : null);
	if (!base) return null;
	return { key: [...mods, base].join('+'), speed: m[3], count: m[4] ? Number(m[4]) : 1 };
}

// Settings a tape may give, and what each takes.
const SETTINGS = {
	Screen: /^\d+x\d+$/, // the output's pixels
	Scale: /^\d+(?:\.\d+)?$/, // its scale: 2 is a 2x screen
	FontSize: /^\d+(?:\.\d+)?$/, // kitty's, in points
	TypingSpeed: DURATION,
	Mobile: /^(?:true|false)$/ // RANMA_MOBILE for the terminal
};

/**
 * A tape's steps, in order. Throws on anything it does not know, naming the
 * line: a typo in a tape is a take that silently does the wrong thing.
 */
export function parseTape(text) {
	const steps = [];
	let shown = false;
	text.split('\n').forEach((raw, i) => {
		const line = raw.trim();
		const where = `line ${i + 1}`;
		let m;
		const step = (s) => steps.push({ ...s, line: i + 1 });
		if ((m = line.match(/^#\s*chapter:\s*(.+)$/))) {
			if (!shown) throw new Error(`${where}: a chapter before Show`);
			step({ kind: 'chapter', label: m[1].trim() });
		} else if (!line || line.startsWith('#')) {
			return;
		} else if ((m = line.match(/^Set\s+(\w+)\s+(.+)$/))) {
			const [, key, value] = m;
			if (!SETTINGS[key]) throw new Error(`${where}: no setting ${key}`);
			if (!SETTINGS[key].test(value)) throw new Error(`${where}: ${key} can't be ${JSON.stringify(value)}`);
			step({ kind: 'set', key, value });
		} else if ((m = line.match(/^Output\s+(\S+)$/))) {
			step({ kind: 'output', path: m[1] });
		} else if (line === 'Show' || line === 'Hide') {
			shown = line === 'Show';
			step({ kind: line.toLowerCase() });
		} else if ((m = line.match(/^Sleep\s+(\S+)$/))) {
			step({ kind: 'sleep', s: seconds(m[1]) });
		} else if ((m = line.match(/^Type(?:@(\S+))?\s+(["'`])(.*)\2$/))) {
			step({ kind: 'type', text: m[3], ...(m[1] && { speed: seconds(m[1]) }) });
		} else if ((m = line.match(/^Wait(?:@(\S+))?\s+\/(.+)\/$/))) {
			step({ kind: 'wait', re: new RegExp(m[2], 'm'), timeout: m[1] ? seconds(m[1]) : 15 });
		} else if (line === 'Poster') {
			if (!shown) throw new Error(`${where}: a poster before Show`);
			step({ kind: 'poster' });
		} else if ((m = line.match(/^Screenshot\s+(\S+)$/))) {
			step({ kind: 'screenshot', path: m[1] });
		} else {
			const k = keyName(line);
			if (!k) throw new Error(`${where}: not a command: ${JSON.stringify(line)}`);
			step({ kind: 'key', key: k.key, count: k.count, ...(k.speed && { speed: seconds(k.speed) }) });
		}
	});
	return steps;
}

const stamp = (s) => {
	const ms = Math.round(s * 1000);
	const h = Math.floor(ms / 3600000);
	const m = Math.floor((ms % 3600000) / 60000);
	const sec = Math.floor((ms % 60000) / 1000);
	const pad = (n, w = 2) => String(n).padStart(w, '0');
	return `${pad(h)}:${pad(m)}:${pad(sec)}.${pad(ms % 1000, 3)}`;
};

/** A WebVTT chapters track: each chapter runs to the next, the last to `end`. */
export function vtt(chapters, end) {
	const cues = chapters.map((c, i) => {
		const until = i + 1 < chapters.length ? chapters[i + 1].start : end;
		if (until <= c.start) throw new Error(`chapter ${JSON.stringify(c.label)} has no length`);
		return `${i + 1}\n${stamp(c.start)} --> ${stamp(until)}\n${c.label}`;
	});
	return `WEBVTT\n\n${cues.join('\n\n')}\n`;
}
