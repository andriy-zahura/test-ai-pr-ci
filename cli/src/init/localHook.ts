import { access, chmod, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { PRE_COMMIT_HOOK_CONTENT } from "./templates.js";
import { GIT_ALIASES } from "./gitAliases.js";
import { spawnSync } from "node:child_process";
import { mergeEnvContent } from "./envMerge.js";
import { JTI_ENV_FILE } from "../config/envPaths.js";

const HOOK_PATH = ".husky/pre-commit";
const HOOK_MARKER = "ai-review";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function isOurPreCommitHook(rootDir: string): Promise<boolean> {
  const hookPath = join(rootDir, HOOK_PATH);
  if (!(await exists(hookPath))) {
    return false;
  }

  const content = await readFile(hookPath, "utf8");
  return content.includes(HOOK_MARKER);
}

export async function installLocalPreCommitHook(
  rootDir: string,
  force: boolean
): Promise<"created" | "skipped" | "overwritten"> {
  const hookPath = join(rootDir, HOOK_PATH);
  const hookExists = await exists(hookPath);

  if (hookExists && !force) {
    const ours = await isOurPreCommitHook(rootDir);
    return ours ? "skipped" : "skipped";
  }

  await mkdir(join(rootDir, ".husky"), { recursive: true });
  await writeFile(hookPath, PRE_COMMIT_HOOK_CONTENT, "utf8");
  await chmod(hookPath, 0o755);

  return hookExists ? "overwritten" : "created";
}

async function removeGitAliases(rootDir: string): Promise<void> {
  for (const alias of GIT_ALIASES) {
    spawnSync("git", ["config", "--local", "--unset-all", `alias.${alias.name}`], {
      cwd: rootDir,
      encoding: "utf8",
    });
  }
  spawnSync("git", ["config", "--local", "--unset-all", "alias.wip"], {
    cwd: rootDir,
    encoding: "utf8",
  });
}

async function disableEnvReview(rootDir: string): Promise<void> {
  const envPath = join(rootDir, JTI_ENV_FILE);
  if (!(await exists(envPath))) {
    return;
  }

  const existing = await readFile(envPath, "utf8");
  const merged = mergeEnvContent(existing, { AI_REVIEW_ENABLED: "false" });
  if (merged !== existing) {
    await writeFile(envPath, merged, "utf8");
  }
}

export async function disableLocalReview(rootDir: string): Promise<boolean> {
  const hadHook = await isOurPreCommitHook(rootDir);
  const hadEnv = await exists(join(rootDir, JTI_ENV_FILE));

  if (hadHook) {
    await unlink(join(rootDir, HOOK_PATH));
  }

  await removeGitAliases(rootDir);

  if (hadEnv) {
    await disableEnvReview(rootDir);
  }

  return hadHook || hadEnv;
}
