import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { ReviewContext, ReviewResult } from "../review/types.js";

const workerPath = join(dirname(fileURLToPath(import.meta.url)), "../review-worker.js");

export function runIsolatedReview(
  provider: string,
  context: ReviewContext
): Promise<ReviewResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [workerPath, "--provider", provider],
      {
        stdio: ["pipe", "pipe", "inherit"],
        env: {
          ...process.env,
          AI_REVIEW_ISOLATED: "1",
        },
      }
    );

    let stdout = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Review worker exited with code ${code}`));
        return;
      }

      try {
        const result = JSON.parse(stdout) as ReviewResult;
        resolve(result);
      } catch (error) {
        reject(
          new Error(
            `Failed to parse review output: ${error instanceof Error ? error.message : "unknown"}`
          )
        );
      }
    });

    child.stdin.write(JSON.stringify(context));
    child.stdin.end();
  });
}
