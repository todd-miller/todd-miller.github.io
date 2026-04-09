# Deploy Checklist

Companion to [DEPLOY_PLAN.md](./DEPLOY_PLAN.md). Flow: Gitea CI gates → Gitea fast-forward mirrors `main` to GitHub → GitHub Pages deploys on push.

## Pre-flight
- [ ] `pnpm install` clean on a fresh clone (no lockfile drift)
- [ ] `pnpm-lock.yaml` committed and up to date
- [ ] `astro check` passes
- [ ] `pnpm build` succeeds locally, no unfamiliar warnings
- [ ] `pnpm preview` renders the built site correctly
- [ ] No secrets, `.env` files, or local-only paths committed
- [ ] `git status` clean; working branch is `main`
- [ ] URL shape decided (user-site vs project-site); `astro.config.mjs` `site`/`base` match
- [ ] Grepped for hardcoded `/` links/assets; absolute refs use `import.meta.env.BASE_URL` if `base` is set
- [ ] `pnpm build && pnpm preview` works *with* the final `base`

## Plan 1: Gitea CI + mirror
### Runner
- [ ] Gitea Actions enabled
- [ ] Containerized runner online with a label matching `runs-on`
- [ ] Runner has HTTPS egress to `github.com` (verify with a one-off job if unsure)
- [ ] Runner can pull `actions/*` (mirror / `ACTIONS_CACHE_URL` configured if needed)

### CI (`ci.yml`)
- [ ] Installs, runs `astro check`, runs `pnpm build`
- [ ] `actions/upload-artifact@v3` step removed (GitHub rebuilds; artifact unused)
- [ ] Runs on `push` to `main` and `pull_request` to `main`
- [ ] First run is green on Gitea

### Mirror (`cd.yml`)
- [ ] Triggers only after `ci.yml` succeeds on `main` (`workflow_run` or consolidated `needs:`)
- [ ] Gitea repo secrets set: `GITHUB_PUSH_TOKEN` (fine-grained PAT, `contents:write` only), `GITHUB_REPO`
- [ ] PAT scoped to the single GitHub repo; expiry date noted somewhere durable
- [ ] Checkout uses `fetch-depth: 0`
- [ ] Remote added via `https://x-access-token:${TOKEN}@github.com/${REPO}.git` (no key committed)
- [ ] Push is `git push github main:main` — **no `--force`**
- [ ] GitHub `main` seeded once manually so the remote branch exists
- [ ] First mirrored push lands a commit on GitHub with matching SHA

## Plan 2: GitHub Pages
### Repo setup
- [ ] GitHub remote exists; `main` seeded
- [ ] Settings → Pages → Source = "GitHub Actions"
- [ ] `.github/workflows/cd.yml` triggers include `push: branches: [main]` (plus existing `workflow_dispatch`)

### First end-to-end run
- [ ] `git push gitea main` → Gitea CI green → mirror pushes → GitHub Pages workflow fires
- [ ] Pages workflow green
- [ ] Pages environment shows the deployment URL
- [ ] GitHub `main` SHA matches Gitea `main` SHA

### Post-deploy smoke test
- [ ] Landing page loads over HTTPS
- [ ] CSS and fonts apply (no FOUC / 404s in devtools)
- [ ] Every nav link resolves (no 404s from a missing `base`)
- [ ] Images and downloads resolve
- [ ] Favicon + OG images load
- [ ] `/404` behaves as expected
- [ ] Mobile viewport renders
- [ ] Lighthouse pass on the live URL (no console errors)

### Hardening (after first green run)
- [ ] `concurrency: pages` still set in `.github/workflows/cd.yml`
- [ ] Rollback rehearsed: `git revert` on Gitea → push → mirrors → Pages redeploys
- [ ] PAT rotation reminder on the calendar
- [ ] Discipline: never push directly to GitHub; treat it as read-only downstream
- [ ] (If a blocking GitHub-only check ever becomes necessary) revisit DEPLOY_PLAN.md and graduate to PR-based promotion
