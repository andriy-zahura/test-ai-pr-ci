import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReviewContext } from "./types.js";

function formatDocSection(title: string, docs: Record<string, string>): string {
  const entries = Object.entries(docs);
  if (entries.length === 0) {
    return `${title}\n(none)\n`;
  }

  return (
    `${title}\n` +
    entries.map(([path, content]) => `### ${path}\n${content}`).join("\n\n")
  );
}

async function loadSystemPrompt(): Promise<string> {
  const path = join(
    dirname(fileURLToPath(import.meta.url)),
    "../prompt/systemPrompt.md"
  );
  return readFile(path, "utf8");
}

export async function buildReviewPrompt(context: ReviewContext): Promise<{
  system: string;
  user: string;
}> {
  const system = await loadSystemPrompt();

  const user = [
    "## Changed files",
    context.changedFiles.map((file) => `- ${file}`).join("\n"),
    "",
    "## Git diff (staged)",
    context.diff,
    "",
    formatDocSection("## Project rules", context.projectRules),
    "",
    formatDocSection("## Feature documentation", context.featureDocs),
    "",
    "## Project metadata",
    "```json",
    JSON.stringify(context.metadata, null, 2),
    "```",
    "",
    context.previousReview
      ? `## Previous review\n${context.previousReview}`
      : "## Previous review\n(none)",
  ].join("\n");

  return { system, user };
}
