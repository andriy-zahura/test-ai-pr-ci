# Review Criteria

AI reviewer scores each category 0–10. Overall score is weighted average.

## Categories

| Category         | Weight | What to check |
|------------------|--------|---------------|
| Architecture     | 15%    | Separation of concerns, module boundaries, no circular deps |
| Maintainability  | 15%    | Readable code, consistent patterns, low duplication |
| Type Safety      | 10%    | Strict TS, proper null handling, no unsafe casts |
| Documentation    | 15%    | Feature docs match implementation; rules followed |
| Testing          | 10%    | Critical paths testable; validation logic covered |
| Performance      | 10%    | No unnecessary DOM work; small bundle |
| Security         | 25%    | Input validation, no XSS, safe storage patterns |

## Security checklist (auth feature)

- [ ] Email validated before use
- [ ] Password minimum length enforced
- [ ] No credentials in source code
- [ ] Session checked before protected page renders
- [ ] User input not injected into DOM via `innerHTML`
- [ ] Logout clears session

## Documentation checklist

- [ ] Changed files have matching feature doc under `docs/<feature>/`
- [ ] Behavior in docs matches actual validation rules
- [ ] Project rules from `docs/project-rules/` respected

## Issue severity

- **Low** — style, naming, minor improvement — advisory only
- **Medium** — incomplete docs, missing tests, moderate risk
- **High** — missing validation, spec mismatch, significant defect
- **Critical** — security hole, data loss, auth bypass, broken build

## Commit decision

- Severity (low → critical) indicates priority in the report
- The developer always chooses: commit anyway, open review, or cancel
- The hook never auto-blocks
