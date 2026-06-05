# Pro-Tasker

A full-stack MERN project-management app. Users register, log in, and manage
their own projects and the tasks nested inside them. Every API route is
owner-protected: you only ever see or change your own data.

Stack: MongoDB + Mongoose  · Express  · React 18 (Vite, JS) ·
React Router  · JWT auth · bcryptjs · axios.

---

## Table of contents
1. [Challenges encountered & how they were fixed](#challenges-encountered--how-they-were-fixed)
2. [Project structure](#project-structure)
3. [Local setup](#local-setup)
4. [Environment variables](#environment-variables)
5. [API reference](#api-reference)
6. [Running the smoke test](#running-the-smoke-test)
7. [Deployment (Render + Atlas)](#deployment-render--atlas)
8. [Design system & the smooth theme slider](#design-system--the-smooth-theme-slider)
9. [Add-ons: dates, workload tracker, Slack](#add-ons-dates-workload-tracker-slack)
10. [Accessibility](#accessibility)
11. [How the frontend is wired](#how-the-frontend-is-wired)

---

## Challenges encountered & how they were fixed

Each entry is **symptom - root cause  fix - where the fix lives.**

### 1. Registration returned 500 — `TypeError: next is not a function`
- **Cause:** the pre-save hook was callback-style, `pre('save', async function (next) {…next()})`. Modern Mongoose treats an **async** hook as promise-based and passes no `next`, so `next()` called `undefined`.
- **Fix:** drop `next`; let async/await drive it.
- **Where:** `backend/models/User.js`

### 2. "Open project" gave a server error / "Delete project" failed
- **Causes:** the original controllers swallowed exceptions with a bare 500 and **no logging** (the real mistake — you can't fix what you can't see); a malformed/legacy id hitting `findById` throws a `CastError` that surfaced as an opaque 500; and `document.deleteOne()` behaves inconsistently across Mongoose versions.
- **Fixes:** `console.error` in every catch; `CastError → 404`; model-level `Project.deleteOne({_id})`; empty-string guards on updates.
- **Where:** `backend/controllers/projectController.js`, `taskController.js`, `userController.js`

### 3. JWT signing can fail if the secret is missing
- **Cause:** `jwt.sign` needs `process.env.JWT_SECRET`.
- **Fix:** set `JWT_SECRET` in `backend/.env`; keep `require('dotenv').config()` as the first line of `server.js`.

### 4. Light→dark theme snapped at the midpoint instead of blending
- **Symptom:** dragging the theme control produced a hard switch at 50%, not a continuous white→black blend.
- **Root cause:** the theme was a discrete value (a string / a snap-at-50 toggle), so there was no in-between state to render.
- **Fix — a single `--mode` percentage driving `color-mix()`:** `mode` is now a number `0–100` written to `<html>` as `--mode`, and **every** color token is computed as `color-mix(in srgb, <light>, <dark> var(--mode))`. Dragging the slider updates `--mode` in 1% steps, so all tokens re-blend together and the whole UI glides smoothly from white to near-black.
  ```css
  :root { --mode: 0%; }
  --bg:      color-mix(in srgb, var(--bg-l),      var(--bg-d)      var(--mode));
  --surface: color-mix(in srgb, var(--surface-l), var(--surface-d) var(--mode));
  --text:    color-mix(in srgb, var(--text-l),    var(--text-d)    var(--mode));
  ```
- **Where:** `--mode` is set in `frontend/src/context/ThemeContext.jsx`; the tokens live at the top of `frontend/src/styles.css`. (Ported from your IP-tracker, TypeScript → plain JS, since Pro-Tasker isn't TypeScript.)

### 5. The site wasn't responsive
- **Fix:** fluid type via `clamp()`, a `repeat(auto-fill, minmax(min(100%,250px),1fr))` grid that collapses to one column, a navbar that stacks, full-width inputs, and a theme popover capped at `min(260px,86vw)` so it never overflows. Breakpoints at 640px and 420px.
- **Where:** `frontend/src/styles.css`

### 6. Deployed backend returned 502 — "Could not connect to any servers in your MongoDB Atlas cluster"
- **Symptom:** the live backend showed **502 Bad Gateway**; its logs printed `Server running on port 10000` followed by a MongoDB connection error mentioning an IP that "isn't whitelisted."
- **Root cause:** MongoDB Atlas only accepts connections from whitelisted IPs, and the Render service's IP wasn't allowed. Render's free tier doesn't give a service a fixed outbound IP, so a single-IP rule won't do.
- **Fix:** Atlas → **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`). Once it's **Active**, redeploy the backend; it connects to the database and stays up (the 502 disappears). Data stays protected by the database username/password.
- **Where:** MongoDB Atlas dashboard (no code change).

### 7. CORS blocked the deployed frontend — `Access-Control-Allow-Origin` was `http://localhost:5173`
- **Symptom:** register/login on the live site failed with *"blocked by CORS policy: … 'http://localhost:5173' … is not equal to the supplied origin."*
- **Root cause (traced from the data, not guessed):** the `cors` package copies whatever `origin` value it's given into the `Access-Control-Allow-Origin` header. The backend was configured with `cors({ origin: process.env.CLIENT_URL || '*' })`. The browser saw the header value `http://localhost:5173` (not `*`), which proves `process.env.CLIENT_URL` was literally `http://localhost:5173` on the running server — a stale value pinned to a single env variable, which rejected the deployed frontend's real origin.
- **Fix:** replaced the single-origin config with a **dynamic allow-list** in `server.js`. The deployed frontend URL is hardcoded in the list (so it's always permitted regardless of env drift), and any `CLIENT_URL` env var is still added to the list if set. This removed the dependency on one environment variable being perfect.
  ```js
  const allowedOrigins = [
    'http://localhost:5173',
    'https://pro-tasker-2.onrender.com',
  ];
  if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) return callback(new Error('Not allowed by CORS'), false);
      return callback(null, true);
    },
    credentials: true,
  };
  app.use(cors(corsOptions));
  ```
- **Where:** `backend/server.js`. A key lesson: an environment-variable change on Render only takes effect after the service **redeploys**, and it must be set on the **backend** service (not the static site) — verify the deploy used your newest commit in the **Events** tab.

---



## Local setup
```bash
# backend
cd backend && npm install && cp .env.example .env   # fill in values
npm run dev                                          # http://localhost:5000

# frontend (second terminal)
cd frontend && npm install && cp .env.example .env   # VITE_API_URL=http://localhost:5000
npm run dev                                          # http://localhost:5173
```

---

## Environment variables

**backend/.env**
```
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long random string>
CLIENT_URL=http://localhost:5173
SLACK_WEBHOOK_URL=        # optional, see Add-ons; leave blank to disable
```
> On Render, do **not** set `PORT`. Set `CLIENT_URL` to your deployed frontend URL for CORS.
> `SLACK_WEBHOOK_URL` requires Node 18+ (built-in `fetch`).

**frontend/.env**
```
VITE_API_URL=http://localhost:5000     # in prod: backend URL, no trailing slash, no /api
```

---

## API reference
All `/api/projects` and `/api/tasks` routes require `Authorization: Bearer <token>`.
Codes: **401** no/!valid token · **403** not owner · **404** missing/bad id · **400** validation.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/users/register` | Create account → `{ _id, username, email, token }` |
| POST | `/api/users/login` | Log in → same shape |
| GET / POST | `/api/projects` | List / create the user's projects |
| GET / PUT / DELETE | `/api/projects/:id` | Read / update / delete one owned project (delete cascades its tasks) |
| GET / POST | `/api/projects/:projectId/tasks` | List / create tasks in an owned project |
| PUT / DELETE | `/api/tasks/:taskId` | Update / delete a task (must own parent project) |

**Task fields:** `title` (required), `description`, `status` (`To Do`/`In Progress`/`Done`),
plus optional `dueDate` (ISO date-time) and `estimateMinutes` (number).



## Deployment (Render + Atlas)

**Atlas:** free M0 cluster · DB user with read+write · **Network Access `0.0.0.0/0`** (required so Render can reach the DB — see Challenge 6) · copy the URI into `MONGO_URI`.

**Backend (Render → Web Service):** Root Directory `backend` (set first) · Language **Node** · Build `npm install` · Start `npm start` · env `MONGO_URI`, `JWT_SECRET` (not `PORT`). Free tier sleeps after ~15 min idle (first hit 30–60 s).

**Frontend (Render → Static Site):** Root Directory `frontend` · Build `npm install && npm run build` · Publish `dist` · env `VITE_API_URL` = backend URL (no trailing slash/`/api`) · add SPA rewrite (Redirects/Rewrites): `/*` → `/index.html`, Action **Rewrite**.

**CORS:** the deployed frontend URL is allow-listed directly in `backend/server.js` (see Challenge 7), so cross-origin requests work without depending on a single env var. If you move the frontend to a new URL, add it to the `allowedOrigins` array and redeploy.

**Two gotchas that cost real time here (both in Challenges 6 & 7):**
- A backend **502** almost always means the server started but **couldn't reach MongoDB** — open the Render logs; if it mentions a non-whitelisted IP, set Atlas Network Access to `0.0.0.0/0`.
- A Render **environment-variable or code change only takes effect after the service redeploys** — use **Manual Deploy → Deploy latest commit** and confirm the **Events** tab shows your newest commit going **Live** before testing.

---

## Design system & the smooth theme slider

The look is **prominent glassmorphism** — frosted, translucent surfaces
(`backdrop-filter: blur(24px) saturate(150%)`) with a soft inner highlight, floating
over an immersive aurora-gradient background that shows through the frost. Minimalist
layout, neumorphic accents, an indigo→violet accent used sparingly.

**Three continuous gradient sliders** (upper-right "Display" popover), persisted to
`localStorage` so the choice follows you across every page:
- **Theme** `0–100` — smooth white→near-black blend via `color-mix(--mode)` (the fix above). The dark endpoint is deliberately near-black.
- **Invert** `0–100` — color inversion (`filter: invert() hue-rotate(180deg)`) on the app shell, for accessibility / dark-on-light needs.
- **Night** `0–100` — a warm amber overlay that reduces blue light; it sits *outside* the inverted shell so it stays warm even with Invert on.

Status pills use solid fills (slate / amber / green) so they stay readable at any point on the white→black slide.

---

## Add-ons: dates, workload tracker, Slack

**Optional date & time per task.** On the task form, click **"Add date & time"** to
reveal a `datetime-local` picker and a minutes-estimate field. Both are optional;
tasks created without them behave exactly as before. Stored as `dueDate` and
`estimateMinutes` on the task.

**Context-aware workload tracker (Sunsama-inspired).** Above the task list, a gauge
sums the time estimates of all *not-done* tasks. It fills green→indigo up to 8 hours
and turns amber→red with a warning past 8 hours ("consider moving some tasks to
another day"). It stays hidden until at least one task has an estimate.
*(Linear's merge-driven auto-close and Height's instant view-switching are great
patterns too, but they need git integration / a multi-view data layer — bigger lifts
than this MVP; the workload gauge is the highest-value piece to ship now.)*

**Slack notifications (Level 1 incoming webhook).** If `SLACK_WEBHOOK_URL` is set, the
backend pings your channel when a task is **created** or **completed** — fire-and-forget,
so it never blocks or fails a request. The POST happens **server-side** on purpose:
Slack's webhook endpoint doesn't send CORS headers, so posting from the browser would
be blocked. Setup:
1. Create an app at https://api.slack.com/apps
2. Toggle **Incoming Webhooks** on
3. **Add New Webhook to Workspace**, pick a channel
4. Copy the URL into `SLACK_WEBHOOK_URL` in `backend/.env` and restart
- **Where:** `notifySlack()` in `backend/controllers/taskController.js`

---

## Accessibility
- Semantic `<header>`/`<nav aria-label>`/`<main>`; every input has an `aria-label`; errors use `role="alert"`.
- Visible `:focus-visible` outline on all interactive elements; sliders are labeled with `aria-label`.
- Status conveyed by text + color, not color alone.
- Respects `prefers-reduced-motion` (disables drift + transitions).
- The **Invert** slider provides a dark-on-light / high-contrast accessibility path.

## Challenges
1. Registration crashed with a 500, and the stack trace pointed inside Mongoose.
The error was TypeError: next is not a function in my User model's password-hashing hook. The cause was a framework detail: I'd written the pre-save hook as async function(next) and called next() at the end — but modern Mongoose treats an async hook as promise-based and doesn't pass a next callback, so I was calling undefined. I fixed it by dropping next entirely and letting the async function resolve; Mongoose awaits it and rejects the save automatically if hashing throws.
Lesson: read the stack trace to the exact line, and know that "async" changes a library's contract.
2. "Open" and "Delete" returned 500s with no clue why.
My first controllers caught errors but returned a bare 500 with no logging — so the real cause was invisible to me. I rebuilt them to console.error every failure, map an invalid Mongo id (CastError) to a clean 404 instead of a 500, and delete with the version-proof Model.deleteOne({ _id }). I also wrote a smoke-test.mjs that hits every endpoint and prints pass/fail, so I catch a break before the UI does.
Lesson: you can't fix what you can't see — log failures and test the API directly, not just through the screen.

3. Deployment was a different kind of hard than coding.
Two production-only bugs. First, the live backend threw a 502; the Render logs showed a MongoDB error about a non-whitelisted IP — Atlas was blocking Render's server, which I fixed with Network Access 0.0.0.0/0. Second, the browser blocked every request with a CORS error showing Access-Control-Allow-Origin: http://localhost:5173. I traced that: the cors package echoes whatever origin you give it, and the header showed localhost instead of *, which proved my CLIENT_URL env var was stale on the running server. I replaced the single-origin config with a dynamic allow-list so the deployed frontend is always permitted, independent of any one env var.
Lesson: production failures are usually configuration, not code — and an env-var change only takes effect after the service redeploys.

## Author
- Kwadwo Danso

## Acknowledgement
- Per Scholas Web Development modules
- AI 