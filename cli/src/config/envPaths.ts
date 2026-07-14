/** Dedicated env files for jti-ai-review (Sentry-style — never touches consumer .env). */
export const JTI_ENV_FILE = ".env.jti-ai-review";
export const JTI_ENV_EXAMPLE_FILE = ".env.jti-ai-review.example";
export const JTI_ENV_LOCAL_FILE = ".env.jti-ai-review.local";

/** Load order: consumer env first, then jti-ai-review overrides. */
export const ENV_LOAD_ORDER = [
  ".env",
  ".env.local",
  JTI_ENV_FILE,
  JTI_ENV_LOCAL_FILE,
] as const;

export function envSetupHint(): string {
  return `Add it to ${JTI_ENV_FILE} or run: npm run ai-review:init`;
}
