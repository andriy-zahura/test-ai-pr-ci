export interface ScaffoldFile {
  path: string;
  content: string;
  executable?: boolean;
}

export const SCAFFOLD_FILES: ScaffoldFile[] = [
  {
    path: "docs/ai-review/README.md",
    content: `# AI Pre-Commit Review

Local review runs on **staged changes** before each \`git commit\`.

## Quick start

1. Stage changes: \`git add <files>\`
2. Commit: \`git commit -m "message"\`
3. Review runs automatically (Husky pre-commit hook)
4. Choose: **[P] Commit anyway** | **[R] Open report** | **[C] Cancel**

## What gets reviewed

Only the **staged diff** plus:

| Input | Source |
|-------|--------|
| Project rules | \`docs/project-rules/\` (always) |
| Feature docs | Mapped via \`review-mapping.json\` |
| Previous report | Latest file in \`docs/reviews/YYYY-MM-DD/\` |
| Metadata | \`package.json\` |

The reviewer does **not** see your full repo or IDE chat history.

## Repo layout

\`\`\`text
review-mapping.json       # which files → which docs
docs/
  ai-review/              # this guide + agent instructions
  project-rules/          # coding standards, review criteria
  <feature>/              # feature specs (e.g. auth/, payments/)
  reviews/                # local reports, gitignored, grouped by day
.husky/pre-commit         # runs ai-review
\`\`\`

## For AI coding agents

Read before changing mapped code or docs:

1. [AGENT-INSTRUCTIONS.md](./AGENT-INSTRUCTIONS.md) — required workflow
2. [MAPPING.md](./MAPPING.md) — how to edit \`review-mapping.json\`
3. [FEATURE-DOC-TEMPLATE.md](./FEATURE-DOC-TEMPLATE.md) — how to write feature docs

**Before commit:** run \`/commit-review\` in your agent (see [skill-ai-review.md](./skill-ai-review.md)).

## Severity scale

\`low\` | \`medium\` | \`high\` | \`critical\`

Severity guides priority in the report. **Commits are never auto-blocked** — the developer always chooses.

## Bypass

\`git commit --no-verify\` skips the hook.
`,
  },
  {
    path: "docs/ai-review/AGENT-INSTRUCTIONS.md",
    content: `# Agent Instructions — AI Pre-Commit Review

You are working in a repo with a local pre-commit review pipeline. Follow this contract.

## Before writing code

1. Read \`docs/ai-review/README.md\`
2. Read \`review-mapping.json\`
3. If touching a feature area, read its doc under \`docs/<feature>/\`
4. Read \`docs/project-rules/\`

## When adding or changing a feature

Do **all** of these in the same change set:

1. **Identify affected paths** — which files will change?
2. **Check mapping** — open \`review-mapping.json\`. If paths are unmapped, add entries (see [MAPPING.md](./MAPPING.md))
3. **Write or update feature doc** — create \`docs/<feature>/README.md\` using [FEATURE-DOC-TEMPLATE.md](./FEATURE-DOC-TEMPLATE.md)
4. **Implement code**
5. **Stage everything** — \`git add\` code + docs + mapping together

## When user says "add feature X"

\`\`\`text
1. Create docs/<feature>/README.md from template
2. Add mapping entries for new/changed paths
3. Implement code matching the doc
4. Remind user: commit triggers review on staged diff
\`\`\`

## Mapping rules

- One pattern → one \`docs/<feature>\` folder
- Patterns are glob-like: \`src/auth.ts\`, \`src/payments/**\`
- \`docs/project-rules\` is always included — do not map it
- If you change \`src/foo/bar.ts\` and no mapping matches, review lacks feature context → medium-severity finding

## Feature doc rules

Feature docs describe **expected behavior**, not implementation details:

- User flows (step by step)
- Validation rules
- Error messages
- Storage/API contracts
- Non-goals

When code changes behavior, update the feature doc in the **same commit**.

## On commit (what the developer sees)

\`\`\`text
[P] Commit anyway
[R] Open review
[C] Cancel commit
\`\`\`

Your job: minimize high/critical findings by keeping code, docs, and mapping aligned.

## Reports

Saved locally (gitignored):

\`\`\`text
docs/reviews/YYYY-MM-DD/HH-mm.md
\`\`\`

Never commit report files. Never delete \`docs/reviews/.gitkeep\`.

## Checklist before finishing a task

- [ ] Changed files have mapping entries in \`review-mapping.json\`
- [ ] Matching \`docs/<feature>/README.md\` exists and is current
- [ ] \`docs/project-rules/\` respected
- [ ] Code + docs staged together

## Example prompt you can accept from the user

> Read \`docs/ai-review/AGENT-INSTRUCTIONS.md\`. I added \`src/payments/\`. Create the feature doc and update the mapping.

That is the intended workflow.
`,
  },
  {
    path: "docs/ai-review/MAPPING.md",
    content: `# Review Mapping

File: \`review-mapping.json\` (repo root)

## Schema

\`\`\`json
{
  "alwaysInclude": ["docs/project-rules"],
  "mappings": [
    { "pattern": "src/auth.ts", "docs": "docs/auth" },
    { "pattern": "src/payments/**", "docs": "docs/payments" }
  ]
}
\`\`\`

| Field | Meaning |
|-------|---------|
| \`alwaysInclude\` | Doc folders included in every review |
| \`mappings[].pattern\` | Staged file path (glob: \`*\` and \`**\`) |
| \`mappings[].docs\` | Feature doc folder to load |

## How matching works

On commit, staged file paths are checked against each \`pattern\`. Matching docs folders are loaded (all \`.md\` / \`.json\` inside).

## Examples

\`\`\`json
{ "pattern": "index.html", "docs": "docs/ui" }
{ "pattern": "src/components/Header.tsx", "docs": "docs/ui" }
{ "pattern": "src/auth/**", "docs": "docs/auth" }
{ "pattern": "packages/api/src/**", "docs": "docs/api" }
\`\`\`

## Agent task: fill mapping for a new feature

1. List files you created or modified
2. Pick a \`docs/<feature>\` folder name
3. Add one mapping per path pattern (prefer specific over broad)
4. Create \`docs/<feature>/README.md\`

## Common mistakes

- Code changed, mapping not updated → review lacks context
- Mapping points to empty folder → no feature spec
- Pattern too broad (\`**\`) → unrelated docs included
`,
  },
  {
    path: "docs/ai-review/FEATURE-DOC-TEMPLATE.md",
    content: `# Feature Doc Template

Copy to \`docs/<feature>/README.md\` and fill in.

---

# <Feature Name>

One-line description.

## Scope

What this feature covers. What it does not cover.

## Files

| File | Role |
|------|------|
| \`src/...\` | ... |

## User flows

### Flow 1: <name>

1. User does X
2. System does Y
3. Result Z

## Validation rules

| Input | Rule | Error message |
|-------|------|---------------|
| email | format check | "..." |

## Storage / API

| Key/Endpoint | Shape |
|--------------|-------|
| ... | ... |

## Error messages

| Condition | Message |
|-----------|---------|
| ... | ... |

## Non-goals

- Not implementing X in MVP
- No Y

## Reviewer focus

What the AI reviewer should check for this feature:
- Validation matches table above
- Flows match implementation
- Edge cases documented here are handled
`,
  },
  {
    path: "AGENTS.md",
    content: `# AI Agents

<!-- ai-review -->

## Pre-commit review pipeline

This repo uses a local AI pre-commit review. **Read before changing code or docs:**

1. [docs/ai-review/README.md](docs/ai-review/README.md)
2. [docs/ai-review/AGENT-INSTRUCTIONS.md](docs/ai-review/AGENT-INSTRUCTIONS.md)
3. [docs/ai-review/MAPPING.md](docs/ai-review/MAPPING.md)

When adding features: update \`review-mapping.json\` + create \`docs/<feature>/README.md\` (see [FEATURE-DOC-TEMPLATE.md](docs/ai-review/FEATURE-DOC-TEMPLATE.md)).

**Before commit:** invoke \`/commit-review\` — or copy [skill-ai-review.md](docs/ai-review/skill-ai-review.md) to \`~/.cursor/skills/commit-review/SKILL.md\`.

<!-- /ai-review -->
`,
  },
  {
    path: "review-mapping.json",
    content: `{
  "alwaysInclude": [
    "docs/project-rules"
  ],
  "mappings": []
}
`,
  },
  {
    path: "docs/project-rules/coding-standards.md",
    content: `# Coding Standards

Customize for your project. The AI reviewer checks staged code against these rules.

## General

- Match existing project conventions
- Minimal scope per change
- No secrets in source code

## Naming

- Be consistent with the codebase
- Use clear, descriptive names

## Errors

- Validate user input
- Return clear error messages
- Handle parse/storage failures safely

## Documentation

- Update feature docs when behavior changes
- Keep \`review-mapping.json\` in sync with new files
`,
  },
  {
    path: "docs/project-rules/review-criteria.md",
    content: `# Review Criteria

## Severity scale

- **Low** — style, naming, minor improvement — advisory only
- **Medium** — incomplete docs, missing tests, moderate risk
- **High** — missing validation, spec mismatch, significant defect
- **Critical** — security hole, data loss, auth bypass, broken build

## Commit decision

Severity guides priority. The developer always chooses: commit anyway, open report, or cancel.

## Checklist

- [ ] Code matches feature doc in \`docs/<feature>/\`
- [ ] Project rules followed
- [ ] Changed files mapped in \`review-mapping.json\`
`,
  },
  {
    path: "docs/ai-review/skill-ai-review.md",
    content: `# commit-review skill (portable copy)

Copy this file to one of:

- **Project:** \`.cursor/skills/commit-review/SKILL.md\` (already created by init if using Cursor)
- **Global:** \`~/.cursor/skills/commit-review/SKILL.md\` (all repos)

Then invoke with \`/commit-review\` before \`git commit\`.

---

See \`.cursor/skills/commit-review/SKILL.md\` in this repo for the full skill content.
`,
  },
  {
    path: ".cursor/skills/commit-review/SKILL.md",
    content: `---
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

- User invokes \`/commit-review\`
- User says "prepare for commit" or "sync docs before commit"
- Pre-commit hook showed doc coverage alerts

## Read first

1. \`docs/ai-review/AGENT-INSTRUCTIONS.md\`
2. \`docs/ai-review/MAPPING.md\`
3. \`review-mapping.json\`
4. \`docs/ai-review/FEATURE-DOC-TEMPLATE.md\`

## Workflow

\`\`\`text
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
\`\`\`

## Output checklist

Report to the user:

- [ ] Staged files listed
- [ ] Mapping entries added/updated (or already correct)
- [ ] Feature docs created/updated (or already current)
- [ ] All doc changes staged
- [ ] Ready to commit

## If nothing staged

Tell user to \`git add\` their changes first, then run \`/commit-review\` again.

## Do not

- Skip feature docs when code behavior changed
- Leave files unmapped in review-mapping.json
- Commit without staging docs + mapping together
`,
  },
  {
    path: "docs/reviews/.gitkeep",
    content: "",
  },
  {
    path: ".husky/pre-commit",
    content: `#!/bin/sh
npm run build:cli --if-present 2>/dev/null || true
npm run ai-review
`,
    executable: true,
  },
];

export const GITIGNORE_LINES = [
  "",
  "# Local review reports (not committed)",
  "docs/reviews/**",
  "!docs/reviews/.gitkeep",
];

export const AI_REVIEW_MARKER_START = "<!-- ai-review -->";
export const AI_REVIEW_MARKER_END = "<!-- /ai-review -->";
