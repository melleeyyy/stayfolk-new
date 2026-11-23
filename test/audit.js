/**
 * StayFolk — UI audit.
 * Loads every route at several viewports and reports layout defects:
 * horizontal overflow, elements outside the viewport, clipped text,
 * header collisions and low-contrast text.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..');
const PORT = 8124;
const BASE = `http://127.0.0.1:${PORT}`;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, BASE);
  const file = path.join(ROOT, url.pathname === '/' ? '/index.html' : url.pathname);
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
});

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1180, height: 800 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'phone', width: 390, height: 844 },
];

const ROUTES = ['/', '/explore', '/host/h1', '/cities', '/city/kochi', '/how', '/safety', '/login', '/signup'];

const AUDIT = () => {
  const vw = document.documentElement.clientWidth;
  const issues = [];

  // 1. page-level horizontal overflow
  const docOverflow = document.documentElement.scrollWidth - vw;
  if (docOverflow > 1) issues.push(`page overflows horizontally by ${docOverflow}px`);

  // 2. elements sticking out of the viewport
  const offenders = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const style = getComputedStyle(el);
    if (style.position === 'fixed') return;
    if (r.right > vw + 2 || r.left < -2) {
      const id = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
      offenders.push(`${id} [${Math.round(r.left)}..${Math.round(r.right)}]`);
    }
  });
  if (offenders.length) issues.push('outside viewport: ' + [...new Set(offenders)].slice(0, 6).join(', '));

  // 3. clipped text (single-line elements hiding content)
  const clipped = [];
  document.querySelectorAll('a, span, strong, h1, h2, h3, h4, p, button, td, div').forEach((el) => {
    if (el.children.length) return;
    const style = getComputedStyle(el);
    if (style.overflow !== 'hidden' || style.textOverflow === 'ellipsis') return;
    if (style.webkitLineClamp && style.webkitLineClamp !== 'none') return;
    if (el.scrollWidth > el.clientWidth + 3 && el.textContent.trim().length > 2) {
      clipped.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} "${el.textContent.trim().slice(0, 18)}"`);
    }
  });
  if (clipped.length) issues.push('clipped text: ' + [...new Set(clipped)].slice(0, 5).join(' | '));

  // 4. header collisions
  const brand = document.querySelector('.brand');
  const actions = document.querySelector('.header-actions');
  const nav = document.querySelector('.nav');
  if (brand && actions) {
    const b = brand.getBoundingClientRect();
    const a = actions.getBoundingClientRect();
    if (a.left < b.right - 1 && a.width > 0) issues.push('header actions overlap brand');
    if (nav && getComputedStyle(nav).display !== 'none') {
      const n = nav.getBoundingClientRect();
      if (a.left < n.right - 1) issues.push(`header actions overlap nav by ${Math.round(n.right - a.left)}px`);
    }
  }

  // 5. low contrast body text
  const parse = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const lum = (rgb) => {
    const [r, g, b] = rgb.slice(0, 3).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const bgOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const c = getComputedStyle(node).backgroundColor;
      const p = parse(c);
      if (p.length >= 3 && (p[3] === undefined || p[3] > 0.6)) return p;
      node = node.parentElement;
    }
    return [255, 255, 255];
  };
  const lowContrast = [];
  document.querySelectorAll('.muted, .tiny, .small, .lede, .host-card__place, .review__date').forEach((el) => {
    if (!el.textContent.trim()) return;
    const fg = parse(getComputedStyle(el).color);
    const bg = bgOf(el);
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < 4.4) lowContrast.push(`${el.className.toString().split(' ')[0]} ${ratio.toFixed(2)}:1`);
  });
  if (lowContrast.length) issues.push('low contrast: ' + [...new Set(lowContrast)].slice(0, 5).join(', '));

  // 6. tap targets smaller than 32px on touch widths
  if (vw < 700) {
    const small = [];
    document.querySelectorAll('a, button').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.height < 30 || r.width < 24) small.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`);
    });
    if (small.length) issues.push('small tap targets: ' + [...new Set(small)].slice(0, 6).join(', '));
  }

  return issues;
};

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await puppeteer.launch({
    executablePath: '/usr/local/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const report = [];

  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    for (const route of ROUTES) {
      await page.goto(BASE + '/#' + route, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 250));
      const issues = await page.evaluate(AUDIT);
      if (issues.length) report.push({ vp: vp.name, route, issues });
    }
  }

  // logged-in surfaces
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 300));
  await page.type('#a-email', 'host@stayfolk.demo');
  await page.type('#a-pass', 'demo1234');
  await page.click('#auth-form button[type="submit"]');
  await new Promise((r) => setTimeout(r, 500));
  for (const route of ['/dashboard', '/messages']) {
    for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }]) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(BASE + '/#' + route, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 250));
      const issues = await page.evaluate(AUDIT);
      if (issues.length) report.push({ vp: vp.name, route, issues });
    }
  }

  // dark theme ink section separation
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle2' });
  await page.click('[data-action="toggle-theme"]');
  await new Promise((r) => setTimeout(r, 300));
  const darkInk = await page.evaluate(() => {
    const ink = document.querySelector('.section--ink');
    const body = getComputedStyle(document.body).backgroundColor;
    return { ink: ink ? getComputedStyle(ink).backgroundColor : null, body };
  });
  if (darkInk.ink && darkInk.ink === darkInk.body) {
    report.push({ vp: 'desktop', route: '/ (dark)', issues: [`ink section blends into page: both ${darkInk.ink}`] });
  }
  await page.click('[data-action="toggle-theme"]');

  console.log(JSON.stringify(report, null, 1));
  console.log('\nTOTAL ISSUE GROUPS:', report.length);

  // screenshots for visual review
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(__dirname, 'a-home.png') });
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(__dirname, 'a-home-mobile.png') });
  await page.setViewport({ width: 1180, height: 800 });
  await page.goto(BASE + '/#/explore', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(__dirname, 'a-explore.png') });
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE + '/#/host/h1', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(__dirname, 'a-host-mobile.png') });

  await browser.close();
  server.close();
})().catch((e) => { console.error('AUDIT CRASH', e); process.exit(1); });
