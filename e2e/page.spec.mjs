// What the generated frame test (frame.spec.mjs) can't see: the page as a
// visitor without JavaScript gets it, the controls the script adds, phone
// width, and that nothing leaves for another origin.

import { expect, test } from '@playwright/test';
import { ranmaDir } from '../build.mjs';
import { latestRelease } from '../lib/data.mjs';

// The release the build read: the ranma checkout's, not this repository's.
const { tag } = latestRelease(ranmaDir());

test('the sections come in the handoff order, and the release is the latest tag', async ({ page }) => {
	await page.goto('/');
	const ids = await page.locator('main section[id]').evaluateAll((s) => s.map((e) => e.id));
	expect(ids).toEqual(['demo', 'features', 'config', 'why', 'install']);
	await expect(page.locator('.bar-nav').getByText(tag, { exact: true })).toBeVisible();
	await expect(page.locator('.install-head a')).toContainText(tag);
});

test('nothing on the page is fetched from another origin', async ({ page, baseURL }) => {
	const foreign = [];
	page.on('request', (r) => {
		if (!r.url().startsWith(baseURL) && !r.url().startsWith('data:')) foreign.push(r.url());
	});
	await page.goto('/', { waitUntil: 'networkidle' });
	await page.mouse.wheel(0, 20000);
	await page.waitForLoadState('networkidle');
	expect(foreign).toEqual([]);
});

test('the page never scrolls sideways', async ({ page }) => {
	await page.goto('/');
	const [scroll, client] = await page.evaluate(() => [
		document.documentElement.scrollWidth,
		document.documentElement.clientWidth
	]);
	expect(scroll).toBeLessThanOrEqual(client);
});

test('a panel that scrolls sideways has its scrollbar at its bottom, however short its file', async ({
	page
}) => {
	await page.goto('/');
	// Each scrolling box ends where its panel's content ends: at the panel's
	// bottom for the config files, just above the footer for the repositories.
	const gaps = await page.evaluate(() => {
		const out = [];
		for (const s of document.querySelectorAll('.code-scroll')) {
			const panel = s.closest('.code-file').getBoundingClientRect();
			out.push(Math.round(panel.bottom - s.getBoundingClientRect().bottom));
		}
		for (const pre of document.querySelectorAll('.repo pre')) {
			const foot = pre.parentElement.querySelector('.repo-foot').getBoundingClientRect();
			out.push(Math.round(foot.top - pre.getBoundingClientRect().bottom));
		}
		return out;
	});
	expect(gaps.length).toBeGreaterThan(3);
	for (const g of gaps) expect(Math.abs(g)).toBeLessThanOrEqual(2);
});

test('the tuios panel says what ranma does, nothing against tuios', async ({ page }) => {
	// The owner's call (doc/WEBSITE.md, "Where it departs from the handoff").
	await page.goto('/');
	const tuios = page.locator('.other', { hasText: 'tuios' });
	await expect(tuios).toContainText('the model for the feel');
	await expect(tuios).not.toContainText(/bug|faster|slow|worse/i);
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('every command is there as text, and no control that would do nothing is shown', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.oneliner').first()).toContainText(
			'curl -fsSL https://masshirodev.github.io/ranma/install.sh | sh'
		);
		await expect(page.locator('[data-copy]').first()).toBeHidden();
		expect(await page.locator('[data-copy]:visible').count()).toBe(0);
		await expect(page.locator('.theme-toggle')).toBeHidden();
	});

	test('the theme follows the system', async ({ browser }) => {
		const ctx = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'light' });
		const page = await ctx.newPage();
		await page.goto('/');
		const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
		expect(bg).toBe('rgb(243, 238, 227)');
		await ctx.close();
	});
});

test.describe('with JavaScript', () => {
	test('the theme toggle switches, says what it switches to, and is remembered', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/');
		const toggle = page.locator('.theme-toggle');
		await expect(toggle).toBeVisible();
		await expect(toggle).toHaveAccessibleName('Switch to light theme');
		await toggle.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
		await expect(toggle).toHaveAccessibleName('Switch to dark theme');
		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
		expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
			'rgb(243, 238, 227)'
		);
	});

	test('a copy button copies its command', async ({ page, context, browserName }) => {
		test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only here');
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.goto('/');
		const row = page.locator('.channels li', { hasText: 'Homebrew' });
		const button = row.getByRole('button', { name: 'Copy: Homebrew' });
		await button.click();
		await expect(button).toHaveText('Copied');
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
			'brew install masshirodev/tap/ranma'
		);
	});

	test('the workspace pill follows the section on screen', async ({ page }) => {
		await page.goto('/#config');
		await expect(page.locator('.workspaces a[href="#config"]')).toHaveAttribute('aria-current', 'true');
	});
});
