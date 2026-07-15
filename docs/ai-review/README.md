# AI Pre-Commit Review

Local review runs on **staged changes** before each `git commit`.

## Quick start

1. Set API key: `npm run ai-review:init` (prompts) or copy `.env.jti-ai-review.example` → `.env.jti-ai-review`
2. Stage changes: `git add <files>`
3. Commit: `git commit -m "message"`
4. Review runs automatically (Husky pre-commit hook)
5. Choose: **[S] Skip** (before review) or after review: **[P] Commit anyway** | **[R] Open report** | **[C] Cancel**

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
ai-review.config.json       # enabled, saveReport (default: reports off)
docs/
  ai-review/                # this guide + agent instructions
  project-rules/            # coding standards, review criteria
  <feature>/                # feature specs (e.g. auth/, payments/)
  reviews/                  # local reports, gitignored, grouped by day
.husky/pre-commit           # runs ai-review
```

## Configuration

jti-ai-review keeps its config in a **dedicated env file** — like Sentry's separate config. `ai-review init` never modifies your project's `.env` or `.env.example`.

| File | Committed? | Purpose |
|------|------------|---------|
| `.env.jti-ai-review.example` | Yes | Template (no secrets) |
| `.env.jti-ai-review` | No | API keys + provider (gitignored) |
| `.env.jti-ai-review.local` | No | Optional overrides (gitignored) |

Only `.env.jti-ai-review` is gitignored — **not** the `.example` file. Init adds both to your project; `ai-review init` patches `.gitignore` automatically.

Re-run `npm run ai-review:init -- --force` to change provider/model. Existing keys in `.env.jti-ai-review` are preserved unless you enter new values.

Load order at review time (later wins): `.env` → `.env.local` → `.env.jti-ai-review` → `.env.jti-ai-review.local`.

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

`ai-review.config.json` (repo root):

```json
{
  "enabled": true,
  "saveReport": false
}
```

- `enabled: false` — hook no-op
- `saveReport: false` — default; terminal issues still print, no `docs/reviews/*.md`

One-off (no extra prompts):

```bash
git wip -m "fix: wip"                              # alias: skip review
git commit-report -m "feat: x"                    # alias: save report file
git -c ai-review.skip=true commit -m "..."        # shorthand -c
git -c ai-review.no-review=true commit -m "..."   # same as skip
```

Init registers `git wip`, `git commit-report`, `git commit-nr` in local `.git/config`.

Pre-review: **S** skips LLM. `git commit --no-verify` skips hook entirely.
