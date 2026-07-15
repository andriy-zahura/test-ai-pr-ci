import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { ReviewContext, ReviewResult } from "../review/types.js";
import { formatReviewFailureError } from "../utils/reviewFailureRecovery.js";

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
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          AI_REVIEW_ISOLATED: "1",
        },
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        const detail =
          stderr.trim() || `Review worker exited with code ${code}`;
        reject(new Error(formatReviewFailureError(detail)));
        return;
      }

      try {
        const trimmed = stdout.trim();
        const jsonStart = trimmed.indexOf("{");
        const jsonPayload =
          jsonStart >= 0 ? trimmed.slice(jsonStart) : trimmed;
        const result = JSON.parse(jsonPayload) as ReviewResult;
        resolve(result);
      } catch (error) {
        reject(
          new Error(
            formatReviewFailureError(
              `Failed to parse review output: ${error instanceof Error ? error.message : "unknown"}`
            )
          )
        );
      }
    });

    child.stdin.write(JSON.stringify(context));
    child.stdin.end();
  });
}
