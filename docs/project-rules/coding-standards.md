# Coding Standards

## General

- TypeScript strict mode. No `any` unless unavoidable.
- Vanilla JS/TS only — no runtime third-party libraries.
- One concern per file: `auth.ts` = logic, `login.ts` / `success.ts` = page wiring.
- Prefer named exports for shared modules.

## Naming

- Files: `kebab-case` for HTML, `camelCase` for TS modules.
- Functions: verbs (`logIn`, `signUp`, `getSession`).
- Constants: `UPPER_SNAKE_CASE` for storage keys.
- DOM ids match element purpose (`email`, `password`, `logout`).

## HTML & Accessibility

- Every input has a `<label>`.
- Use semantic elements (`<main>`, `<form>`, `<button>`).
- Buttons declare `type` explicitly (`submit` vs `button`).
- Error messages visible to screen readers (not `aria-hidden` on errors).

## Storage

- localStorage keys are namespaced: `auth_users`, `auth_session`.
- Never store secrets in source code.
- Passwords in localStorage are acceptable for this demo only — document as non-production.

## Errors

- Validation functions return `string | null` — `null` means success, string is user-facing message.
- Normalize email: trim + lowercase before compare/store.
- Guard JSON parse with try/catch; return safe defaults on corrupt data.

## CSS

- CSS variables for colors and spacing.
- Mobile-first; max-width card layout.
- No inline styles in HTML.
