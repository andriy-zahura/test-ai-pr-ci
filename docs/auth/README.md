# Auth Feature

Client-only authentication demo. No backend. Credentials stored in `localStorage`.

## Pages

| Page          | File           | Purpose                          |
|---------------|----------------|----------------------------------|
| Login / Sign up | `index.html` | Toggle between login and sign-up |
| Success       | `success.html` | Protected page after auth        |

## Files

| File              | Role                                      |
|-------------------|-------------------------------------------|
| `src/auth.ts`     | Validation, user store, session management |
| `src/login.ts`    | Login/sign-up form wiring                 |
| `src/success.ts`  | Session guard + logout                    |

## User flows

### Sign up

1. User switches to sign-up mode.
2. Enters email + password.
3. System validates:
   - Email matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Password length ≥ 8
4. Email normalized: trim + lowercase.
5. Rejects duplicate email.
6. Stores `{ [email]: password }` in `auth_users`.
7. Creates session in `auth_session`.
8. Redirects to `success.html`.

### Login

1. User enters email + password.
2. Same email/password validation as sign-up.
3. Looks up email in `auth_users`.
4. Compares password (plain text — demo only).
5. On match: create session, redirect to `success.html`.
6. On failure: show error message.

### Session guard

- `index.html`: if session exists → redirect to `success.html`.
- `success.html`: if no session → redirect to `index.html`.

### Logout

1. User clicks "Log out".
2. `auth_session` removed from localStorage.
3. Redirect to `index.html`.

## localStorage keys

| Key            | Shape                                      |
|----------------|--------------------------------------------|
| `auth_users`   | `Record<string, string>` — email → password |
| `auth_session` | `{ email: string, loggedInAt: string }`    |

## Validation messages

| Condition            | Message                              |
|----------------------|--------------------------------------|
| Invalid email        | Enter a valid email address.         |
| Short password       | Password must be at least 8 characters. |
| Duplicate sign-up    | An account with this email already exists. |
| Unknown email        | No account found for this email.     |
| Wrong password       | Incorrect password.                  |

## Non-goals (MVP)

- No password hashing
- No server-side auth
- No refresh tokens
- No "remember me"
- No password reset

## Expected reviewer focus

- Validation matches spec above
- Session guards on both pages
- Errors shown in UI, not `alert()`
- No `innerHTML` with user input
