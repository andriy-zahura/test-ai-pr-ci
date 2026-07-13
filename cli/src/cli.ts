import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Command } from "commander";
import { buildContext } from "./context/buildContext.js";
import { runIsolatedReview } from "./review/spawnReview.js";
import { saveReport } from "./report/saveReport.js";
import { listProviders } from "./review/reviewer.js";
import { parsePrePushStdin, readStdinAll } from "./utils/prePush.js";

function getRootDir(): string {
  return process.cwd();
}

function printSummary(
  result: Awaited<ReturnType<typeof runIsolatedReview>>,
  reportPath: string
): void {
  console.log("\n--- AI Pre-Push Review ---\n");
  console.log(`Overall score: ${result.overallScore}/10`);
  console.log(`Issues: ${result.issues.length}`);
  console.log(`Report: ${reportPath}\n`);

  for (const issue of result.issues.slice(0, 3)) {
    const location = issue.file ? ` (${issue.file})` : "";
    console.log(`  [${issue.severity}]${location} ${issue.message}`);
  }

  if (result.issues.length > 3) {
    console.log(`  ... +${result.issues.length - 3} more`);
  }

  console.log("");
}

function openFile(filePath: string): void {
  const platform = process.platform;
  const command = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  const args = platform === "win32" ? ["", filePath] : [filePath];

  spawn(command, args, { detached: true, stdio: "ignore" }).unref();
}

function createPromptInterface() {
  if (input.isTTY) {
    return createInterface({ input, output });
  }

  if (process.platform === "win32") {
    throw new Error(
      "Interactive prompt requires a TTY. Run: npm run ai-review"
    );
  }

  return createInterface({
    input: createReadStream("/dev/tty"),
    output,
  });
}

async function promptAction(reportPath: string): Promise<"push" | "cancel"> {
  const rl = createPromptInterface();

  try {
    while (true) {
      const answer = (
        await rl.question("[P] Push anyway  [R] Open review  [C] Cancel push\n> ")
      )
        .trim()
        .toLowerCase();

      if (!answer) {
        console.log("Choose P, R, or C.");
        continue;
      }

      if (answer === "p" || answer === "push") {
        return "push";
      }

      if (answer === "c" || answer === "cancel") {
        return "cancel";
      }

      if (answer === "r" || answer === "open") {
        openFile(reportPath);
        console.log(`Opened ${reportPath}`);
        continue;
      }

      console.log("Choose P, R, or C.");
    }
  } finally {
    rl.close();
  }
}

async function resolveReviewRange(): Promise<void> {
  if (process.env.AI_REVIEW_RANGE?.trim()) {
    return;
  }

  if (process.env.AI_REVIEW_PRE_PUSH !== "1") {
    return;
  }

  const stdin = await readStdinAll();
  const range = parsePrePushStdin(stdin);

  if (range) {
    process.env.AI_REVIEW_RANGE = range;
  }
}

async function runReview(provider: string): Promise<void> {
  const rootDir = getRootDir();

  await resolveReviewRange();

  console.log("Building review context...");
  const context = await buildContext(rootDir);

  if (context.changedFiles.length === 0) {
    console.log("No changed files detected. Skipping review.");
    process.exit(0);
  }

  console.log(
    `Changed: ${context.changedFiles.length} file(s). Starting isolated ${provider} review...`
  );

  const result = await runIsolatedReview(provider, context);
  const reportPath = await saveReport(rootDir, result, context);

  printSummary(result, reportPath);

  const action = await promptAction(reportPath);
  process.exit(action === "push" ? 0 : 1);
}

const program = new Command();

program
  .name("ai-review")
  .description("Local AI pre-push review pipeline")
  .version("0.1.0");

program
  .command("run")
  .description("Run review against current git changes")
  .option("--provider <name>", "review provider", "mock")
  .action(async (options: { provider: string }) => {
    try {
      if (!listProviders().includes(options.provider)) {
        throw new Error(
          `Unknown provider "${options.provider}". Available: ${listProviders().join(", ")}`
        );
      }
      await runReview(options.provider);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
