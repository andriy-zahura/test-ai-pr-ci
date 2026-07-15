/** Shorthand git config keys (git -c …) read by the pre-commit hook. */
export const GIT_CONFIG_KEYS = {
  enabled: ["ai-review.enabled"],
  skipReview: ["ai-review.skip", "ai-review.skipReview", "ai-review.no-review"],
  noReport: ["ai-review.no-report", "ai-review.noReport", "ai-review.noreport"],
  saveReport: ["ai-review.saveReport", "ai-review.report"],
} as const;
