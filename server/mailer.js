/**
 * StayFolk — mailer.
 *
 * Four ways to send, picked automatically from the environment, so the site
 * works with or without email configured:
 *
 *   SMTP_HOST / SMTP_USER / SMTP_PASS   → any SMTP server (Gmail, Zoho, Outlook…)
 *   BREVO_API_KEY                       → Brevo HTTP API
 *   RESEND_API_KEY                      → Resend HTTP API
 *   (none of the above)                 → console mode: links print to the log
 *
 * The SMTP client below is written against the protocol directly, so there is
 * still nothing to install. It supports implicit TLS (port 465), STARTTLS
 * (port 587) and plain connections (used by the test server).
 */

'use strict';

const net = require('node:net');
const tls = require('node:tls');
const os = require('node:os');

const FROM = process.env.MAIL_FROM || 'StayFolk <onboarding@resend.dev>';
const FROM_EMAIL = (FROM.match(/<([^>]+)>/) || [null, FROM])[1];

/* ------------------------------------------------------------------ mode */

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function provider() {
  if (smtpConfigured()) return 'smtp';
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  return 'console';
}

const isConfigured = () => provider() !== 'console';

/* --------------------------------------------------------------- content */

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function wrap(title, body, cta, link) {
  return `<!doctype html><html><body style="margin:0;background:#F7F8FA;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:700;color:#0A0B0D;margin-bottom:20px">StayFolk</div>
    <div style="background:#fff;border:1px solid #E5E8EE;border-radius:14px;padding:28px">
      <h1 style="font-size:19px;margin:0 0 12px;color:#0A0B0D">${escapeHtml(title)}</h1>
      <p style="font-size:15px;line-height:1.6;color:#4B5261;margin:0 0 22px">${escapeHtml(body)}</p>
      <a href="${link}" style="display:inline-block;background:#3A79F7;color:#fff;text-decoration:none;
         padding:12px 22px;border-radius:10px;font-weight:600;font-size:15px">${escapeHtml(cta)}</a>
      <p style="font-size:12px;color:#6B7280;margin:22px 0 0;word-break:break-all">${escapeHtml(link)}</p>
    </div>
    <p style="font-size:12px;color:#6B7280;text-align:center;margin-top:18px">
      If you did not ask for this, you can ignore the message.</p>
  </div></body></html>`;
}

/* ------------------------------------------------------------------ smtp */

/** Minimal line-oriented SMTP conversation over a socket. */
class Session {
  constructor(socket) {
    this.socket = socket;
    this.buf = '';
    this.lines = [];
    this.waiting = [];
    this.dead = false;
    this.onData = (d) => {
      this.buf += d.toString('utf8');
      this.pump();
    };
    this.onError = (err) => this.fail(err);
    this.onClose = () => this.fail(new Error('connection closed'));
    socket.on('data', this.onData);
    socket.on('error', this.onError);
    socket.on('close', this.onClose);
  }

  pump() {
    let i;
    while ((i = this.buf.indexOf('\r\n')) >= 0) {
      const line = this.buf.slice(0, i);
      this.buf = this.buf.slice(i + 2);
      if (this.waiting.length) this.waiting.shift().resolve(line);
      else this.lines.push(line);
    }
  }

  fail(err) {
    this.dead = true;
    this.error = err;
    while (this.waiting.length) this.waiting.shift().reject(err);
  }

  read() {
    if (this.lines.length) return Promise.resolve(this.lines.shift());
    if (this.dead) return Promise.reject(this.error || new Error('socket closed'));
    return new Promise((resolve, reject) => this.waiting.push({ resolve, reject }));
  }

  async reply() {
    let line = await this.read();
    const code = Number(line.slice(0, 3));
    // multi-line replies (EHLO advertises its capabilities this way) must be
    // joined, otherwise AUTH is never seen and Gmail rejects the message
    let text = line.slice(4);
    while (line.length > 3 && line[3] === '-') {
      line = await this.read();
      text += ' ' + line.slice(4);
    }
    return { code, text };
  }

  async cmd(command, expect = [200, 300]) {
    if (command) this.socket.write(command + '\r\n');
    const res = await this.reply();
    if (!expect.some((c) => res.code >= c && res.code < c + 100)) {
      throw new Error(`SMTP ${command ? command.split(' ')[0] : 'greeting'} failed: ${res.code} ${res.text}`);
    }
    return res;
  }

  detach() {
    this.socket.removeListener('data', this.onData);
    this.socket.removeListener('error', this.onError);
    this.socket.removeListener('close', this.onClose);
  }
}

function base64Lines(text) {
  return Buffer.from(text, 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n').trim();
}

function buildMessage({ to, subject, html, text }) {
  const domain = FROM_EMAIL.split('@')[1] || 'stayfolk.local';
  const headers = [
    `From: ${FROM}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ];
  return `${headers.join('\r\n')}\r\n\r\n${base64Lines(html || `<pre>${text || ''}</pre>`)}`;
}

async function smtpSend({ to, subject, html, text }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const implicitTls = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE !== 'false'
    : port === 465;

  const socket = implicitTls
    ? tls.connect({ host, port, servername: host })
    : net.connect({ host, port });

  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('error', reject);
    socket.setTimeout(15000, () => reject(new Error('SMTP timeout')));
  });

  let session = new Session(socket);
  await session.cmd(null, [200]); // greeting

  const hostname = os.hostname() || 'stayfolk';
  let res = await session.cmd(`EHLO ${hostname}`, [200]);
  let capabilities = res.text.toLowerCase();

  // upgrade to TLS when the server offers it and we are not already encrypted
  if (!implicitTls && capabilities.includes('starttls')) {
    await session.cmd('STARTTLS', [200]);
    session.detach();
    const secured = tls.connect({ socket, servername: host });
    await new Promise((resolve, reject) => {
      secured.once('secureConnect', resolve);
      secured.once('error', reject);
    });
    session = new Session(secured);
    res = await session.cmd(`EHLO ${hostname}`, [200]);
    capabilities = res.text.toLowerCase();
  }

  if (capabilities.includes('auth')) {
    await session.cmd('AUTH LOGIN', [300]);
    await session.cmd(Buffer.from(user, 'utf8').toString('base64'), [300]);
    await session.cmd(Buffer.from(pass, 'utf8').toString('base64'), [200]);
  }

  await session.cmd(`MAIL FROM:<${FROM_EMAIL}>`, [200]);
  await session.cmd(`RCPT TO:<${to}>`, [200]);
  await session.cmd('DATA', [300]);
  socket.write(buildMessage({ to, subject, html, text }) + '\r\n.\r\n');
  await session.cmd(null, [200]);
  try {
    await session.cmd('QUIT', [200]);
  } catch {
    /* the server may hang up immediately; the message is already accepted */
  }
  socket.end();
}

/* ------------------------------------------------------------------ http */

async function post(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${url} → ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json().catch(() => ({}));
}

/* ------------------------------------------------------------------ send */

/** Deliver or throw — used by send() and by the diagnostic test. */
async function deliver({ to, subject, text, html }) {
  const mode = provider();
  if (mode === 'smtp') {
    await smtpSend({ to, subject, html, text });
    return mode;
  }
  if (mode === 'brevo') {
    await post(
      'https://api.brevo.com/v3/smtp/email',
      { 'api-key': process.env.BREVO_API_KEY, accept: 'application/json' },
      {
        sender: { name: 'StayFolk', email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }
    );
    return mode;
  }
  await post(
    'https://api.resend.com/emails',
    { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    { from: FROM, to, subject, html, text }
  );
  return mode;
}

/** Send one test message and report exactly what the provider said. */
async function sendTest({ to, name }) {
  const mode = provider();
  if (mode === 'console') {
    return { ok: false, provider: mode, error: 'No mail provider is configured on the server.' };
  }
  try {
    const url = link(process.env.PUBLIC_URL || 'http://localhost', '/dashboard');
    await deliver({
      to,
      subject: 'StayFolk test email',
      text: `Hi ${name}, if you can read this, email delivery works. ${url}`,
      html: wrap('Email delivery works', `Hi ${name}, if you can read this, StayFolk can send email through ${mode}.`, 'Open StayFolk', url),
    });
    return { ok: true, provider: mode };
  } catch (err) {
    return { ok: false, provider: mode, error: err.message };
  }
}

async function send({ to, subject, text, html }) {
  const mode = provider();

  if (mode === 'console') {
    console.log('\n──────── email (console mode) ────────');
    console.log(`To: ${to}\nSubject: ${subject}\n\n${text}\n`);
    console.log('──────────────────────────────────────\n');
    return false;
  }

  try {
    await deliver({ to, subject, html, text });
    return true;
  } catch (err) {
    console.error('[stayfolk] email failed:', err.message);
    console.log(`[stayfolk] fallback link for ${to}: ${text}`);
    return false;
  }
}

/* --------------------------------------------------------------- letters */

const link = (base, path) => `${String(base || '').replace(/\/$/, '')}/#${path}`;

function sendVerification({ baseUrl, to, name, token }) {
  const url = link(baseUrl, `/verify?token=${encodeURIComponent(token)}`);
  return send({
    to,
    subject: 'Confirm your StayFolk email',
    text: `Hi ${name}, confirm your email to finish setting up StayFolk: ${url}\n\nThe link is valid for 24 hours.`,
    html: wrap('Confirm your email', `Hi ${name}, one click and your StayFolk account is ready. The link is valid for 24 hours.`, 'Confirm email', url),
  });
}

function sendPasswordReset({ baseUrl, to, name, token }) {
  const url = link(baseUrl, `/reset?token=${encodeURIComponent(token)}`);
  return send({
    to,
    subject: 'Reset your StayFolk password',
    text: `Hi ${name}, someone asked to reset your StayFolk password. If it was you: ${url}\n\nThe link is valid for one hour. If it was not you, ignore this email — your password has not changed.`,
    html: wrap('Reset your password', `Hi ${name}, use the button below to choose a new password. The link works for one hour. If you did not ask for this, ignore this email.`, 'Choose a new password', url),
  });
}

module.exports = { send, sendTest, sendVerification, sendPasswordReset, provider, isConfigured, smtpSend };
