# Feature Doc Template

Copy to `docs/<feature>/README.md` and fill in.

---

# <Feature Name>

One-line description.

## Scope

What this feature covers. What it does not cover.

## Files

| File | Role |
|------|------|
| `src/...` | ... |

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
