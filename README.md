# jti-ai-review

Local AI pre-commit review. Per-developer config in gitignored `.env.jti-ai-review`. Hook is **local only** — teammates are never forced to use it.

## Install

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

Init creates on your machine (gitignored): `.husky/pre-commit`, `.env.jti-ai-review`, git aliases.

Init scaffolds into the repo (commit these): `.env.jti-ai-review.example`, `.husky/pre-commit.example`, `docs/ai-review/`, `review-mapping.json`, etc.

## Upgrade

```bash
npm update jti-ai-review
npx ai-review init --force
```

Your existing `.env.jti-ai-review` is merged (API keys preserved). Local hook and `git no-review` alias are refreshed.

If upgrading from an older setup, remove obsolete `ai-review.config.json` if present — settings now live in `.env.jti-ai-review`.

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
| cursor | `CURSOR_API_KEY` | Cloud Agents; less reliable JSON output |
| gemini | `GOOGLE_API_KEY` | |
| mock | — | no key |

## Commands

```bash
npx ai-review init [--force]
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
