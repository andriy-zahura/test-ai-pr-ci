# AI Pre-Commit Review Pipeline (MVP)

## Goal

Build a proof-of-concept repository that demonstrates a local AI-powered pre-commit review pipeline.

The reviewer **must always run as a completely fresh AI session**. It must never reuse the development agent's context or conversation history. Every review should be reproducible from the provided inputs only.

---

## Desired Workflow

1. A developer writes code using any AI coding assistant (Composer, Claude Code, Codex, etc.) or manually.

2. The developer updates feature documentation under `docs/<feature>/` (or runs `/commit-review` with their agent to sync mapping + docs).

3. The developer stages changes with `git add`.

4. The developer runs `git commit`.

5. A Husky `pre-commit` hook intercepts the commit.

6. The hook launches a local review CLI.

7. The CLI builds a temporary review context consisting only of:

   * Project rules (`docs/project-rules/`)
   * Documentation for affected features
   * **Staged** git diff (`git diff --cached`)
   * List of staged files
   * Relevant project metadata (package.json, tsconfig, etc., if useful)
   * Previous review report (if one exists)

8. The CLI starts a **new, isolated AI reviewer session** using the generated context.

9. The reviewer performs a code review and outputs:

   * Overall score (0–10)
   * Category scores (Architecture, Maintainability, Type Safety, Documentation, Testing, Performance, Security, etc.)
   * List of issues
   * Suggested improvements
   * Whether previous review comments were resolved (if applicable)

10. The report is saved under:

```text
docs/reviews/YYYY-MM-DD/HH-mm.md
```

Review reports are local only (gitignored), grouped by day.

11. The CLI displays a summary in the terminal and asks:

```text
[P] Commit anyway
[R] Open review
[C] Cancel commit
```

12. **Doc coverage alerts** appear if staged code lacks mapping, feature README, or doc updates in the same commit. Fix or run `/commit-review`.

13. The commit is **never blocked automatically**. The developer always decides.

`git push` is never intercepted. Bypass the hook with `git commit --no-verify` if needed.

---

## Documentation Mapping

Each feature has its own documentation:

```text
docs/
    auth/
    navigation/
    onboarding/
    payments/
```

The system must determine which documentation to include based on the changed files.

For the MVP, a simple explicit mapping is acceptable (configuration file or file annotations). Future versions may use semantic retrieval or embeddings.

Example:

```text
src/auth/*
    -> docs/auth

src/navigation/*
    -> docs/navigation
```

Global project rules should always be included.

---

## Review Context

The reviewer should receive only:

* Project rules
* Relevant feature documentation
* Staged git diff
* Staged files
* Previous review (optional)
* Minimal project metadata

It should **not** receive the entire repository unless explicitly required.

---

## Design Principles

* Reviewer is stateless.
* Reviewer has no memory of development.
* Development and review use separate AI sessions.
* The system should be model-agnostic.
* The pipeline should be extensible for future CI integration.

---

## Suggested Tech Stack

* Node.js
* TypeScript
* Husky
* simple-git
* Commander (CLI)
* Markdown for reports

Keep the architecture modular so different LLM providers (OpenAI, Anthropic, Gemini, local models, etc.) can be swapped without changing the pipeline.

---

## Future Improvements (Not Required for MVP)

* Semantic document retrieval (RAG)
* API/OpenAPI awareness
* Automatic architecture diagrams
* Review history tracking across multiple commits
* Incremental review ("fixed", "partially fixed", "new issue")
* CI/GitHub integration
* Pull Request review generation
* Multi-agent review (architecture, security, performance, testing)
