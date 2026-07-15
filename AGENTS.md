# AI Agents

<!-- ai-review -->

## Pre-commit review pipeline

This repo uses a local AI pre-commit review. **Read before changing code or docs:**

1. [docs/ai-review/README.md](docs/ai-review/README.md)
2. [docs/ai-review/AGENT-INSTRUCTIONS.md](docs/ai-review/AGENT-INSTRUCTIONS.md)
3. [docs/ai-review/MAPPING.md](docs/ai-review/MAPPING.md)

When adding features: update `review-mapping.json` + create `docs/<feature>/README.md` (see [FEATURE-DOC-TEMPLATE.md](docs/ai-review/FEATURE-DOC-TEMPLATE.md)).

**Before commit:** invoke `/jti-review` (syncs docs/mapping — does **not** run the review). Copy `.cursor/skills/jti-review` to `~/.cursor/skills/` for global use.

<!-- /ai-review -->
