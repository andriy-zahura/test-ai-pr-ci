# Changelog

All notable changes to `jti-ai-review` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions use [Semantic Versioning](https://semver.org/).

## [0.1.3] - 2026-07-15

### Added

- Two-step **init wizard**: enable review on this machine (Y/N), then auto-run every commit (y/N).
- Dedicated per-developer env file **`.env.jti-ai-review`** (never touches project `.env` / `.env.example`).
- Env toggles: `AI_REVIEW_ENABLED`, `AI_REVIEW_AUTO_RUN`, `AI_REVIEW_SAVE_REPORT`.
- **Local-only** `.husky/pre-commit` hook (gitignored); committed `.husky/pre-commit.example` template.
- Git aliases (local `.git/config`): `git no-review`, `git commit-report`.
- Shorthand git config keys: `ai-review.skip`, `ai-review.no-review`, `ai-review.no-report`, etc.
- Pre-review prompt when `AI_REVIEW_AUTO_RUN=false`: **[S] skip** / **[Enter] run** (saves tokens).
- Skip/report overrides via CLI flags (`--skip`, `--no-report`, `--report`), env vars, and `git -c`.
- `disableLocalReview()` on init **N** — removes hook, clears aliases, sets `AI_REVIEW_ENABLED=false`.
- **Recovery instructions** when a reviewer fails (parse errors, API errors, worker crash) — suggests `git no-review -m "..."` or `AI_REVIEW_ENABLED=false`.
- Consumer docs section: **When review fails (provider / JSON errors)** in scaffolded `docs/ai-review/README.md`.
- Cursor model helper: `composer-2.5` requests `fast=false` (standard tier; API defaults to expensive fast mode).

### Changed

- Removed **`ai-review.config.json`** — settings live in `.env.jti-ai-review` only.
- Renamed git alias **`wip` → `no-review`**.
- Report files off by default (`AI_REVIEW_SAVE_REPORT=false`).
- README rewritten for consumers (install, wizard, env vars, tarball upgrade, team scenarios).
- Init `--force` merges existing `.env.jti-ai-review` (API keys preserved).

### Fixed

- **Stdout pollution** from Cursor model log breaking isolated worker JSON parse (`Failed to parse review output: Unexpected token 'C'...`). Model log moved to stderr.
- Defensive JSON extraction in review worker stdout (skips leading non-JSON lines).
- Worker stderr forwarded to terminal and included in parent error message.

## [0.1.2] - 2026-07-14

### Changed

- Init scaffold uses dedicated **`.env.jti-ai-review`** + **`.env.jti-ai-review.example`** instead of merging into project `.env`.

## [0.1.1] - 2026-07-14

### Fixed

- **`ai-review init --force`** merges into an existing `.env` instead of replacing it — API keys and custom vars are preserved.

## [0.1.0] - 2026-07-13

### Added

- Initial npm package: `ai-review` CLI with `init` and `run` commands.
- Multi-provider LLM review: **anthropic**, **openai**, **cursor**, **gemini**, **mock**.
- Isolated review worker subprocess for pre-commit safety.
- Doc coverage alerts via `review-mapping.json`.
- Pre-commit hook integration (husky).
- `npm pack` / local tarball install support.
- `/jti-review` skill scaffold and `docs/ai-review/` consumer docs.

[0.1.3]: https://github.com/andriy-zahura/test-ai-pr-ci/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/andriy-zahura/test-ai-pr-ci/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/andriy-zahura/test-ai-pr-ci/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/andriy-zahura/test-ai-pr-ci/releases/tag/v0.1.0
