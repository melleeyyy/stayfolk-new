# StayFolk

**A hospitality exchange — travel like a local, host like a friend.**

StayFolk is a working Couchsurfing-style site: people create a profile, upload photos, find a host in another city, send a stay request, chat, and leave a review. It runs in two modes from the same codebase.

| Mode | What it is | Where |
|---|---|---|
| **Live** | Real accounts, photos, requests and messages shared between people on different devices | `node server/index.js` |
| **Demo** | Everything works but state stays in the browser — no sign-up server needed | GitHub Pages |

**Live demo (browser-only):** https://melleeyyy.github.io/stayfolk/
**Run it for real:** see [Getting started](#getting-started) — one command, no dependencies.

---

## What a person can actually do

1. **Sign up** with a name, a unique **username**, email, password and an optional photo (scrypt-hashed, httpOnly cookie session).
2. **Verify the email** — a one-click link, with a resend button if it gets lost.
3. **Build a profile** — cover photo, avatar, city, bio, languages spoken.
4. **Change the password** at any time, or reset it from the sign-in page if forgotten.
5. **Turn hosting on** — say what space you have, how many guests, whether it is women-only.
6. **Find a host** — filter by city, guests, spoken language, verified-only or women-only; sort by rating, response speed or newness.
7. **Send a request** with dates, number of guests and a personal message.
8. **Answer requests** from the host dashboard — accept or decline.
9. **Chat** — messages are stored on the server and both sides see them, with polling every few seconds.
10. **Leave a review** after a stay; reviews are permanent and two-sided.
11. **Report a profile** if something is wrong.

Plus a **Form C / FRRO checklist** for Indian hosts taking foreign guests — the reporting obligation most hospitality-exchange clones miss — with saved progress and a printable version.

**12 languages** (English default, Hindi, Malayalam, Tamil, French, Spanish, German, Portuguese, Russian, Arabic with full RTL, Korean, Japanese), light and dark themes, installable as a PWA, and usable on a phone.

## Getting started

```bash
git clone https://github.com/melleeyyy/stayfolk.git
cd stayfolk
node server/index.js
```

Open **http://localhost:8787**. That is the whole setup — there are no dependencies to install and no build step.

The first account you create becomes the moderator. Everything is stored in `server/data/`:

```
server/data/db.json      accounts, sessions, requests, threads, messages, reviews
server/data/uploads/     uploaded photos (JPEG, downscaled in the browser first)
```

Delete that folder to start fresh.

To let someone else join, run the server on a machine they can reach and share the address — on the same Wi-Fi that is `http://<your-lan-ip>:8787`.

## Deploying so real people can use it

The site and the API are one Node process, so any Node host works.

**Render (easiest):** see **[RENDER.md](RENDER.md)** for the exact click-by-click steps, the environment variables that matter (`PUBLIC_URL`, mail keys) and the free-plan disk caveat.

**Fly.io / Railway / a VPS:** the same, with a volume mounted at `/app/server/data`.

**Docker:**

```bash
docker build -t stayfolk .
docker run -p 8080:8080 -v stayfolk-data:/app/server/data stayfolk
```

Whatever you choose, mount `server/data` on a persistent volume — that folder *is* the database.

## Architecture

```
index.html                 app shell
manifest.webmanifest       PWA metadata, icons, shortcuts
sw.js                      service worker (offline app shell)
assets/css/app.css         design system + all components
assets/js/
  api.js                   fetch wrapper + server detection
  locales-auth.js          account-security strings (username, verification, passwords)
  store.js                 the whole data layer, in two modes (remote / local)
  app.js                   router, chrome, delegated events, polling, PWA
  views.js                 every screen as a pure render function
  data.js                  24 seed hosts, 18 cities, reviews
  i18n.js                  English source strings + t()
  locales.js               11 translated locales
  locales-extra.js         strings added after v1, merged into the same tables
  media.js                 generated SVG covers and avatars
server/index.js            accounts, sessions, uploads, requests, messaging
server/mailer.js           Brevo / Resend / console email for verification and reset
test/e2e.js                static-mode smoke test (37 checks)
test/live.js               two real users against the real server (12 checks)
test/audit.js              layout audit: overflow, clipping, contrast, tap targets
```

**How the two modes work.** `server/index.js` injects `<meta name="stayfolk-server">` into the HTML it serves. If `store.js` finds that tag it talks to the API; if it does not (GitHub Pages) it runs the identical UI against localStorage. Views never know the difference — they read one synchronous state object, and mutations return promises.

**Security notes.** Passwords are scrypt-hashed with a per-user salt; sessions are random 24-byte tokens in httpOnly, SameSite=Lax cookies; the upload endpoint only accepts base64 JPEG/PNG/WebP under 6 MB and writes them outside the web root's source tree; the auth endpoints are rate-limited per IP; every message and thread is checked against the signed-in user before it is returned.

## Brand palette

| Token | Hex | Use |
|---|---|---|
| Blue | `#3A79F7` | Primary actions, links, focus rings |
| Green | `#5CC43C` | Verified states, accept actions, accents |
| Black | `#000000` | Ink sections, primary text, brand mark |
| White | `#FFFFFF` | Surfaces, text on ink |

## Tests

```bash
node test/e2e.js      # static demo: 37 checks
node test/live.js     # two people on the real server: 17 checks
node test/audit.js    # layout audit across 4 viewports
```

`test/live.js` boots the server and drives isolated browser sessions: A signs up with a username, turns hosting on, uploads a photo, confirms the email through the real token, changes the password, logs back in with the username; B finds A in the directory, sends a request, A accepts, they exchange messages, and a signed-out visitor is refused.

## API

```
POST   /api/auth/signup            { name, username, email, password, city }
POST   /api/auth/login             { email | username, password }
POST   /api/auth/logout
POST   /api/auth/verify            { token }
POST   /api/auth/resend-verification
POST   /api/auth/forgot            { email }
POST   /api/auth/reset             { token, password }
POST   /api/me/password            { current, next }
GET    /api/bootstrap              everything the client needs for its first paint
PATCH  /api/me                     { name, username, city, bio, languages, hosting }
POST   /api/me/photo               { kind: avatar|cover, dataUrl }
DELETE /api/me/photo?kind=avatar
POST   /api/requests               { hostId, from, to, guests, message }
PATCH  /api/requests/:id           { status: accepted|declined }  (host only)
POST   /api/threads                { hostId, userId }
GET    /api/threads/:id/messages
POST   /api/threads/:id/messages   { text }
GET    /api/sync?since=ISO_DATE    new messages and requests for polling
POST   /api/reviews                { hostId, rating, text }
POST   /api/reports                { targetType, targetId, reason, detail }
GET    /api/health
```

## Notes for a real launch

- **Stays are free.** The moment money changes hands for accommodation the product becomes a rental marketplace, with a different legal, tax and licensing position.
- **Requests, not bookings.** Hosts keep the right to decline; that asymmetry is what makes the community feel human.
- **Reviews are permanent and two-sided.** Nobody can delete a review written about them.
- **ID documents are never stored** — only a pass/fail result, checked through a KYC provider.
- **India-specific:** a host taking a foreign guest must report the arrival to the local FRO/FRRO or police (Form C, normally within 24 hours). It is built into the product as a checklist.
- **Data protection:** personal data falls under the DPDP Act, 2023 — collect the minimum, state the purpose, and give a deletion path.

## Roadmap

1. **Now** — accounts, profiles, photos, requests, messaging, reviews, 12 languages, PWA.
2. **Next** — email notifications, image galleries, real-time messaging over WebSockets, moderation endpoints for reports and verification.
3. **Later** — events and hangouts, city ambassadors, mobile apps, trust scoring.

## License

MIT — see [LICENSE](LICENSE).
