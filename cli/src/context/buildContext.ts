import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { simpleGit } from "simple-git";
import { loadMapping, resolveDocDirs } from "./docMapper.js";
import type { ReviewContext } from "../review/types.js";

async function readDirMarkdown(dirPath: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  let entries: string[];
  try {
    entries = await readdir(dirPath);
  } catch {
    return result;
  }

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const info = await stat(fullPath);

    if (info.isDirectory()) {
      const nested = await readDirMarkdown(fullPath);
      for (const [nestedPath, content] of Object.entries(nested)) {
        result[nestedPath] = content;
      }
      continue;
    }

    if (info.isFile() && (entry.endsWith(".md") || entry.endsWith(".json"))) {
      result[fullPath] = await readFile(fullPath, "utf8");
    }
  }

  return result;
}

async function getLatestReview(reviewsDir: string): Promise<string | null> {
  let entries: string[];
  try {
    entries = await readdir(reviewsDir);
  } catch {
    return null;
  }

  const reports = entries
    .filter((name) => name.endsWith(".md") && name !== ".gitkeep")
    .sort()
    .reverse();

  if (reports.length === 0) {
    return null;
  }

  return readFile(join(reviewsDir, reports[0]), "utf8");
}

async function getStagedChanges(rootDir: string): Promise<{
  changedFiles: string[];
  diff: string;
}> {
  const git = simpleGit(rootDir);
  const diff = await git.diff(["--cached"]);
  const summary = await git.diffSummary(["--cached"]);
  const changedFiles = summary.files.map((file: { file: string }) => file.file);

  return { changedFiles, diff };
}

export async function buildContext(rootDir: string): Promise<ReviewContext> {
  const mapping = await loadMapping(rootDir);
  const { changedFiles, diff } = await getStagedChanges(rootDir);
  const docDirs = resolveDocDirs(changedFiles, mapping);

  const projectRules: Record<string, string> = {};
  const featureDocs: Record<string, string> = {};

  for (const dir of docDirs) {
    const absDir = join(rootDir, dir);
    const files = await readDirMarkdown(absDir);

    const bucket = dir.includes("project-rules") ? projectRules : featureDocs;
    for (const [filePath, content] of Object.entries(files)) {
      bucket[filePath] = content;
    }
  }

  let metadata: Record<string, unknown> = {};
  try {
    const pkgRaw = await readFile(join(rootDir, "package.json"), "utf8");
    metadata = JSON.parse(pkgRaw) as Record<string, unknown>;
  } catch {
    metadata = {};
  }

  const previousReview = await getLatestReview(join(rootDir, "docs/reviews"));

  return {
    generatedAt: new Date().toISOString(),
    changedFiles,
    diff: diff || "(no staged diff)",
    projectRules,
    featureDocs,
    metadata,
    previousReview,
  };
}
