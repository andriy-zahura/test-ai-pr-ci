import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  detectConfiguredProvider,
  getProviderDefinition,
  normalizeProviderName,
  providerHasCredentials,
} from "./providerConfig.js";

const ENV_FILES = [".env", ".env.local"];

function parseEnvLine(line: string): { key: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const eq = trimmed.indexOf("=");
  if (eq <= 0) {
    return null;
  }

  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

export async function loadEnv(rootDir: string): Promise<void> {
  for (const file of ENV_FILES) {
    const path = join(rootDir, file);
    try {
      const raw = await readFile(path, "utf8");
      for (const line of raw.split("\n")) {
        const parsed = parseEnvLine(line);
        if (parsed && process.env[parsed.key] === undefined) {
          process.env[parsed.key] = parsed.value;
        }
      }
    } catch {
      continue;
    }
  }
}

export function resolveDefaultProvider(): string {
  const configured = process.env.AI_REVIEW_PROVIDER?.trim();

  if (configured) {
    const normalized = normalizeProviderName(configured);

    if (normalized === "mock") {
      return "mock";
    }

    if (providerHasCredentials(normalized)) {
      return normalized;
    }

    return "mock";
  }

  return detectConfiguredProvider() ?? "mock";
}

export function missingKeyMessage(provider: string): string {
  const def = getProviderDefinition(provider);
  if (!def) {
    return `Provider "${provider}" is not configured.`;
  }

  return `${def.keyPrompt} is missing for provider "${provider}". Add it to .env or run: npm run ai-review:init`;
}
