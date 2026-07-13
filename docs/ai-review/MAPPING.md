# Review Mapping

File: `review-mapping.json` (repo root)

## Schema

```json
{
  "alwaysInclude": ["docs/project-rules"],
  "mappings": [
    { "pattern": "src/auth.ts", "docs": "docs/auth" },
    { "pattern": "src/payments/**", "docs": "docs/payments" }
  ]
}
```

| Field | Meaning |
|-------|---------|
| `alwaysInclude` | Doc folders included in every review |
| `mappings[].pattern` | Staged file path (glob: `*` and `**`) |
| `mappings[].docs` | Feature doc folder to load |

## How matching works

On commit, staged file paths are checked against each `pattern`. Matching docs folders are loaded (all `.md` / `.json` inside).

## Examples

```json
{ "pattern": "index.html", "docs": "docs/ui" }
{ "pattern": "src/components/Header.tsx", "docs": "docs/ui" }
{ "pattern": "src/auth/**", "docs": "docs/auth" }
{ "pattern": "packages/api/src/**", "docs": "docs/api" }
```

## Agent task: fill mapping for a new feature

1. List files you created or modified
2. Pick a `docs/<feature>` folder name
3. Add one mapping per path pattern (prefer specific over broad)
4. Create `docs/<feature>/README.md`

## Common mistakes

- Code changed, mapping not updated → review lacks context
- Mapping points to empty folder → no feature spec
- Pattern too broad (`**`) → unrelated docs included
