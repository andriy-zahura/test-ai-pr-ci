# Clock

Live clock on the auth success page. Updates every second.

## Scope

Success-page clock display only. No timezone picker, no alarms, no server time sync.

## Files

| File | Role |
|------|------|
| `src/clock.ts` | Format + mount live clock |
| `src/success.ts` | Mounts clock after session guard |
| `success.html` | `page-success` body class for layout |
| `src/styles.css` | `.clock` styling via theme tokens |

## User flows

### Success page load

1. User lands on `success.html` with valid session.
2. `mountClock()` appends `<time class="clock">` to `body`.
3. Clock shows current local time, format `Mon 13 Jul 15:13:22`.
4. Text updates every 1000 ms until page unload.

## Format rules

| Segment | Rule | Example |
|---------|------|---------|
| Weekday | Short English (`en-GB`) | `Mon` |
| Day | 1–31, no leading zero | `13` |
| Month | Short English (`en-GB`) | `Jul` |
| Time | 24h `HH:mm:ss`, zero-padded | `15:13:22` |

## UI contract

| Element | Requirement |
|---------|-------------|
| Tag | `<time class="clock">` |
| Position | Viewport center (fixed) |
| Color | `var(--text)` — follows light/dark theme |
| `datetime` | ISO 8601, updated each tick |
| `aria-live` | `off` (avoid screen-reader spam) |

## Non-goals

- No timezone selection
- No date picker
- No clock on login page

## Reviewer focus

- Format matches `Mon 13 Jul 15:13:22`
- 1 s interval cleared on unmount (if used)
- Uses theme CSS variable, not hardcoded color
- Only mounted on authenticated success page
