# AI Pre-Commit Review

Local review runs on **staged changes** before each `git commit`.

## Quick start

1. Set API key: `npm run ai-review:init` (prompts) or copy `.env.example` → `.env`
2. Stage changes: `git add <files>`
3. Commit: `git commit -m "message"`
4. Review runs automatically (Husky pre-commit hook)
5. Choose: **[P] Commit anyway** | **[R] Open report** | **[C] Cancel**

Provider: `cursor` | `openai` | `codex` | `anthropic`/`claude` | `gemini`/`google` | `mock`

`.env` (gitignored) — set `AI_REVIEW_PROVIDER` and the matching key:

| Provider | Env key | Default model |
|----------|---------|---------------|
| cursor | `CURSOR_API_KEY` | auto |
| openai | `OPENAI_API_KEY` | gpt-4o-mini |
| codex | `OPENAI_API_KEY` | gpt-4.1 |
| claude | `ANTHROPIC_API_KEY` | claude-sonnet-4-20250514 |
| gemini | `GOOGLE_API_KEY` | gemini-2.0-flash |

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
review-mapping.json       # which files → which docs
docs/
  ai-review/              # this guide + agent instructions
  project-rules/          # coding standards, review criteria
  <feature>/              # feature specs (e.g. auth/, payments/)
  reviews/                # local reports, gitignored, grouped by day
.husky/pre-commit         # runs ai-review
```

## For AI coding agents

Read before changing mapped code or docs:

1. [AGENT-INSTRUCTIONS.md](./AGENT-INSTRUCTIONS.md) — required workflow
2. [MAPPING.md](./MAPPING.md) — how to edit `review-mapping.json`
3. [FEATURE-DOC-TEMPLATE.md](./FEATURE-DOC-TEMPLATE.md) — how to write feature docs

## Severity scale

`low` | `medium` | `high` | `critical`

Severity guides priority in the report. **Commits are never auto-blocked** — the developer always chooses.

## Bypass

`git commit --no-verify` skips the hook.
