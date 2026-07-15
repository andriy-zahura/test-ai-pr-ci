import { simpleGit } from "simple-git";
import { GIT_CONFIG_KEYS } from "./reviewGitConfig.js";

function parseBool(value: string | undefined): boolean | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

async function readGitConfigBool(key: string): Promise<boolean | undefined> {
  try {
    const git = simpleGit();
    const value = (await git.raw(["config", "--get", key])).trim();
    return parseBool(value);
  } catch {
    return undefined;
  }
}

async function readGitConfigBoolAny(keys: readonly string[]): Promise<boolean | undefined> {
  for (const key of keys) {
    const value = await readGitConfigBool(key);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function firstBool(...values: Array<boolean | undefined>): boolean | undefined {
  for (const value of values) {
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

export interface ReviewRunSettings {
  enabled: boolean;
  skipReview: boolean;
  saveReport: boolean;
  autoRun: boolean;
}

export interface ReviewRunOptions {
  skip?: boolean;
  noReport?: boolean;
  report?: boolean;
}

export async function resolveReviewSettings(
  _rootDir: string,
  options: ReviewRunOptions = {}
): Promise<ReviewRunSettings> {
  const gitEnabled = await readGitConfigBoolAny(GIT_CONFIG_KEYS.enabled);
  const gitSaveReport = await readGitConfigBoolAny(GIT_CONFIG_KEYS.saveReport);
  const gitSkipReview = await readGitConfigBoolAny(GIT_CONFIG_KEYS.skipReview);
  const gitNoReport = await readGitConfigBoolAny(GIT_CONFIG_KEYS.noReport);

  const envEnabled = parseBool(process.env.AI_REVIEW_ENABLED);
  const envSkipReview = parseBool(process.env.AI_REVIEW_SKIP);
  const envSaveReport = parseBool(process.env.AI_REVIEW_SAVE_REPORT);
  const envNoReport = parseBool(process.env.AI_REVIEW_NO_REPORT);

  const envAutoRun = parseBool(process.env.AI_REVIEW_AUTO_RUN);

  const cliSkip = options.skip ? true : undefined;
  const cliSaveReport = options.report
    ? true
    : options.noReport
      ? false
      : undefined;

  const skipReview =
    firstBool(cliSkip, gitSkipReview, envSkipReview) ?? false;

  let saveReport = firstBool(
    cliSaveReport,
    gitNoReport === true ? false : undefined,
    gitSaveReport,
    envNoReport === true ? false : undefined,
    envSaveReport
  );

  if (saveReport === undefined) {
    saveReport = false;
  }

  const enabled = firstBool(gitEnabled, envEnabled) ?? true;
  const autoRun = envAutoRun ?? false;

  return {
    enabled,
    skipReview,
    saveReport,
    autoRun,
  };
}
