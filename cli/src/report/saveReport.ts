import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { formatReport } from "./formatReport.js";
import type { ReviewContext, ReviewResult } from "../review/types.js";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function reviewTimestamp(now = new Date()): { day: string; time: string } {
  const day = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-");

  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}`;

  return { day, time };
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
  const { day, time } = reviewTimestamp();
  const dayDir = join(rootDir, "docs/reviews", day);
  await mkdir(dayDir, { recursive: true });

  const filePath = join(dayDir, `${time}.md`);
  const markdown = formatReport(result, contextSummary(context));

  await writeFile(filePath, markdown, "utf8");
  return filePath;
}
