---
name: commit-review
description: >-
  Sync review-mapping.json and feature docs with staged changes before commit.
  Use when the user invokes /commit-review, or before git commit, or when doc
  coverage alerts appear in the pre-commit hook.
disable-model-invocation: true
---

# Commit Review — sync docs before commit

Prepare staged code for the AI pre-commit review pipeline.

## When to use

- User invokes `/commit-review`
- User says "prepare for commit" or "sync docs before commit"
- Pre-commit hook showed doc coverage alerts

## Read first

1. `docs/ai-review/AGENT-INSTRUCTIONS.md`
2. `docs/ai-review/MAPPING.md`
3. `review-mapping.json`
4. `docs/ai-review/FEATURE-DOC-TEMPLATE.md`

## Workflow

```text
1. Get staged files
   → git diff --cached --name-only

2. For each staged code file (not docs/reviews, not docs/ai-review):
   a. Check review-mapping.json for a matching pattern
   b. If unmapped → add mapping entry
   c. If mapped → ensure docs/<feature>/README.md exists and matches staged code

3. Update feature docs to reflect current behavior
   - User flows, validation, errors, storage contracts

4. Stage doc changes with code
   → git add review-mapping.json docs/<feature>/

5. Tell user to commit
   → git commit -m "..."
   → pre-commit review runs automatically
```

## Output checklist

Report to the user:

- [ ] Staged files listed
- [ ] Mapping entries added/updated (or already correct)
- [ ] Feature docs created/updated (or already current)
- [ ] All doc changes staged
- [ ] Ready to commit

## If nothing staged

Tell user to `git add` their changes first, then run `/commit-review` again.

## Do not

- Skip feature docs when code behavior changed
- Leave files unmapped in review-mapping.json
- Commit without staging docs + mapping together
