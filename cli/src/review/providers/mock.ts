import type { ReviewContext, ReviewProvider, ReviewResult } from "../types.js";
import { applySeverityCap } from "../parseResult.js";

function hasAuthChanges(context: ReviewContext): boolean {
  return context.changedFiles.some((file) => file.includes("auth"));
}

function extractPreviousIssues(previousReview: string | null): string[] {
  if (!previousReview) {
    return [];
  }

  const issues: string[] = [];
  const lines = previousReview.split("\n");
  let inIssues = false;

  for (const line of lines) {
    if (line.startsWith("## Issues")) {
      inIssues = true;
      continue;
    }
    if (inIssues && line.startsWith("## ")) {
      break;
    }
    if (inIssues && line.startsWith("- **")) {
      issues.push(line.replace(/^- \*\*[^*]+\*\* — /, "").trim());
    }
  }

  return issues;
}

export const mockProvider: ReviewProvider = {
  name: "mock",

  async review(context: ReviewContext): Promise<ReviewResult> {
    const authTouched = hasAuthChanges(context);
    const storesPasswords = context.diff.includes("localStorage");
    const hasValidation =
      context.diff.includes("isValidEmail") ||
      context.diff.includes("isValidPassword");
    const previousIssues = extractPreviousIssues(context.previousReview);

    const issues: ReviewResult["issues"] = [];

    if (storesPasswords) {
      issues.push({
        severity: "high",
        file: "src/auth.ts",
        message:
          "Passwords stored in plain text in localStorage — acceptable for demo, not production.",
      });
    }

    if (authTouched && !hasValidation && context.changedFiles.includes("src/auth.ts")) {
      issues.push({
        severity: "critical",
        file: "src/auth.ts",
        message: "Auth changes without visible validation updates.",
      });
    }

    if (context.changedFiles.length > 0 && Object.keys(context.featureDocs).length === 0) {
      issues.push({
        severity: "medium",
        message: "Changed files have no mapped feature documentation.",
      });
    }

    if (issues.length === 0) {
      issues.push({
        severity: "low",
        message: "No significant issues detected by mock reviewer.",
      });
    }

    const security = storesPasswords ? 6 : 8;
    const documentation = Object.keys(context.featureDocs).length > 0 ? 8 : 5;

    const categories = {
      architecture: 8,
      maintainability: 8,
      typeSafety: 7,
      documentation,
      testing: 3,
      performance: 9,
      security,
    };

    const overallScore = Number(
      (
        (categories.architecture +
          categories.maintainability +
          categories.typeSafety +
          categories.documentation +
          categories.testing +
          categories.performance +
          categories.security) /
        7
      ).toFixed(1)
    );

    const resolved: string[] = [];
    const unresolved: string[] = [];
    const partiallyResolved: string[] = [];

    for (const issue of previousIssues) {
      if (issue.toLowerCase().includes("plain text") && hasValidation) {
        partiallyResolved.push(issue);
      } else if (context.diff.length > 100) {
        resolved.push(issue);
      } else {
        unresolved.push(issue);
      }
    }

    return applySeverityCap({
      overallScore,
      categories,
      issues,
      improvements: [
        "Add unit tests for email/password validation.",
        "Hash passwords before storing, even in demo mode.",
        "Extract localStorage access behind a small storage adapter.",
      ],
      previousReviewResolved:
        previousIssues.length > 0
          ? { resolved, unresolved, partiallyResolved }
          : undefined,
    });
  },
};
