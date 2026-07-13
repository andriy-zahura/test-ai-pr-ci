# JTI AI Pre-Commit Review

Local pre-commit review pipeline. Syncs feature docs before commit. Runs an isolated reviewer on `git commit`.

**Not** a code editor plugin. **Not** Cursor's `/code-review`. Dev agent syncs context → hook runs real review.

---

## Quick start (new repo)

```bash
npm install
npm run build:cli
npm run ai-review:init   # prompts for OPENAI_API_KEY
```

Init scaffolds:

- `.env.example` + `.env` (API key prompt)
- `.husky/pre-commit` hook
- `review-mapping.json`
- `docs/project-rules/`, `docs/ai-review/`
- `.cursor/skills/jti-review/` skill

Then install Husky if needed:

```bash
npm install -D husky
npx husky init   # skip if hook already exists
```

---

## Daily workflow

```text
1. Write code
2. /jti-review          → agent syncs mapping + docs/<feature>/
3. git add .
4. git commit           → review runs → [P] commit / [R] report / [C] cancel
5. git push             → no review hook
```

### Copy skill globally (optional)

```bash
cp -r .cursor/skills/jti-review ~/.cursor/skills/
```

Tell your agent once:

> Read `docs/ai-review/AGENT-INSTRUCTIONS.md`. Use `/jti-review` before commit.

---

## What gets reviewed

Only **staged** changes, plus:

| Context | Source |
|---------|--------|
| Project rules | `docs/project-rules/` (always) |
| Feature docs | `review-mapping.json` → `docs/<feature>/` |
| Prior report | Latest `docs/reviews/YYYY-MM-DD/*.md` (local, gitignored) |

The commit reviewer is a **separate isolated session** — no IDE chat history.

---

## Key files

| File | Purpose |
|------|---------|
| `review-mapping.json` | Staged file patterns → doc folders |
| `docs/<feature>/README.md` | Feature spec the reviewer checks against |
| `docs/ai-review/` | Agent onboarding + `/jti-review` skill docs |
| `cli/` | Review pipeline source |
| `spec.md` | Full design spec |

---

## Commands

```bash
npm run build:cli       # compile CLI
npm run ai-review:init  # scaffold config + docs + skill
npm run ai-review         # run review on staged files (same as hook)
```

Provider: `cursor` | `openai` | `codex` | `anthropic`/`claude` | `gemini`/`google` | `mock`

```bash
npm run ai-review:init   # pick provider + enter API key
# or: cp .env.example .env and fill in CURSOR_API_KEY / OPENAI_API_KEY / etc.
```

| Provider | Env key | Notes |
|----------|---------|-------|
| **cursor** | `CURSOR_API_KEY` | From Cursor Dashboard → Integrations |
| openai | `OPENAI_API_KEY` | Chat Completions API |
| codex | `OPENAI_API_KEY` | Same API, codex-tuned default model |
| claude | `ANTHROPIC_API_KEY` | Anthropic Messages API |
| gemini | `GOOGLE_API_KEY` | Google AI Studio key |

Set `AI_REVIEW_PROVIDER=cursor` (or openai, codex, anthropic, gemini). Falls back to `mock` without a key.

---

## Add to existing project

### Option A — local `.tgz` (no npm registry)

```bash
# In jti-ai-review repo
npm run pack:local
# → jti-ai-review-0.1.0.tgz

# In your other project
npm install -D /absolute/path/to/jti-ai-review-0.1.0.tgz
npx ai-review init
npm install   # installs husky from init + wires prepare
git add . && git commit
```

### Option B — `npm link`

```bash
# In jti-ai-review repo
npm run build:cli && npm link

# In your other project
npm link jti-ai-review
npx ai-review init
```

### Option C — direct path (no install)

```bash
node /absolute/path/to/test-ai-pr-ci/dist-cli/cli.js init
# then set package.json scripts to that node path manually
```

After init, edit `review-mapping.json` and create `docs/<feature>/README.md` per template.

---

## Bypass

```bash
git commit --no-verify
```
