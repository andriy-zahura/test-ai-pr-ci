import type {
  CategoryScores,
  IssueSeverity,
  ReviewIssue,
  ReviewResult,
} from "./types.js";

const SEVERITIES = new Set<IssueSeverity>(["low", "medium", "high", "critical"]);

const CATEGORY_KEYS: (keyof CategoryScores)[] = [
  "architecture",
  "maintainability",
  "typeSafety",
  "documentation",
  "testing",
  "performance",
  "security",
];

function clampScore(value: unknown): number {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return 0;
  }
  return Math.min(10, Math.max(0, num));
}

function parseSeverity(value: unknown): IssueSeverity {
  if (typeof value === "string" && SEVERITIES.has(value as IssueSeverity)) {
    return value as IssueSeverity;
  }
  return "medium";
}

export function extractJsonBlock(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    return fenced[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }

  return null;
}

export function applySeverityCap(result: ReviewResult): ReviewResult {
  const criticalCount = result.issues.filter(
    (issue) => issue.severity === "critical"
  ).length;
  const highCount = result.issues.filter((issue) => issue.severity === "high").length;

  let maxOverall = 10;
  if (criticalCount >= 2) {
    maxOverall = 2;
  } else if (criticalCount >= 1) {
    maxOverall = 3;
  } else if (highCount >= 2) {
    maxOverall = 4;
  } else if (highCount >= 1) {
    maxOverall = 5;
  }

  const capped = Math.min(result.overallScore, maxOverall);
  if (capped === result.overallScore) {
    return result;
  }

  return { ...result, overallScore: capped };
}

export function parseReviewResult(raw: string): ReviewResult {
  const jsonBlock = extractJsonBlock(raw);

  if (!jsonBlock) {
    const preview = raw.trim().slice(0, 120).replace(/\s+/g, " ");
    throw new Error(
      `Review response is not JSON (got: "${preview}..."). ` +
        "The model must return a JSON object matching the review schema."
    );
  }

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(jsonBlock) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid JSON";
    throw new Error(`Review response contains invalid JSON: ${message}`);
  }

  const categories = {} as CategoryScores;
  const rawCategories =
    typeof parsed.categories === "object" && parsed.categories !== null
      ? (parsed.categories as Record<string, unknown>)
      : {};

  for (const key of CATEGORY_KEYS) {
    categories[key] = clampScore(rawCategories[key]);
  }

  const issues: ReviewIssue[] = Array.isArray(parsed.issues)
    ? parsed.issues.map((item) => {
        const issue = item as Record<string, unknown>;
        return {
          severity: parseSeverity(issue.severity),
          file: typeof issue.file === "string" ? issue.file : undefined,
          message:
            typeof issue.message === "string" ? issue.message : "Unspecified issue",
        };
      })
    : [];

  const improvements = Array.isArray(parsed.improvements)
    ? parsed.improvements.filter((item): item is string => typeof item === "string")
    : [];

  const prev = parsed.previousReviewResolved;
  let previousReviewResolved: ReviewResult["previousReviewResolved"];

  if (typeof prev === "object" && prev !== null) {
    const p = prev as Record<string, unknown>;
    previousReviewResolved = {
      resolved: Array.isArray(p.resolved)
        ? p.resolved.filter((item): item is string => typeof item === "string")
        : [],
      unresolved: Array.isArray(p.unresolved)
        ? p.unresolved.filter((item): item is string => typeof item === "string")
        : [],
      partiallyResolved: Array.isArray(p.partiallyResolved)
        ? p.partiallyResolved.filter((item): item is string => typeof item === "string")
        : [],
    };
  }

  return applySeverityCap({
    overallScore: clampScore(parsed.overallScore),
    categories,
    issues,
    improvements,
    previousReviewResolved,
  });
}
