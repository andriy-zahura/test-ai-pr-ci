import { JTI_REVIEW_SKILL } from "./skillContent.js";

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

1. Set API key: \`npm run ai-review:init\` (prompts) or copy \`.env.example\` → \`.env\`
2. Stage changes: \`git add <files>\`
3. Commit: \`git commit -m "message"\`
4. Review runs automatically (Husky pre-commit hook)
5. Choose: **[P] Commit anyway** | **[R] Open report** | **[C] Cancel**

Provider: \`cursor\` | \`openai\` | \`codex\` | \`anthropic\`/\`claude\` | \`gemini\`/\`google\` | \`mock\`

\`.env\` (gitignored) — set \`AI_REVIEW_PROVIDER\` and the matching key:

| Provider | Env key | Default model |
|----------|---------|---------------|
| cursor | \`CURSOR_API_KEY\` | auto |
| openai | \`OPENAI_API_KEY\` | gpt-4o-mini |
| codex | \`OPENAI_API_KEY\` | gpt-4.1 |
| claude | \`ANTHROPIC_API_KEY\` | claude-sonnet-4-20250514 |
| gemini | \`GOOGLE_API_KEY\` | gemini-2.0-flash |

Cursor key: Dashboard → Integrations → API Keys (\`cursor_...\`).

Without a key, falls back to \`mock\` provider.

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

**Before commit:** run \`/jti-review\` — context sync only, not code review.

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

**Before commit:** invoke \`/jti-review\` (syncs docs/mapping — does **not** run the review). Copy \`.cursor/skills/jti-review\` to \`~/.cursor/skills/\` for global use.

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
    content: `# JTI review skill (portable reference)

Invoke \`/jti-review\` before commit. **Context sync only** — does not run the review pipeline.

## Skill location

\`.cursor/skills/jti-review/SKILL.md\`

Copy globally: \`cp -r .cursor/skills/jti-review ~/.cursor/skills/\`

## Two agents

1. **Dev agent** — \`/jti-review\` updates mapping + feature docs
2. **Commit reviewer** — runs on \`git commit\` only

## FORBIDDEN in /jti-review

- \`npm run ai-review\`
- Scores, issue lists, review reports
- Acting as the commit reviewer

Do **not** use Cursor's built-in \`/code-review\` command for this workflow.
`,
  },
  {
    path: ".cursor/skills/jti-review/SKILL.md",
    content: JTI_REVIEW_SKILL,
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
  "# Local env (API keys)",
  ".env",
  ".env.local",
  "",
  "# Local review reports (not committed)",
  "docs/reviews/**",
  "!docs/reviews/.gitkeep",
];

export const AI_REVIEW_MARKER_START = "<!-- ai-review -->";
export const AI_REVIEW_MARKER_END = "<!-- /ai-review -->";
