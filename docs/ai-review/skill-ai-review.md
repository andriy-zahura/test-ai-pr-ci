# JTI review skill (portable reference)

Invoke `/jti-review` before commit. **Context sync only** — does not run the review pipeline.

## Skill location

`.cursor/skills/jti-review/SKILL.md`

Copy globally: `cp -r .cursor/skills/jti-review ~/.cursor/skills/`

## Two agents

1. **Dev agent** — `/jti-review` updates mapping + feature docs
2. **Commit reviewer** — runs on `git commit` only

## FORBIDDEN in /jti-review

- `npm run ai-review`
- Scores, issue lists, review reports
- Acting as the commit reviewer

Do **not** use Cursor's built-in `/code-review` command for this workflow.
