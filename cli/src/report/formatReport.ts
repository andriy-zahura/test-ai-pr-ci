import type { ReviewResult } from "../review/types.js";

function formatCategories(result: ReviewResult): string {
  const rows = Object.entries(result.categories).map(([key, value]) => {
    const label = key.replace(/([A-Z])/g, " $1").trim();
    const title = label.charAt(0).toUpperCase() + label.slice(1);
    return `| ${title} | ${value}/10 |`;
  });

  return ["| Category | Score |", "| --- | --- |", ...rows].join("\n");
}

function formatIssues(result: ReviewResult): string {
  if (result.issues.length === 0) {
    return "_No issues found._";
  }

  return result.issues
    .map((issue) => {
      const location = issue.file ? ` (${issue.file})` : "";
      return `- **${issue.severity}**${location} — ${issue.message}`;
    })
    .join("\n");
}

function formatPreviousResolution(result: ReviewResult): string {
  const prev = result.previousReviewResolved;
  if (!prev) {
    return "_No previous review._";
  }

  const section = (title: string, items: string[]) => {
    if (items.length === 0) {
      return `### ${title}\n\n_None._`;
    }
    return `### ${title}\n\n${items.map((item) => `- ${item}`).join("\n")}`;
  };

  return [
    section("Resolved", prev.resolved),
    section("Partially resolved", prev.partiallyResolved),
    section("Unresolved", prev.unresolved),
  ].join("\n\n");
}

export function formatReport(result: ReviewResult, contextSummary: string): string {
  const improvements =
    result.improvements.length > 0
      ? result.improvements.map((item) => `- ${item}`).join("\n")
      : "_None._";

  return `# AI Pre-Push Review

**Overall score:** ${result.overallScore}/10

## Category scores

${formatCategories(result)}

## Issues

${formatIssues(result)}

## Suggested improvements

${improvements}

## Previous review follow-up

${formatPreviousResolution(result)}

---

<details>
<summary>Review context summary</summary>

${contextSummary}

</details>
`;
}
