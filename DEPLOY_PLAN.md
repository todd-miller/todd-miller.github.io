# Deployment Plan

## Plan 1: Deploy to GitHub Pages

**Goal:** get the site live on GitHub Pages via manual `workflow_dispatch`.

1. **Decide the URL shape.** Two options:
   - User/org site (`<user>.github.io`) → `site: "https://<user>.github.io/"`, no `base`.
   - Project site (`<user>.github.io/mysite`) → `site: "https://<user>.github.io"`, `base: "/mysite"`.
2. **Update `astro.config.mjs`** with the chosen `site` (and `base` if needed). Any absolute links/assets in components should use `import.meta.env.BASE_URL` if you picked a project site.
3. **Push to GitHub.** Confirm the non-origin remote exists (`git remote -v`); add one if not (`git remote add github …`). Push `main`.
4. **Enable Pages** in the GitHub repo: Settings → Pages → Source = "GitHub Actions".
5. **Trigger the workflow** manually: Actions tab → "Deploy to GitHub Pages" → Run workflow.
6. **Verify** the deployment URL resolves, styles load, and internal links work (the `base` path is the common failure mode).
7. **Smoke-test locally first** if you want to de-risk step 6: `pnpm build && pnpm preview` after setting `base`.

### Risks / gotchas
- If `base` is set, hardcoded `/foo` links break — they need to be `${import.meta.env.BASE_URL}foo`.
- The workflow uses `pnpm-lock.yaml` with `--frozen-lockfile`; make sure it's committed.

---

## Plan 2: Validate Gitea CI/CD

**Goal:** confirm the Gitea workflows build and deploy to the homelab target.

1. **Confirm Gitea Actions is enabled** on your instance and at least one runner is registered with a label matching `ubuntu-latest` (or change `runs-on` in both files to match your runner's label, e.g. `self-hosted`).
2. **Pick the deploy target.** Decide which homelab host + path serves the static files (e.g. an nginx/caddy doc root). Note the user, host, and absolute path.
3. **Generate a deploy SSH key.** `ssh-keygen -t ed25519 -f ~/.ssh/mysite_deploy -N ""`. Append the `.pub` to `~/.ssh/authorized_keys` on the target host (ideally restricted to the deploy path via `command=`/`rrsync`).
4. **Add Gitea repo secrets:** `DEPLOY_SSH_KEY` (private key contents), `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`.
5. **Push to the Gitea remote.** Add it if missing (`git remote add gitea …`). First push should trigger `ci.yml` and `cd.yml` on `main`.
6. **Watch the first run.** Expected failure modes to check:
   - Runner can't pull Node/pnpm actions → runner may need internet or an actions proxy/mirror (Gitea-specific; `ACTIONS_CACHE_URL` etc.).
   - `actions/upload-artifact@v3` may need Gitea's artifact server configured; if not, drop that step from `ci.yml`.
   - `ssh-keyscan` fails → host unreachable from runner network.
   - rsync permission denied → authorized_keys or path ownership issue on target.
7. **Verify the site** is served from the homelab host after the run succeeds.
8. **Optional hardening:**
   - Restrict `cd.yml` to only run after `ci.yml` passes (use `workflow_run` or merge into one workflow with job `needs`).
   - Add a `concurrency` group so overlapping pushes don't race the rsync.

### Open questions to resolve before starting Plan 2
- Is the homelab target a VM/container with SSH, or something else (e.g. direct path on the Gitea host)? If it's the same host as the Gitea runner, you can skip SSH entirely and just `cp -r`.
- Is the Gitea runner containerized (docker) or host-mode? Containerized runners often can't reach homelab LAN hosts without extra network config.
