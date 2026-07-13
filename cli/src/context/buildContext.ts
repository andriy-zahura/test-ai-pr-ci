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

async function diffForRange(
  git: ReturnType<typeof simpleGit>,
  range: string
): Promise<{ changedFiles: string[]; diff: string }> {
  const diff = await git.diff([range]);
  const summary = await git.diffSummary([range]);
  const changedFiles = summary.files.map((file: { file: string }) => file.file);

  return { changedFiles, diff };
}

async function getUnpushedRange(
  git: ReturnType<typeof simpleGit>
): Promise<string | null> {
  try {
    const log = await git.log(["@{u}..HEAD", "--oneline"]);
    if (log.total === 0) {
      return null;
    }

    const upstream = await git.revparse(["@{u}"]);
    const head = await git.revparse(["HEAD"]);
    return `${upstream}..${head}`;
  } catch {
    return null;
  }
}

async function getGitChanges(rootDir: string): Promise<{
  changedFiles: string[];
  diff: string;
}> {
  const git = simpleGit(rootDir);

  const pushRange = process.env.AI_REVIEW_RANGE?.trim();
  if (pushRange) {
    try {
      const result = await diffForRange(git, pushRange);
      if (result.diff.trim().length > 0 || result.changedFiles.length > 0) {
        return result;
      }
    } catch {
      // fall through to other strategies
    }
  }

  const unpushedRange = await getUnpushedRange(git);
  if (unpushedRange) {
    try {
      const result = await diffForRange(git, unpushedRange);
      if (result.diff.trim().length > 0 || result.changedFiles.length > 0) {
        return result;
      }
    } catch {
      // fall through
    }
  }

  const remotes = (await git.remote(["-v"])) ?? "";
  const hasOrigin = remotes.includes("origin");

  let diff = "";
  let changedFiles: string[] = [];

  const strategies = hasOrigin
    ? ["origin/main..HEAD", "origin/master..HEAD"]
    : ["main..HEAD", "master..HEAD"];

  for (const spec of strategies) {
    try {
      const result = await diffForRange(git, spec);
      if (result.diff.trim().length > 0 || result.changedFiles.length > 0) {
        return result;
      }
    } catch {
      continue;
    }
  }

  const status = await git.status();
  changedFiles = [
    ...new Set([
      ...status.modified,
      ...status.created,
      ...status.deleted,
      ...status.renamed.map((entry: { to: string }) => entry.to),
      ...status.staged,
    ]),
  ];
  diff = await git.diff(["HEAD"]);

  if (changedFiles.length === 0) {
    const staged = await git.diff(["--cached"]);
    if (staged) {
      diff = staged;
      changedFiles = status.staged;
    }
  }

  if (changedFiles.length === 0 && diff.trim().length === 0) {
    const untracked = status.not_added.filter(
      (file) =>
        !file.startsWith("node_modules/") &&
        !file.startsWith("dist/") &&
        !file.startsWith("dist-cli/")
    );

    if (untracked.length > 0) {
      changedFiles = untracked;
      const chunks: string[] = [];

      for (const file of untracked) {
        const content = await readFile(join(rootDir, file), "utf8").catch(() => "");
        chunks.push(`--- new file: ${file} ---\n${content}`);
      }

      diff = chunks.join("\n\n");
    }
  }

  return { changedFiles, diff };
}

export async function buildContext(rootDir: string): Promise<ReviewContext> {
  const mapping = await loadMapping(rootDir);
  const { changedFiles, diff } = await getGitChanges(rootDir);
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
    diff: diff || "(no diff detected)",
    projectRules,
    featureDocs,
    metadata,
    previousReview,
  };
}
