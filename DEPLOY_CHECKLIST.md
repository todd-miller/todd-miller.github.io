# Deploy Checklist

Companion to [DEPLOY_PLAN.md](./DEPLOY_PLAN.md). Work top-to-bottom; don't skip the local checks.

## Pre-flight (both plans)
- [ ] `pnpm install` clean on a fresh clone (no lockfile drift)
- [ ] `pnpm-lock.yaml` committed and up to date
- [ ] `pnpm check` / `astro check` passes (no type or content errors)
- [ ] `pnpm build` succeeds locally with no warnings you don't recognize
- [ ] `pnpm preview` renders the built site correctly
- [ ] No secrets, `.env` files, or local-only paths committed
- [ ] `git status` clean; intended branch is `main`

## Plan 1: GitHub Pages
### Config
- [ ] Decided user-site vs project-site URL shape
- [ ] `astro.config.mjs` `site` matches the chosen URL exactly (trailing slash included)
- [ ] `base` set iff project-site; matches repo name
- [ ] Grepped for hardcoded `/` links/assets; any absolute refs use `import.meta.env.BASE_URL`
- [ ] Favicon, OG images, and fonts load under the `base` path
- [ ] `pnpm build && pnpm preview` works *with* the final `base` value

### Repo / Actions
- [ ] GitHub remote exists and `main` is pushed
- [ ] Settings → Pages → Source = "GitHub Actions"
- [ ] Workflow file present in `.github/workflows/` and valid YAML
- [ ] Manual `workflow_dispatch` run completes green
- [ ] Pages environment shows the deployment URL

### Post-deploy smoke test
- [ ] Landing page loads over HTTPS
- [ ] CSS and fonts apply (no FOUC / 404s in devtools)
- [ ] Every nav link resolves (no 404s from a missing `base`)
- [ ] Images and downloads resolve
- [ ] `/404` or unknown route behaves as expected
- [ ] Mobile viewport renders (quick devtools check)
- [ ] Lighthouse pass on the live URL (perf + no console errors)

## Plan 2: Gitea CI/CD
### Runner & secrets
- [ ] Gitea Actions enabled on the instance
- [ ] At least one runner online with a label matching `runs-on`
- [ ] Runner can reach the internet (or an actions mirror) for `setup-node` / pnpm
- [ ] Runner network can reach the deploy host (LAN/DNS resolves)
- [ ] Repo secrets set: `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`
- [ ] `DEPLOY_SSH_KEY` is the *private* key, full PEM including header/footer

### Deploy host
- [ ] Target path exists and is owned/writable by `DEPLOY_USER`
- [ ] Public key appended to `~/.ssh/authorized_keys` on the target
- [ ] (Optional) `command=`/`rrsync` restriction verified
- [ ] Web server (nginx/caddy) doc root matches `DEPLOY_PATH`
- [ ] Manual `ssh $DEPLOY_USER@$DEPLOY_HOST` from the runner succeeds (dry run)
- [ ] Manual `rsync` dry-run from runner → host succeeds

### First run
- [ ] `ci.yml` passes on push to `main`
- [ ] Artifact upload works, or step removed if Gitea artifact server isn't configured
- [ ] `cd.yml` runs and rsync completes without permission errors
- [ ] `ssh-keyscan` resolves the host (no "host key verification failed")

### Post-deploy smoke test
- [ ] Homelab URL serves the new build (check a changed string to confirm freshness)
- [ ] Assets load (CSS, JS, images) — no stale cache from the previous deploy
- [ ] All nav links resolve
- [ ] Re-run the workflow; confirm idempotent (no stale files left behind — consider `rsync --delete`)

### Hardening (optional, do after first green run)
- [ ] `cd.yml` gated on `ci.yml` success (`workflow_run` or `needs`)
- [ ] `concurrency` group set so overlapping pushes don't race
- [ ] Deploy key scoped to the single target path
- [ ] Rollback path documented (previous build retained, or git revert + re-run)
