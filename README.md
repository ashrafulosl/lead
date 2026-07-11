# 90-Day Tracker — Supabase Edition

Static HTML/CSS/vanilla JS app with Supabase as the backend (auth + database).
No build step, no framework — deployable as-is on GitHub Pages.

## File structure

```
index.html              Auth screen + app shell
css/style.css            All styles (light theme, mobile-first)
js/config.js              Supabase credentials + your plan content (edit this)
js/supabaseClient.js      Creates the Supabase client
js/auth.js                Sign up / sign in / sign out, auth screen UI
js/data.js                All database reads/writes
js/app.js                 Renders the 4 views (Today / Week / Progress / More)
js/main.js                Entry point, wires auth state to the app
sql/schema.sql            Tables + Row Level Security policies
```

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Wait for it to finish provisioning (~2 min).

## 2. Run the database schema

1. In your Supabase project, open **SQL Editor → New query**.
2. Paste the entire contents of `sql/schema.sql`.
3. Click **Run**.

This creates two tables (`day_records`, `appearance_checks`), enables Row
Level Security on both, and adds policies so a user can only ever read or
write rows where `user_id` matches their own logged-in ID. There is no way
for one user to see another user's data, even via the API, because the
policies are enforced by Postgres itself — not by app code.

## 3. Configure auth

By default Supabase requires email confirmation before a new account can
log in. Two options:

- **Simplest for personal use:** Authentication → Providers → Email →
  turn **off** "Confirm email". New accounts can sign in immediately.
- **More secure / multi-user:** leave confirmation on. `auth.js` already
  handles this case — it tells the user to check their inbox after signup.

## 4. Connect the frontend

1. In Supabase: **Project Settings → API**.
2. Copy the **Project URL** and the **anon public key**.
3. Open `js/config.js` and paste them in:

```js
export const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

The anon key is meant to be public/exposed in frontend code — it has no
special privileges on its own. Row Level Security (step 2) is what
actually protects each user's data, not keeping this key secret.

## 5. Test locally

Because this uses ES modules (`type="module"`), opening `index.html`
directly via `file://` won't work in most browsers. Serve it locally instead:

```bash
# any static server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

## 6. Deploy to GitHub Pages

1. Push this whole folder to a GitHub repository (keep `index.html` at the
   repo root — GitHub Pages serves it automatically from there).
2. In the repo: **Settings → Pages → Build and deployment → Deploy from a
   branch** → select `main` and `/ (root)` → Save.
3. Your app will be live at `https://yourusername.github.io/reponame/`
   within a minute or two.

No further backend setup is needed — Supabase is fully hosted, and GitHub
Pages only serves static files.

## Editing the plan

All routine/nutrition/appearance/mental-board content lives in the `PLAN`
object in `js/config.js`. It's the same for every user (not stored in the
database) — edit it there and redeploy (push to GitHub) to change it.

## What's stored where

| Data | Stored in |
|---|---|
| Login credentials | Supabase Auth (built-in, not a custom table) |
| Daily workout checkboxes, nutrition checkboxes, day note, day level (0–3) | `day_records` table |
| Grooming/presence/clothing checklist | `appearance_checks` table |
| The routine itself (exercises, sets/reps, milestones, mental board) | `js/config.js` (static, not per-user) |

## Notes on scope

This intentionally does not include: offline support/service workers,
password reset flow, social login, or an admin panel. If you want any of
those later, they're additive — the schema and structure here won't need
to change.
