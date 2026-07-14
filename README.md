# jti-ai-review

npm package — local AI pre-commit review for **consumer repos**.

This repository is the **CLI source**. It does not run the review pipeline on its own commits.

Consumers install the package and run `npx ai-review init` to scaffold hooks, docs, and skills in their project.

---

## Package development

```bash
npm install
npm run build:cli
npm run pack:local          # test tarball without publishing
```

Pre-commit hook here only runs `build:cli` (compile check).

To dogfood the full review flow locally:

```bash
node dist-cli/cli.js init --skip-prompt   # creates .env.jti-ai-review
node dist-cli/cli.js run                  # after git add
```

Keys go in `.env.jti-ai-review` (gitignored), not `.env`.

---

## Consumer install (npm)

```bash
npm install -D jti-ai-review
npx ai-review init
npm install
```

Init scaffolds in the **consumer project**:

- `.husky/pre-commit` → runs `ai-review` on commit
- `.env.jti-ai-review` / `.env.jti-ai-review.example` — dedicated config (see below)
- `review-mapping.json`, `docs/project-rules/`, `docs/ai-review/`
- `.cursor/skills/jti-review/`

### Configuration (env files)

jti-ai-review uses its **own env file** (Sentry-style). Init never writes to your project's `.env` or `.env.example`.

| File | Committed? | Purpose |
|------|------------|---------|
| `.env.jti-ai-review.example` | Yes | Template with all provider keys |
| `.env.jti-ai-review` | No (gitignored) | Your API keys and provider choice |
| `.env.jti-ai-review.local` | No (gitignored) | Optional local overrides |

**First-time setup:**

```bash
npx ai-review init          # wizard writes .env.jti-ai-review
# or manually:
cp .env.jti-ai-review.example .env.jti-ai-review
# then edit AI_REVIEW_PROVIDER + matching API key
```

**Change provider later:**

```bash
npm run ai-review:init -- --force
```

At runtime, env is loaded in order (later wins): `.env` → `.env.local` → `.env.jti-ai-review` → `.env.jti-ai-review.local`. Keys in `.env.jti-ai-review` take precedence. If you already had review keys in `.env`, they still work until you migrate.

### Workflow (consumer repo)

```text
1. /jti-review     → sync mapping + feature docs
2. git add .
3. git commit      → review → [P] commit / [R] report / [C] cancel
```

---

## Providers

Set `AI_REVIEW_PROVIDER` in `.env.jti-ai-review`. Falls back to `mock` without a key.

| Provider | Env key | Default model |
|----------|---------|---------------|
| cursor | `CURSOR_API_KEY` | auto |
| openai | `OPENAI_API_KEY` | gpt-4o-mini |
| codex | `OPENAI_API_KEY` | gpt-4.1 |
| claude | `ANTHROPIC_API_KEY` | claude-fable-5 |
| gemini | `GOOGLE_API_KEY` | gemini-2.0-flash |

For reliable reviews, prefer **anthropic** or **openai** direct API keys over cursor Cloud Agents.

---

## What ships on npm

Only `dist-cli/`, `README.md`, and `LICENSE` — no consumer scaffold, no review reports.

---

## Commands

```bash
npm run build:cli
npm run pack:local
npm publish
```

CLI:

```bash
ai-review init [--force] [--skip-prompt]
ai-review run [--provider <name>]
```

---

## Design

See [spec.md](spec.md) for full pipeline design.
