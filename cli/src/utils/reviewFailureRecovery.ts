export const REVIEW_FAILURE_RECOVERY = `What to do next:

  • Skip review for this commit (reviewer failed or you want to save tokens):
      git no-review -m "your message"

  • Disable pre-commit review on this machine — edit .env.jti-ai-review:
      AI_REVIEW_ENABLED=false

  Then run git commit as usual — the hook will not call the reviewer.`;

export function hasReviewFailureRecovery(message: string): boolean {
  return message.includes("What to do next:");
}

export function formatReviewFailureError(detail: string): string {
  if (hasReviewFailureRecovery(detail)) {
    return detail;
  }
  return `${detail}\n\n${REVIEW_FAILURE_RECOVERY}`;
}
