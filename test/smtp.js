/**
 * StayFolk — SMTP client test.
 * Runs a tiny fake SMTP server, points the mailer at it and checks that a
 * verification email is accepted and its body decodes to the right link.
 */
'use strict';

const net = require('node:net');

const PORT = 2526;
const captured = [];

const server = net.createServer((socket) => {
  let inData = false;
  let buffer = '';
  let body = '';

  socket.write('220 fake.smtp ESMTP ready\r\n');

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');

    let idx;
    while ((idx = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      if (process.env.SMTP_DEBUG) console.log('C:', JSON.stringify(line.slice(0, 40)));
      if (inData) {
        if (line === '.') {
          inData = false;
          captured.push(body);
          body = '';
          socket.write('250 2.0.0 queued\r\n');
        } else {
          body += line + '\n';
        }
        continue;
      }

      if (/^EHLO|^HELO/i.test(line)) {
        socket.write('250-fake.smtp\r\n250-AUTH LOGIN PLAIN\r\n250 8BITMIME\r\n');
      } else if (/^AUTH LOGIN/i.test(line)) {
        socket.write('334 VXNlcm5hbWU6\r\n');
      } else if (/^MAIL FROM/i.test(line)) {
        socket.write('250 2.1.0 ok\r\n');
      } else if (/^RCPT TO/i.test(line)) {
        socket.write('250 2.1.5 ok\r\n');
      } else if (/^DATA/i.test(line)) {
        inData = true;
        socket.write('354 end with .\r\n');
      } else if (/^QUIT/i.test(line)) {
        socket.write('221 bye\r\n');
        socket.end();
      } else if (/^RSET/i.test(line)) {
        socket.write('250 ok\r\n');
      } else if (/^[A-Za-z0-9+/=]{8,}$/.test(line)) {
        // credentials arrive base64-encoded, one line each
        socket.write(socket.__authSeen ? '235 2.7.0 authenticated\r\n' : '334 UGFzc3dvcmQ6\r\n');
        socket.__authSeen = true;
      } else {
        socket.write('250 ok\r\n');
      }
    }
  });

  socket.on('error', () => {});
});

const check = (name, ok, detail = '') =>
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);

(async () => {
  await new Promise((r) => server.listen(PORT, r));

  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String(PORT);
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = 'test@example.com';
  process.env.SMTP_PASS = 'app-password';
  process.env.MAIL_FROM = 'StayFolk <test@example.com>';

  const mailer = require('../server/mailer.js');

  check('provider detected as smtp', mailer.provider() === 'smtp', mailer.provider());
  check('isConfigured() is true', mailer.isConfigured() === true);

  const delivered = await mailer.sendVerification({
    baseUrl: 'https://stayfolk.example',
    to: 'someone@example.com',
    name: 'Anjali',
    token: 'abc123',
  });
  check('send returns delivered', delivered === true, String(delivered));

  await new Promise((r) => setTimeout(r, 300));

  const message = captured[0] || '';
  check('server received one message', captured.length === 1, `${captured.length}`);

  const [head, ...rest] = message.split('\n\n');
  check('headers carry the recipient', /To: someone@example\.com/i.test(head));
  check('headers carry the subject', /Subject: Confirm your StayFolk email/i.test(head));

  const decoded = Buffer.from(rest.join('\n').replace(/\s/g, ''), 'base64').toString('utf8');
  check('body decodes to the verification link',
    decoded.includes('https://stayfolk.example/#/verify?token=abc123'),
    decoded.slice(0, 60));

  /* the diagnostic endpoint path: success and failure must both be reported */
  const good = await mailer.sendTest({ to: 'someone@example.com', name: 'Anjali' });
  check('sendTest reports success', good.ok === true, JSON.stringify(good));

  process.env.SMTP_PORT = '9';
  const bad = await mailer.sendTest({ to: 'someone@example.com', name: 'Anjali' });
  check('sendTest reports the failure reason', bad.ok === false && typeof bad.error === 'string', bad.error || 'no error');

  server.close();
  process.exit(0);
})().catch((err) => {
  console.error('SMTP TEST CRASHED:', err);
  process.exit(1);
});
