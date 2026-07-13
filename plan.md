# Test Plan — AI Pre-Push Review Pipeline (MVP)

Proof-of-concept test on this empty repo. Goal: run full pre-push review loop locally with minimal app surface.

---

## Phase 1 — Scaffold test project

**Goal:** Tiny real codebase to trigger reviews.

- [ ] Init Node.js + TypeScript project (`package.json`, `tsconfig.json`)
- [ ] Add single-page HTML app:
  - `index.html` — landing page
  - `src/app.ts` — small JS/TS logic (e.g. greeting, button handler)
  - `src/styles.css` — basic styles
- [ ] Add `npm run dev` / `npm run build` scripts (optional, for sanity)
- [ ] Initial commit on `main`

**Why HTML:** Zero framework noise. Easy diffs. Enough files to test doc mapping.

---

## Phase 2 — Docs structure

**Goal:** Review context has rules + feature docs, not whole repo.

```
docs/
  project-rules/
    coding-standards.md
    review-criteria.md
  ui/
    README.md          # feature spec for index.html / src/*
  reviews/             # auto-generated reports land here
```

- [ ] Write minimal project rules (naming, accessibility, no inline secrets)
- [ ] Write `docs/ui/README.md` describing expected page behavior
- [ ] Add `review-mapping.json` (or similar):

```json
{
  "src/**": "docs/ui",
  "index.html": "docs/ui"
}
```

- [ ] Commit docs before pipeline work

---

## Phase 3 — Review CLI (core)

**Goal:** Stateless reviewer from assembled context only.

**Package layout (suggested):**

```
src/
  cli.ts                 # entry: `ai-review`
  context/
    buildContext.ts      # gather diff, files, docs, prev review
    docMapper.ts         # read review-mapping.json
  review/
    reviewer.ts          # provider interface
    providers/
      mock.ts            # MVP: deterministic fake review (no API key)
      openai.ts          # optional: real LLM
  report/
    formatReport.ts
    saveReport.ts
  prompt/
    systemPrompt.md
```

**Tasks:**

- [ ] Commander CLI: `ai-review run [--provider mock|openai]`
- [ ] Use `simple-git` to get:
  - changed files vs `origin/main` (or staged + unstaged for local test)
  - full diff text
- [ ] `buildContext()` — merge only:
  - `docs/project-rules/*`
  - mapped feature docs
  - diff + file list
  - `package.json` (metadata)
  - latest `docs/reviews/*.md` if exists
- [ ] **Isolated session:** spawn fresh process / subprocess for reviewer (no shared in-memory dev state)
- [ ] Parse reviewer output → structured report (scores, issues, improvements, prev-resolved)
- [ ] Save `docs/reviews/YYYY-MM-DD_HH-mm.md`
- [ ] Terminal summary + prompt: `[P] Push anyway` / `[R] Open review` / `[C] Cancel push`
- [ ] Exit codes: `0` = push, `1` = cancel (Husky respects this)

**MVP shortcut:** `mock` provider returns fixed sample report. Proves pipeline without API keys. Swap provider later.

---

## Phase 4 — Husky pre-push hook

**Goal:** Hook fires on `git push`, never auto-blocks.

- [ ] Install Husky: `npm install -D husky`
- [ ] `npx husky init`
- [ ] `.husky/pre-push`:

```sh
#!/bin/sh
npm run ai-review
```

- [ ] `package.json` script: `"ai-review": "tsx src/cli.ts run --provider mock"`
- [ ] Hook runs CLI; user chooses P/R/C; push proceeds or aborts per choice

**Note:** Pre-commit optional for MVP. Spec targets pre-push only.

---

## Phase 5 — End-to-end test scenarios

### Test A — First push (no prior review)

1. Change `src/app.ts` (introduce small bug or missing a11y)
2. Update `docs/ui/README.md` if behavior changed
3. `git add` + `git commit`
4. `git push`
5. Expect: context built, mock review runs, report saved, prompt shown

### Test B — Second push (prior review exists)

1. Fix issue from Test A report
2. Push again
3. Expect: previous review included in context; report notes resolution status

### Test C — Doc mapping

1. Change only `index.html`
2. Expect: `docs/ui` included, not unrelated feature docs

### Test D — Cancel push

1. Choose `[C]` at prompt
2. Expect: push aborted, report still saved

### Test E — Push anyway

1. Leave known issue unfixed
2. Choose `[P]`
3. Expect: push succeeds despite low score

---

## Phase 6 — Optional real LLM smoke test

- [ ] Add `OPENAI_API_KEY` (or Anthropic) via `.env` (gitignored)
- [ ] `ai-review run --provider openai`
- [ ] Confirm report quality vs mock
- [ ] Verify reviewer subprocess gets **only** built context file, not dev chat

---

## Success criteria

| Check | Pass |
|-------|------|
| Pre-push hook runs CLI | ✓ |
| Context = rules + mapped docs + diff + metadata | ✓ |
| Reviewer = fresh session / subprocess | ✓ |
| Report saved under `docs/reviews/` | ✓ |
| User always chooses push/cancel | ✓ |
| Provider swappable without pipeline changes | ✓ |
| Works with zero API key (mock mode) | ✓ |

---

## Suggested build order

1. Phase 1 — HTML scaffold
2. Phase 2 — docs + mapping
3. Phase 3 — CLI with mock provider
4. Phase 4 — Husky hook
5. Phase 5 — run Test A–E
6. Phase 6 — real LLM (optional)

---

## Files to create (checklist)

```
.
├── spec.md                          # done
├── plan.md                          # this file
├── package.json
├── tsconfig.json
├── index.html
├── src/
│   ├── app.ts
│   └── styles.css
├── review-mapping.json
├── docs/
│   ├── project-rules/
│   ├── ui/
│   └── reviews/
├── src/cli.ts                       # review CLI source
└── .husky/pre-push
```

---

## Out of scope for this test

- RAG / embeddings
- CI/GitHub Actions
- Multi-agent review
- Auto-block on low score
