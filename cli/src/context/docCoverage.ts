import { access } from "node:fs/promises";
import { join } from "node:path";
import { constants } from "node:fs";
import { globMatch } from "../utils/glob.js";
import type { ReviewMapping } from "./docMapper.js";

export type DocCoverageType = "unmapped" | "missing_readme" | "docs_not_staged";

export interface DocCoverageIssue {
  type: DocCoverageType;
  file: string;
  docsDir?: string;
  message: string;
}

const SKIP_UNMAPPED_CHECK = [
  /^docs\/reviews\//,
  /^docs\/ai-review\//,
  /^docs\/project-rules\//,
  /^\.husky\//,
  /^cli\//,
  /^dist-cli\//,
  /^node_modules\//,
  /^dist\//,
  /^package-lock\.json$/,
  /^review-mapping\.json$/,
];

function isInfrastructurePath(file: string): boolean {
  return SKIP_UNMAPPED_CHECK.some((pattern) => pattern.test(file));
}

function findDocsDir(file: string, mapping: ReviewMapping): string | null {
  for (const entry of mapping.mappings) {
    if (globMatch(file, entry.pattern)) {
      return entry.docs;
    }
  }
  return null;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isUnderDocs(dir: string, stagedFile: string): boolean {
  const prefix = dir.endsWith("/") ? dir : `${dir}/`;
  return stagedFile === dir || stagedFile.startsWith(prefix);
}

export async function checkDocCoverage(
  rootDir: string,
  stagedFiles: string[],
  mapping: ReviewMapping
): Promise<DocCoverageIssue[]> {
  const issues: DocCoverageIssue[] = [];
  const stagedSet = new Set(stagedFiles);

  for (const file of stagedFiles) {
    if (isInfrastructurePath(file)) {
      continue;
    }

    const docsDir = findDocsDir(file, mapping);

    if (!docsDir) {
      if (!file.startsWith("docs/")) {
        issues.push({
          type: "unmapped",
          file,
          message: `No mapping in review-mapping.json for ${file}`,
        });
      }
      continue;
    }

    const readmePath = join(rootDir, docsDir, "README.md");
    const hasReadme = await fileExists(readmePath);

    if (!hasReadme) {
      issues.push({
        type: "missing_readme",
        file,
        docsDir,
        message: `${docsDir}/README.md missing — create feature doc`,
      });
      continue;
    }

    const readmeStaged = [...stagedSet].some((staged) =>
      isUnderDocs(docsDir, staged)
    );

    const isCodeFile = !file.startsWith("docs/");
    if (isCodeFile && !readmeStaged) {
      issues.push({
        type: "docs_not_staged",
        file,
        docsDir,
        message: `${file} staged but ${docsDir}/ not updated in this commit`,
      });
    }
  }

  return issues;
}

export function formatDocCoverageAlerts(issues: DocCoverageIssue[]): string {
  if (issues.length === 0) {
    return "";
  }

  const lines = ["--- Doc coverage alerts ---\n"];

  for (const issue of issues) {
    lines.push(`  [${issue.type}] ${issue.message}`);
  }

  lines.push(
    "\nFix docs/mapping or run /commit-review with your agent before committing.\n"
  );

  return lines.join("\n");
}
