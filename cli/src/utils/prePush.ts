import { stdin as input } from "node:process";

const ZERO_SHA = "0".repeat(40);
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

export async function readStdinAll(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of input) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
}

export function parsePrePushStdin(stdin: string): string | null {
  const line = stdin
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0);

  if (!line) {
    return null;
  }

  const parts = line.split(/\s+/);
  if (parts.length < 4) {
    return null;
  }

  const localSha = parts[1];
  const remoteSha = parts[3];

  if (!localSha || localSha === ZERO_SHA) {
    return null;
  }

  if (remoteSha === ZERO_SHA) {
    return `${EMPTY_TREE}..${localSha}`;
  }

  return `${remoteSha}..${localSha}`;
}
