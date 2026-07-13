export const JTI_REVIEW_SKILL = `---
name: jti-review
description: >-
  Context-prep ONLY. Sync review-mapping.json and feature docs with staged
  changes before commit. NEVER run ai-review, score code, or act as the commit
  reviewer. Invoke with /jti-review.
disable-model-invocation: true
---

# JTI Review — sync context (NOT a code reviewer)

You are the **development agent**. Your job is to update files so the **separate commit reviewer** has correct context.

## Two agents — do not merge them

| Agent | When | What it does |
|-------|------|----------------|
| **You (dev agent)** | Now, via \`/jti-review\` | Edit code, mapping, feature docs |
| **Commit reviewer** | On \`git commit\` only | Fresh isolated session, reads staged diff + docs |

You prepare inputs. You do **not** perform the commit review.

## FORBIDDEN — never do these in this skill

- Do **not** run \`npm run ai-review\`, \`ai-review run\`, or any review CLI
- Do **not** invoke the pre-commit hook manually
- Do **not** generate review reports, scores, or issue lists
- Do **not** review code quality, security, or architecture in this chat
- Do **not** pretend to be the commit reviewer
- Do **not** use Cursor's built-in \`/code-review\` command

If the user says "review" here, they mean **sync docs/mapping**, not run the pipeline.

## When to use

- User invokes \`/jti-review\`
- User says "sync docs before commit" or "update review context"
- Pre-commit hook showed doc coverage alerts

## Read first

1. \`docs/ai-review/AGENT-INSTRUCTIONS.md\`
2. \`docs/ai-review/MAPPING.md\`
3. \`review-mapping.json\`
4. \`docs/ai-review/FEATURE-DOC-TEMPLATE.md\`

## Workflow (context sync only)

\`\`\`text
1. Get staged files → git diff --cached --name-only
2. For each staged code file: check mapping, update docs/<feature>/README.md
3. Update review-mapping.json if needed
4. Stage docs + mapping with code
5. Tell user to git commit — hook runs the real reviewer
\`\`\`

## Output checklist

- [ ] Staged files listed
- [ ] Mapping updated (or already correct)
- [ ] Feature docs updated (or already current)
- [ ] Doc changes staged
- [ ] Ready for user to \`git commit\`

## Do not

- Run the review pipeline yourself
- Skip feature docs when behavior changed
- Leave files unmapped
`;
