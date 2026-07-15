# jti-ai-review

Local AI pre-commit review. Per-developer config in gitignored `.env.jti-ai-review`. Hook is **local only** — teammates are never forced to use it.

## Install (npm)

```bash
npm install -D jti-ai-review
npx ai-review init
npm install   # husky
```

### Init wizard

1. **Enable review on this machine?** `[Y/n]`
   - **N** — nothing installed; git unchanged. Run `npx ai-review init` later. If you had a prior install, hook/aliases removed and `AI_REVIEW_ENABLED=false`.
   - **Y** — continues below.

2. **Auto-review every commit?** `[y/N]`
   - **Y** → `AI_REVIEW_AUTO_RUN=true` — review runs immediately on `git commit`
   - **N** → `AI_REVIEW_AUTO_RUN=false` — each commit: **[S] skip** / **[Enter] run** (default, saves tokens)

3. **Provider / API key / model** — skippable; edit `.env.jti-ai-review` later.

Creates locally (gitignored where noted): `.husky/pre-commit`, `.env.jti-ai-review`, git aliases.

Commits to repo: `.env.jti-ai-review.example`, `.husky/pre-commit.example`, `docs/ai-review/`, `review-mapping.json`, etc.

## Install locally without npm registry (tarball)

**You do not need to uninstall** the old package. Installing a `.tgz` replaces it in place.

### 1. Build archive (package source repo)

```bash
cd /path/to/test-ai-pr-ci
npm run pack:local
# → jti-ai-review-0.1.2.tgz (version in filename)
```

### 2. Install in your consumer project

```bash
cd /path/to/your-app
npm install -D /path/to/test-ai-pr-ci/jti-ai-review-0.1.2.tgz
```

### 3. Upgrade from an older inited version

```bash
npx ai-review init --force
```

Answer the wizard again. Your existing `.env.jti-ai-review` is **merged** (API keys preserved). Local hook + `git no-review` alias refreshed.

**Optional cleanup** (old versions):

```bash
rm -f ai-review.config.json          # obsolete — settings now in .env.jti-ai-review
git config --local --unset-all alias.wip   # old alias name (init --force removes it too)
```

**Commit after upgrade** (team-shared): `.env.jti-ai-review.example`, `.husky/pre-commit.example`, `docs/ai-review/`, `.gitignore` updates.

**Do not commit**: `.env.jti-ai-review`, `.husky/pre-commit`.

### Alternative: npm link (dev only)

```bash
# package repo
cd /path/to/test-ai-pr-ci && npm run build:cli && npm link

# consumer repo
npm link jti-ai-review
```

Re-run `npm run build:cli` in source after every code change.

## Daily flow

```text
git add .
git commit -m "..."              # review (or [S] prompt if AI_REVIEW_AUTO_RUN=false)
git no-review -m "..."           # skip review this commit
```

After review: **[P] Commit anyway** | **[R] Open report** (if report saved) | **[C] Cancel**

## Per-developer env (`.env.jti-ai-review`)

```env
AI_REVIEW_ENABLED=true        # false = hook noop on this machine
AI_REVIEW_AUTO_RUN=false      # false = [S]/[Enter] each commit; true = auto every commit
AI_REVIEW_SAVE_REPORT=false   # true = write docs/reviews/*.md
AI_REVIEW_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-...
```

| Var | Default | Effect |
|-----|---------|--------|
| `AI_REVIEW_ENABLED` | `true` | `false` → hook exits 0; plain commit |
| `AI_REVIEW_AUTO_RUN` | `false` | `true` → no pre-prompt; `false` → **[S] skip / [Enter] run** |
| `AI_REVIEW_SAVE_REPORT` | `false` | `true` → save `docs/reviews/YYYY-MM-DD/HH-mm.md` |

Never touches project `.env` / `.env.example`.

## Git aliases (local, set by init)

```bash
git no-review -m "wip"           # skip AI review
git commit-report -m "feat: x"   # commit + save report file
git -c ai-review.skip=true commit -m "..."
```

## One-off overrides

```bash
AI_REVIEW_SKIP=1 git commit -m "..."
AI_REVIEW_ENABLED=false git commit -m "..."
git commit --no-verify
```

CLI: `ai-review run --skip --no-report --report`

## Providers

| Provider | Key | Notes |
|----------|-----|-------|
| anthropic | `ANTHROPIC_API_KEY` | recommended |
| openai | `OPENAI_API_KEY` | |
| cursor | `CURSOR_API_KEY` | Cloud Agents; Max Mode billing; `CURSOR_MODEL=composer-2.5` = standard tier |
| gemini | `GOOGLE_API_KEY` | |
| mock | — | no key |

## Commands

```bash
npx ai-review init [--force] [--skip-prompt]
npx ai-review run [--skip] [--no-report] [--report] [--provider <name>]
```

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## When review fails

If the hook errors (e.g. `Failed to parse review output...` — common with Cursor or API glitches):

```bash
git no-review -m "your message"    # skip review for this commit
```

Or disable review on your machine in `.env.jti-ai-review`:

```env
AI_REVIEW_ENABLED=false
```

## Team scenarios

| Situation | Result |
|-----------|--------|
| Dev A init **Y**, Dev B never inits | B: no hook, normal git |
| Dev B later init **Y** | B: own local hook + env |
| Init **N** after prior **Y** | Hook removed, aliases cleared, `AI_REVIEW_ENABLED=false` |
| `AI_REVIEW_ENABLED=false` | Hook runs, exits 0 — no review |
| `AI_REVIEW_AUTO_RUN=false` | **[S]** prompt before LLM |
| CI clone | No local hook → commits unaffected |
