import { spawnSync } from "node:child_process";
import { simpleGit } from "simple-git";

export interface GitAliasDefinition {
  name: string;
  command: string;
  description: string;
}

export const GIT_ALIASES: GitAliasDefinition[] = [
  {
    name: "no-review",
    command: "!AI_REVIEW_SKIP=1 git commit",
    description: "commit, skip AI review",
  },
  {
    name: "commit-report",
    command: "!AI_REVIEW_SAVE_REPORT=1 git commit",
    description: "commit + save report file",
  },
];

const MARKER_ALIAS = "no-review";

async function isGitRepo(rootDir: string): Promise<boolean> {
  try {
    const git = simpleGit(rootDir);
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}

async function getLocalAlias(
  rootDir: string,
  name: string
): Promise<string | undefined> {
  try {
    const git = simpleGit(rootDir);
    const value = (await git.raw(["config", "--local", "--get", `alias.${name}`])).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

function setLocalAlias(rootDir: string, name: string, command: string): void {
  const result = spawnSync(
    "git",
    ["config", "--local", `alias.${name}`, command],
    { cwd: rootDir, encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() || `Failed to set git alias "${name}"`
    );
  }
}

async function removeLegacyAlias(rootDir: string, name: string): Promise<void> {
  spawnSync("git", ["config", "--local", "--unset-all", `alias.${name}`], {
    cwd: rootDir,
    encoding: "utf8",
  });
}

export async function patchGitAliases(
  rootDir: string,
  force: boolean
): Promise<{ status: "created" | "skipped" | "overwritten"; aliases: string[] }> {
  if (!(await isGitRepo(rootDir))) {
    return { status: "skipped", aliases: [] };
  }

  const marker = await getLocalAlias(rootDir, MARKER_ALIAS);
  const ours = GIT_ALIASES.find((alias) => alias.name === MARKER_ALIAS)?.command;

  if (marker && marker === ours && !force) {
    return { status: "skipped", aliases: GIT_ALIASES.map((alias) => alias.name) };
  }

  const status = marker ? "overwritten" : "created";

  await removeLegacyAlias(rootDir, "wip");
  await removeLegacyAlias(rootDir, "commit-nr");

  for (const alias of GIT_ALIASES) {
    setLocalAlias(rootDir, alias.name, alias.command);
  }

  return {
    status,
    aliases: GIT_ALIASES.map((alias) => alias.name),
  };
}

export function formatGitAliasHelp(): string {
  return GIT_ALIASES.map(
    (alias) => `  git ${alias.name} -m "..."   # ${alias.description}`
  ).join("\n");
}
