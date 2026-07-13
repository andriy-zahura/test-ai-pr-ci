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
node dist-cli/cli.js init --skip-prompt
node dist-cli/cli.js run    # after git add
```

---

## Consumer install (npm)

```bash
npm install -D jti-ai-review
npx ai-review init
npm install
```

Init scaffolds in the **consumer project**:

- `.husky/pre-commit` → runs `ai-review` on commit
- `.env` / `.env.example`
- `review-mapping.json`, `docs/project-rules/`, `docs/ai-review/`
- `.cursor/skills/jti-review/`

### Workflow (consumer repo)

```text
1. /jti-review     → sync mapping + feature docs
2. git add .
3. git commit      → review → [P] commit / [R] report / [C] cancel
```

---

## Providers

| Provider | Env key |
|----------|---------|
| cursor | `CURSOR_API_KEY` |
| openai | `OPENAI_API_KEY` |
| codex | `OPENAI_API_KEY` |
| claude | `ANTHROPIC_API_KEY` |
| gemini | `GOOGLE_API_KEY` |

Set `AI_REVIEW_PROVIDER` in `.env`. Falls back to `mock` without a key.

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
