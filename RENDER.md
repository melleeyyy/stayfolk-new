# Deploying StayFolk on Render

Everything here is done in the Render dashboard. The repo already contains the
blueprint, so this takes about five minutes.

---

## 1. Create the service

1. Sign in to <https://dashboard.render.com>.
2. Click **New → Blueprint**.
3. Connect GitHub if asked, then choose the **`melleeyyy/stayfolk`** repository.
4. Render reads `render.yaml` and shows one web service named **stayfolk**.
5. Click **Apply**.

Render builds and starts it. When the log says `StayFolk running → http://…`,
the site is live at `https://stayfolk-xxxx.onrender.com`.

The first account you create on the live site becomes the **moderator**.

---

## 2. Set these environment variables (important)

Open the service → **Environment** → **Add Environment Variable**.

| Key | Value | Why |
|---|---|---|
| `PUBLIC_URL` | `https://your-service.onrender.com` | Verification and password-reset emails need an absolute link. Without this they point at `localhost`. |
| `NODE_ENV` | `production` | Makes the session cookie `Secure`. |
| `MAIL_FROM` | `StayFolk <you@gmail.com>` | The sender address your email provider has verified. |

Optional, only when you want real emails (see step 3): `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS` for Gmail, or `BREVO_API_KEY` / `RESEND_API_KEY`.

Copy the exact URL Render shows at the top of the service page — no trailing slash.

---

## 3. Turn on email (free)

Without a provider the site still works: signup and password reset succeed, but
the email is only printed to the Render log. To actually deliver it, pick one.

### Option A — your own Gmail (no third-party signup)

Gmail sends up to ~500 messages a day for free and needs no domain.

1. In your Google Account, open **Security** and turn on **2-Step Verification**.
2. Still under Security, open **App passwords**
   (<https://myaccount.google.com/apppasswords>).
3. Create one named `StayFolk` and copy the **16-character password** it shows.
   This is not your normal Gmail password — it is a one-off app password.
4. In Render add:

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 465
SMTP_USER = your.address@gmail.com
SMTP_PASS = the 16-character app password, no spaces
MAIL_FROM = StayFolk <your.address@gmail.com>
```

Gmail sometimes files the first message under **Spam** — check there, and mark
it "not spam" so the next ones land in the inbox.

*App passwords are unavailable on some Google Workspace accounts (an admin can
switch them off). If the menu is missing, use Option B or C.*

### Option B — Brevo (300 emails/day free)

1. Create a free account at <https://www.brevo.com>.
2. **Senders & IP → Senders → Add a sender** and verify your email address.
3. **SMTP & API → API Keys → Generate a new API key** (v3).
4. In Render add:

```
BREVO_API_KEY = xkeysib-...
MAIL_FROM     = StayFolk <your-verified-sender@example.com>
```

### Option C — Resend (3,000 emails/month free, needs a domain)

1. Create a free account at <https://resend.com>.
2. Add and verify your domain.
3. **API Keys → Create**.
4. In Render add:

```
RESEND_API_KEY = re_...
MAIL_FROM      = StayFolk <hello@yourdomain.com>
```

Redeploy after adding variables (Render does this automatically when you save).

**No email at all?** That is fine — leave every mail variable empty. The app
detects it and stops nagging users to verify; accounts work normally.

## 4. Keep the data (read this before inviting people)

StayFolk stores everything in `server/data/`:

```
server/data/db.json      accounts, sessions, requests, messages
server/data/uploads/     profile photos
```

On Render's **free** plan that folder is **ephemeral** — it is wiped whenever the
service restarts, redeploys, or wakes from sleep. Fine for trying it out with
friends, not fine for a community you care about.

Two ways to fix it:

- **Paid instance + disk.** Uncomment the `disk:` block in `render.yaml`
  (`mountPath: /app/server/data`), which needs a paid instance type. This is the
  simplest correct answer.
- **Free Postgres elsewhere.** Create a free database at
  <https://neon.tech> and the storage layer can be swapped from JSON to Postgres.
  Ask and I will write that adapter.

Whatever you choose, back up `server/data/db.json` occasionally — it is a plain
JSON file you can download and keep.

---

## 5. After it is live — check these

1. Open the URL, sign up with a username and password (8+ characters).
2. You should land on the dashboard with a yellow **"Your email is not verified"**
   banner.
3. Open your inbox, click **Confirm email**, and the banner disappears.
4. **My profile → Change password** — set a new one, then log in again with your
   username and the new password.
5. Upload a profile photo and a cover photo.
6. Tick **I can host guests**, save, then open **Explore** — your profile appears
   in the directory.
7. Sign up a second account in a private window, send yourself a request, accept
   it, and exchange a message. That is the whole loop working between two people.

If a step fails, check **Logs** in Render — every error is printed there with a
readable message.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Verification link goes to `localhost` | `PUBLIC_URL` not set | Set it and redeploy |
| Email never arrives, no error | No mail provider configured | Add the SMTP variables, `BREVO_API_KEY` or `RESEND_API_KEY` |
| Gmail says "535 authentication failed" | Using the normal password | Use the 16-character **app password**, and 2-Step Verification must be on |
| Verification email lands in spam | Gmail sending on your behalf | Mark it "not spam"; the next ones usually arrive |
| "email failed" in the log | Sender not verified at the provider | Verify the sender, match `MAIL_FROM` exactly |
| Accounts vanish after a restart | Free plan has no persistent disk | See step 4 |
| Site sleeps after 15 minutes | Free plan behaviour | First request after that takes ~30s to wake |
| Cookie not saved | `NODE_ENV` not `production` behind HTTPS | Set `NODE_ENV=production` |
