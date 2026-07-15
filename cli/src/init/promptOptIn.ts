import { openSync } from "node:fs";
import { createInterface, type Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ReadStream } from "node:tty";

function createPromptInterface(): Interface {
  if (input.isTTY) {
    return createInterface({ input, output, terminal: true });
  }

  if (process.platform === "win32") {
    throw new Error("Interactive init requires a TTY");
  }

  const ttyFd = openSync("/dev/tty", "r");
  return createInterface({
    input: new ReadStream(ttyFd),
    output,
    terminal: true,
  });
}

export async function promptAutoRun(): Promise<boolean> {
  const rl = createPromptInterface();

  try {
    console.log("\nHow should review run on git commit?");
    console.log("  Y — Auto-review every commit (no prompt, runs immediately)");
    console.log("  N — Ask each time: [S] skip / [Enter] run  (saves tokens)\n");

    const answer = (await rl.question("Auto-review every commit? [y/N]: "))
      .trim()
      .toLowerCase();

    if (answer === "y" || answer === "yes") {
      return true;
    }

    return false;
  } finally {
    rl.close();
  }
}

export async function promptOptIn(): Promise<boolean> {
  const rl = createPromptInterface();

  try {
    console.log("\nEnable AI pre-commit review in this project?");
    console.log("  Y — install hook + local config (each dev chooses for themselves)");
    console.log("  N — skip / disable review on this machine\n");

    const answer = (await rl.question("Enable review? [Y/n]: ")).trim().toLowerCase();

    if (!answer || answer === "y" || answer === "yes") {
      return true;
    }

    if (answer === "n" || answer === "no") {
      return false;
    }

    console.log("Invalid choice. Treating as No.");
    return false;
  } finally {
    rl.close();
  }
}

export function printOptOutMessage(hadPriorInstall = false): void {
  if (hadPriorInstall) {
    console.log("\nReview disabled on this machine:");
    console.log("  - removed .husky/pre-commit (if ours)");
    console.log("  - removed git aliases");
    console.log("  - set AI_REVIEW_ENABLED=false in .env.jti-ai-review (if present)");
  } else {
    console.log("\nSetup skipped. Your git workflow is unchanged.");
  }
  console.log("Run anytime: npx ai-review init\n");
}
