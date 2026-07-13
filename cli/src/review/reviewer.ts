import type { ReviewProvider } from "./types.js";
import { mockProvider } from "./providers/mock.js";
import { openaiProvider } from "./providers/openai.js";
import { codexProvider } from "./providers/codex.js";
import { anthropicProvider } from "./providers/anthropic.js";
import { geminiProvider } from "./providers/gemini.js";
import { cursorProvider } from "./providers/cursor.js";
import {
  PROVIDER_DEFINITIONS,
  normalizeProviderName,
} from "../config/providerConfig.js";

const providers: Record<string, ReviewProvider> = {
  mock: mockProvider,
  openai: openaiProvider,
  codex: codexProvider,
  anthropic: anthropicProvider,
  claude: anthropicProvider,
  gemini: geminiProvider,
  google: geminiProvider,
  cursor: cursorProvider,
};

export function getProvider(name: string): ReviewProvider {
  const normalized = normalizeProviderName(name);
  const provider = providers[normalized];

  if (!provider) {
    throw new Error(
      `Unknown provider "${name}". Available: ${listProviders().join(", ")}`
    );
  }

  return provider;
}

export function listProviders(): string[] {
  const names = new Set<string>(["mock"]);

  for (const def of PROVIDER_DEFINITIONS) {
    names.add(def.name);
    for (const alias of def.aliases) {
      names.add(alias);
    }
  }

  return [...names].sort();
}
