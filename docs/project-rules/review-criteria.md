# Review Criteria

## Severity scale

- **Low** — style, naming, minor improvement — advisory only
- **Medium** — incomplete docs, missing tests, moderate risk
- **High** — missing validation, spec mismatch, significant defect
- **Critical** — security hole, data loss, auth bypass, broken build

## Commit decision

Severity guides priority. The developer always chooses: commit anyway, open report, or cancel.

## Checklist

- [ ] Code matches feature doc in `docs/<feature>/`
- [ ] Project rules followed
- [ ] Changed files mapped in `review-mapping.json`
