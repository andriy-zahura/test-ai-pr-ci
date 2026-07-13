import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { formatReport } from "./formatReport.js";
import type { ReviewContext, ReviewResult } from "../review/types.js";

function timestamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-") + `_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

function contextSummary(context: ReviewContext): string {
  const rules = Object.keys(context.projectRules);
  const docs = Object.keys(context.featureDocs);

  return [
    `Generated: ${context.generatedAt}`,
    `Changed files: ${context.changedFiles.length}`,
    context.changedFiles.map((file) => `- ${file}`).join("\n"),
    `Project rules loaded: ${rules.length}`,
    `Feature docs loaded: ${docs.length}`,
    `Diff size: ${context.diff.length} chars`,
    `Previous review: ${context.previousReview ? "yes" : "no"}`,
  ].join("\n\n");
}

export async function saveReport(
  rootDir: string,
  result: ReviewResult,
  context: ReviewContext
): Promise<string> {
  const reviewsDir = join(rootDir, "docs/reviews");
  await mkdir(reviewsDir, { recursive: true });

  const fileName = `${timestamp()}.md`;
  const filePath = join(reviewsDir, fileName);
  const markdown = formatReport(result, contextSummary(context));

  await writeFile(filePath, markdown, "utf8");
  return filePath;
}
