# Agent Instructions — AI Pre-Commit Review

You are working in a repo with a local pre-commit review pipeline. Follow this contract.

## Before writing code

1. Read `docs/ai-review/README.md`
2. Read `review-mapping.json`
3. If touching a feature area, read its doc under `docs/<feature>/`
4. Read `docs/project-rules/`

## When adding or changing a feature

Do **all** of these in the same change set:

1. **Identify affected paths** — which files will change?
2. **Check mapping** — open `review-mapping.json`. If paths are unmapped, add entries (see [MAPPING.md](./MAPPING.md))
3. **Write or update feature doc** — create `docs/<feature>/README.md` using [FEATURE-DOC-TEMPLATE.md](./FEATURE-DOC-TEMPLATE.md)
4. **Implement code**
5. **Stage everything** — `git add` code + docs + mapping together

## When user says "add feature X"

```text
1. Create docs/<feature>/README.md from template
2. Add mapping entries for new/changed paths
3. Implement code matching the doc
4. Remind user: commit triggers review on staged diff
```

## Mapping rules

- One pattern → one `docs/<feature>` folder
- Patterns are glob-like: `src/auth.ts`, `src/payments/**`
- `docs/project-rules` is always included — do not map it
- If you change `src/foo/bar.ts` and no mapping matches, review lacks feature context → medium-severity finding

## Feature doc rules

Feature docs describe **expected behavior**, not implementation details:

- User flows (step by step)
- Validation rules
- Error messages
- Storage/API contracts
- Non-goals

When code changes behavior, update the feature doc in the **same commit**.

## On commit (what the developer sees)

```text
[P] Commit anyway
[R] Open review
[C] Cancel commit
```

Your job: minimize high/critical findings by keeping code, docs, and mapping aligned.

## Reports

Saved locally (gitignored):

```text
docs/reviews/YYYY-MM-DD/HH-mm.md
```

Never commit report files. Never delete `docs/reviews/.gitkeep`.

## Checklist before finishing a task

- [ ] Changed files have mapping entries in `review-mapping.json`
- [ ] Matching `docs/<feature>/README.md` exists and is current
- [ ] `docs/project-rules/` respected
- [ ] Code + docs staged together

## Example prompt you can accept from the user

> Read `docs/ai-review/AGENT-INSTRUCTIONS.md`. I added `src/payments/`. Create the feature doc and update the mapping.

That is the intended workflow.
