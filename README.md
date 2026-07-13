# JTI AI Pre-Commit Review

Local pre-commit review pipeline. Syncs feature docs before commit. Runs an isolated reviewer on `git commit`.

**Not** a code editor plugin. **Not** Cursor's `/code-review`. Dev agent syncs context → hook runs real review.

---

## Quick start (new repo)

```bash
npm install
npm run build:cli
npm run ai-review:init
```

Init scaffolds:

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

Provider: `mock` (no API key). Swap in `cli/src/review/providers/` for real LLM.

---

## Add to existing project

```bash
# copy or npm install package (when published)
npm run ai-review:init
# edit review-mapping.json for your features
# create docs/<feature>/README.md per template
```

---

## Bypass

```bash
git commit --no-verify
```
