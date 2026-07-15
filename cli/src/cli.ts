#!/usr/bin/env node
import { spawn } from "node:child_process";
import { openSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ReadStream } from "node:tty";
import { Command } from "commander";
import { buildContext } from "./context/buildContext.js";
import {
  checkDocCoverage,
  formatDocCoverageAlerts,
} from "./context/docCoverage.js";
import { loadMapping } from "./context/docMapper.js";
import { loadEnv, resolveDefaultProvider } from "./config/loadEnv.js";
import {
  resolveReviewSettings,
  type ReviewRunOptions,
} from "./config/reviewSettings.js";
import { normalizeProviderName } from "./config/providerConfig.js";
import { runInit, printInitResult } from "./init/scaffold.js";
import { runIsolatedReview } from "./review/spawnReview.js";
import { saveReport } from "./report/saveReport.js";
import { listProviders } from "./review/reviewer.js";
import type { ReviewResult } from "./review/types.js";
import {
  canPromptPreReview,
  promptPreReview,
} from "./utils/preReviewPrompt.js";
import { formatReviewFailureError } from "./utils/reviewFailureRecovery.js";

function shouldSkipReview(settings: { skipReview: boolean }): boolean {
  return settings.skipReview;
}

function printSummary(result: ReviewResult, reportPath?: string): void {
  console.log("\n--- AI Pre-Commit Review ---\n");
  console.log(`Overall score: ${result.overallScore}/10`);
  console.log(`Issues: ${result.issues.length}`);
  if (reportPath) {
    console.log(`Report: ${reportPath}`);
  }
  console.log("");

  for (const issue of result.issues) {
    const location = issue.file ? ` (${issue.file})` : "";
    console.log(`  [${issue.severity}]${location} ${issue.message}`);
  }

  console.log("");
}

function openFile(filePath: string): void {
  const platform = process.platform;
  const command =
    platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  const args = platform === "win32" ? ["", filePath] : [filePath];

  spawn(command, args, { detached: true, stdio: "ignore" }).unref();
}

function createPromptInterface() {
  if (input.isTTY) {
    return createInterface({ input, output, terminal: true });
  }

  if (process.platform === "win32") {
    throw new Error(
      "Interactive prompt requires a TTY. Run: npm run ai-review"
    );
  }

  const ttyFd = openSync("/dev/tty", "r");
  const ttyInput = new ReadStream(ttyFd);

  return createInterface({
    input: ttyInput,
    output,
    terminal: true,
  });
}

function getRootDir(): string {
  return process.cwd();
}

async function promptAction(reportPath?: string): Promise<"commit" | "cancel"> {
  const rl = createPromptInterface();
  const prompt = reportPath
    ? "[P] Commit anyway  [R] Open review  [C] Cancel commit\n> "
    : "[P] Commit anyway  [C] Cancel commit\n> ";

  try {
    while (true) {
      const answer = (await rl.question(prompt)).trim().toLowerCase();

      if (!answer) {
        console.log(reportPath ? "Choose P, R, or C." : "Choose P or C.");
        continue;
      }

      if (answer === "p" || answer === "commit") {
        return "commit";
      }

      if (answer === "c" || answer === "cancel") {
        return "cancel";
      }

      if (answer === "r" || answer === "open") {
        if (!reportPath) {
          console.log("No report file (saveReport is off). Issues are in terminal above.");
          continue;
        }
        openFile(reportPath);
        console.log(`Opened ${reportPath}`);
        continue;
      }

      console.log(reportPath ? "Choose P, R, or C." : "Choose P or C.");
    }
  } finally {
    rl.close();
  }
}

async function runReview(
  provider: string,
  options: ReviewRunOptions = {}
): Promise<void> {
  const rootDir = getRootDir();
  const settings = await resolveReviewSettings(rootDir, options);

  if (!settings.enabled) {
    console.log("AI review disabled (AI_REVIEW_ENABLED=false in .env.jti-ai-review).");
    process.exit(0);
  }

  console.log("Building review context (staged changes)...");
  const context = await buildContext(rootDir);

  if (context.changedFiles.length === 0) {
    console.log("No staged changes to review.");
    process.exit(0);
  }

  if (shouldSkipReview(settings)) {
    console.log("Review skipped.");
    process.exit(0);
  }

  if (!settings.autoRun && canPromptPreReview()) {
    const choice = await promptPreReview();
    if (choice === "skip") {
      console.log("Review skipped.");
      process.exit(0);
    }
  }

  const mapping = await loadMapping(rootDir);
  const docIssues = await checkDocCoverage(
    rootDir,
    context.changedFiles,
    mapping
  );
  const docAlerts = formatDocCoverageAlerts(docIssues);
  if (docAlerts) {
    console.log(docAlerts);
  }

  console.log(
    `Staged: ${context.changedFiles.length} file(s). Starting isolated ${provider} review...`
  );

  const result = await runIsolatedReview(provider, context);

  let reportPath: string | undefined;
  if (settings.saveReport) {
    reportPath = await saveReport(rootDir, result, context);
  }

  printSummary(result, reportPath);

  const action = await promptAction(reportPath);
  process.exit(action === "commit" ? 0 : 1);
}

const program = new Command();

program
  .name("ai-review")
  .description("Local AI pre-commit review pipeline")
  .version("0.1.0");

program
  .command("init")
  .description("Scaffold review config, agent docs, and pre-commit hook")
  .option("--force", "overwrite existing scaffold files")
  .option("--skip-prompt", "skip interactive API key prompt")
  .action(async (options: { force?: boolean; skipPrompt?: boolean }) => {
    try {
      await loadEnv(getRootDir());
      const result = await runInit(getRootDir(), Boolean(options.force), {
        skipPrompt: Boolean(options.skipPrompt),
      });
      printInitResult(result);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("run")
  .description("Review staged changes before commit")
  .option("--provider <name>", "review provider (default: .env.jti-ai-review or mock)")
  .option("--skip", "skip AI review (no LLM call)")
  .option("--no-report", "do not write docs/reviews/*.md")
  .option("--report", "write report file (overrides saveReport: false)")
  .action(async (options: { provider?: string; skip?: boolean; noReport?: boolean; report?: boolean }) => {
    try {
      await loadEnv(getRootDir());
      const provider = normalizeProviderName(
        options.provider ?? resolveDefaultProvider()
      );

      if (!listProviders().includes(provider)) {
        throw new Error(
          `Unknown provider "${provider}". Available: ${listProviders().join(", ")}`
        );
      }
      await runReview(provider, {
        skip: Boolean(options.skip),
        noReport: Boolean(options.noReport),
        report: Boolean(options.report),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error(formatReviewFailureError(detail));
      process.exit(1);
    }
  });

program.parse();
