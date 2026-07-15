# AI Pre-Commit Review

Local review runs on **staged changes** before each `git commit`.

## Quick start

1. `npm install -D jti-ai-review && npx ai-review init`
   - **Y/N** — enable review on this machine?
   - If **Y** — auto every commit, or **[S]/[Enter]** prompt each time?
   - Provider/key/model (skippable)
2. Edit `.env.jti-ai-review` — `AI_REVIEW_ENABLED`, `AI_REVIEW_AUTO_RUN`, `AI_REVIEW_SAVE_REPORT`, API keys
3. Stage: `git add <files>`
4. Commit: `git commit -m "..."` or `git no-review -m "..."` to skip review
5. Choose: **[S] Skip** (before LLM) | **[P] Commit anyway** | **[C] Cancel**

Provider: `cursor` | `openai` | `codex` | `anthropic`/`claude` | `gemini`/`google` | `mock`

`.env.jti-ai-review` (gitignored) — set `AI_REVIEW_PROVIDER` and the matching key:

| Provider | Env key | Default model |
|----------|---------|---------------|
| cursor | `CURSOR_API_KEY` | composer-2.5 (standard) |
| openai | `OPENAI_API_KEY` | gpt-4o-mini |
| codex | `OPENAI_API_KEY` | gpt-4.1 |
| claude | `ANTHROPIC_API_KEY` | claude-sonnet-4-20250514 |
| gemini | `GOOGLE_API_KEY` | gemini-2.0-flash |

**Cursor billing:** uses Cloud Agents API → always **Max Mode** (cannot disable). `composer-2.5` here defaults to **standard** (cheaper). Use `composer-2.5-fast` or `CURSOR_MODEL_FAST=true` for Fast. Prefer **anthropic**/**openai** for cheaper reviews.

Cursor key: Dashboard → Integrations → API Keys (`cursor_...`).

Without a key, falls back to `mock` provider.

## What gets reviewed

Only the **staged diff** plus:

| Input | Source |
|-------|--------|
| Project rules | `docs/project-rules/` (always) |
| Feature docs | Mapped via `review-mapping.json` |
| Previous report | Latest file in `docs/reviews/YYYY-MM-DD/` |
| Metadata | `package.json` |

The reviewer does **not** see your full repo or IDE chat history.

## Repo layout

```text
.env.jti-ai-review.example  # committed template (safe to commit)
.env.jti-ai-review          # your API keys (gitignored)
review-mapping.json         # which files → which docs
.env.jti-ai-review             # per-dev: enabled, keys (gitignored)
docs/
  ai-review/                # this guide + agent instructions
  project-rules/            # coding standards, review criteria
  <feature>/                # feature specs (e.g. auth/, payments/)
  reviews/                  # local reports, gitignored, grouped by day
.husky/pre-commit.example   # committed template
.husky/pre-commit           # local only (gitignored) — created on init Y
```

## Configuration

Per-developer settings live in `.env.jti-ai-review` (gitignored). Init never touches project `.env`.

```env
AI_REVIEW_ENABLED=true       # false = hook no-op on this machine
AI_REVIEW_AUTO_RUN=false     # false = [S]/[Enter] prompt; true = auto-review every commit
AI_REVIEW_SAVE_REPORT=false  # true = write docs/reviews/*.md
AI_REVIEW_PROVIDER=anthropic
```

| Var | Default | Meaning |
|-----|---------|---------|
| `AI_REVIEW_ENABLED` | `true` | `false` = hook exits; `git commit` and `git no-review` both normal |
| `AI_REVIEW_AUTO_RUN` | `false` | `true` = review runs immediately; `false` = ask: **[S] skip** / **[Enter] run** |
| `AI_REVIEW_SAVE_REPORT` | `false` | `true` = save report markdown files |

Terminal issues always print when review runs. Report files optional.

## For AI coding agents

Read before changing mapped code or docs:

1. [AGENT-INSTRUCTIONS.md](./AGENT-INSTRUCTIONS.md) — required workflow
2. [MAPPING.md](./MAPPING.md) — how to edit `review-mapping.json`
3. [FEATURE-DOC-TEMPLATE.md](./FEATURE-DOC-TEMPLATE.md) — how to write feature docs

**Before commit:** run `/jti-review` — context sync only, not code review.

## Severity scale

`low` | `medium` | `high` | `critical`

Severity guides priority in the report. **Commits are never auto-blocked** — the developer always chooses.

## Bypass / toggles

One-off:

```bash
git no-review -m "fix: wip"                       # alias: skip review
git commit-report -m "feat: x"                   # alias: save report
git -c ai-review.skip=true commit -m "..."       # shorthand -c
```

Init registers `git no-review` and `git commit-report` in local `.git/config`.

Set `AI_REVIEW_ENABLED=false` in `.env.jti-ai-review` to disable the hook on your machine.

Pre-review: **S** skips LLM (only when `AI_REVIEW_AUTO_RUN=false`). `git commit --no-verify` skips hook entirely.

## When review fails (provider / JSON errors)

If the hook prints something like `Failed to parse review output: Unexpected token 'C'...`, the LLM returned non-JSON (common with Cursor or network glitches). Your commit is **not** blocked automatically — the hook exits with an error, but you can proceed:

```bash
git no-review -m "your message"    # one commit, skip review
```

Or disable review on this machine in `.env.jti-ai-review`:

```env
AI_REVIEW_ENABLED=false
```

Then `git commit` runs normally without calling the reviewer.

## Upgrade from an older version

```bash
npm update jti-ai-review
npx ai-review init --force
```

Init re-runs Y/N + auto-run prompts, merges `.env.jti-ai-review` (keeps your keys), refreshes local hook + git aliases.

**Cleanup from older setuPps (if present):**

| Remove / ignore | Why |
|-----------------|-----|
| `ai-review.config.json` | Replaced by `.env.jti-ai-review` |
| `git wip` alias | Renamed to `git no-review` |
| Committed `.husky/pre-commit` | Now gitignored; use `.husky/pre-commit.example` + local hook |

**Commit to repo after upgrade:** `.env.jti-ai-review.example`, `.husky/pre-commit.example`, updated `docs/ai-review/`, `.gitignore` patch.

**Keep local (gitignored):** `.env.jti-ai-review`, `.husky/pre-commit`.
