import { stdin } from "node:process";
import { loadEnv } from "./config/loadEnv.js";
import { getProvider } from "./review/reviewer.js";
import type { ReviewContext, ReviewResult } from "./review/types.js";

async function readContextFromStdin(): Promise<ReviewContext> {
  const chunks: Buffer[] = [];

  for await (const chunk of stdin) {
    chunks.push(chunk as Buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw) as ReviewContext;
}

function parseArgs(): { provider: string } {
  const providerFlag = process.argv.indexOf("--provider");
  const provider =
    providerFlag >= 0 ? process.argv[providerFlag + 1] : "mock";

  if (!provider) {
    throw new Error("Missing value for --provider");
  }

  return { provider };
}

async function main(): Promise<void> {
  if (process.env.AI_REVIEW_ISOLATED !== "1") {
    console.error("Review worker must run as isolated subprocess.");
    process.exit(1);
  }

  await loadEnv(process.cwd());

  const { provider } = parseArgs();
  const context = await readContextFromStdin();
  const result: ReviewResult = await getProvider(provider).review(context);

  process.stdout.write(JSON.stringify(result));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
