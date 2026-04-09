# Deployment Plan

**Flow:** push to Gitea (origin) → Gitea runs CI → on green, Gitea fast-forward mirrors `main` to GitHub → GitHub Pages workflow deploys on push.

Gitea is the source of truth and the gate. GitHub is a publish target; its only job is building with the Pages base and running `deploy-pages`. Same commit SHA on both remotes, linear history, no PRs.

```
dev → git push gitea main
         │
         ▼
   Gitea CI (ci.yml)
   • install, astro check, build
         │ pass
         ▼
   Gitea mirror job (cd.yml)
   • git push github main:main  (fast-forward only)
         │
         ▼
   GitHub Pages workflow (.github/workflows/cd.yml)
   • triggers on push to main
   • build with Pages base → deploy-pages
```

Graduate to a PR-based promotion flow later if you ever want GitHub-only checks (Lighthouse budget, link check, visual diff) to *block* publish. Until then, the mirror is simpler and faster.

---

## Plan 1: Gitea CI + mirror to GitHub

**Goal:** green Gitea build = commit on GitHub `main`.

1. **Confirm Gitea Actions + runner.** Containerized runner online with a label matching `runs-on`. Adjust `runs-on` in `.gitea/workflows/*.yml` if your runner label isn't `ubuntu-latest`.
2. **Make `ci.yml` the real gate.** Install → `astro check` → `pnpm build`. Drop `actions/upload-artifact@v3` unless Gitea's artifact server is configured — GitHub rebuilds from source, the artifact is dead weight.
3. **Rewrite `cd.yml` as a mirror job.** Trigger: `workflow_run` after `ci.yml` succeeds on `main` (or consolidate into one workflow with `needs:`). Steps:
   - Checkout with `fetch-depth: 0` (need real history, not a shallow clone, for a fast-forward push).
   - Add GitHub as a remote using `https://x-access-token:${GITHUB_PUSH_TOKEN}@github.com/${GITHUB_REPO}.git`.
   - `git push github main:main` — **no `--force`**. If it ever rejects, that's a signal something diverged and you want to know, not paper over.
4. **Gitea repo secrets:**
   - `GITHUB_PUSH_TOKEN` — fine-grained PAT scoped to the one GitHub repo, `contents:write` only.
   - `GITHUB_REPO` — e.g. `toddmiller/mysite`.
5. **Runner network check.** Containerized runner must reach `github.com` over HTTPS. Homelab runners on isolated LANs need egress or a proxy.
6. **Seed GitHub.** One-time: `git push github main` manually so the remote branch exists and Pages has something to point at.
7. **First real push.** `git push gitea main`. Watch `ci.yml` → `cd.yml` → commit appears on GitHub → Pages workflow fires.

### Risks / gotchas
- Containerized Gitea runners often can't pull `actions/*` without mirror/cache config — fix at the runner, not in YAML.
- A non-fast-forward rejection means Gitea and GitHub diverged. Investigate (did someone push to GitHub directly?) rather than force-pushing.
- PAT expiry silently breaks mirroring. Use a long-lived fine-grained token and note the expiry.
- Don't push directly to GitHub. Treat it as read-only downstream; all commits originate on Gitea.

---

## Plan 2: GitHub Pages deploy

**Goal:** every push to GitHub `main` (i.e. every mirrored commit) builds and deploys Pages.

1. **Decide URL shape:**
   - [x] User/org site (`<user>.github.io`) → `site: "https://<user>.github.io/"`, no `base`.
   - Project site → `site + base: "/mysite"`.
2. **Update `astro.config.mjs`** with the chosen `site` (and `base` if project site). Hardcoded absolute links/assets must use `import.meta.env.BASE_URL`.
3. **Update `.github/workflows/cd.yml` triggers:** add `push: branches: [main]` alongside the existing `workflow_dispatch`. Keep dispatch for manual re-deploys.
4. **Enable Pages:** Settings → Pages → Source = "GitHub Actions".
5. **Smoke-test locally:** `pnpm build && pnpm preview` with the final `base`.
6. **Merge path:** there is none — the mirrored push *is* the release.

### Risks / gotchas
- If `base` is set, hardcoded `/foo` links break.
- `pnpm-lock.yaml` must be committed (`--frozen-lockfile`).
- Any "GitHub-only check" you add here runs *post-publish* and can only alert, not block. If that's not acceptable for a given check, that's the signal to switch to the PR-based promotion flow.

---

## Resolved context
- Homelab rsync deploy (original Plan 2) is dropped.
- Containerized Gitea runner confirmed — egress to `github.com` is the critical network requirement.
- No promotion PR, no auto-merge config. Mirror only. Revisit if a blocking GitHub-only check becomes necessary.
