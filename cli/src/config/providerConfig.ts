export interface ModelOption {
  id: string;
  label: string;
}

export interface ProviderDefinition {
  name: string;
  aliases: string[];
  label: string;
  envKeys: string[];
  modelEnvVars: string[];
  defaultModel: string;
  models: ModelOption[];
  keyPrompt: string;
  modelIdHint: string;
}

export const MODEL_ID_RULE = `Use the API model ID (lowercase, hyphens — not the UI display name).
Examples: claude-fable-5, composer-2.5, gpt-4o-mini`;

export const PROVIDER_DEFINITIONS: ProviderDefinition[] = [
  {
    name: "cursor",
    aliases: [],
    label: "Cursor",
    envKeys: ["CURSOR_API_KEY"],
    modelEnvVars: ["CURSOR_MODEL", "AI_REVIEW_MODEL"],
    defaultModel: "composer-2.5",
    models: [
      { id: "auto", label: "Auto (account default — may bill as Max)" },
      {
        id: "composer-2.5",
        label: "Composer 2.5 standard (cheaper — recommended)",
      },
      { id: "composer-2.5-fast", label: "Composer 2.5 Fast (higher $/token)" },
      { id: "claude-fable-5", label: "Claude Fable 5" },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
    ],
    keyPrompt: "CURSOR_API_KEY",
    modelIdHint:
      "Cloud Agents API always runs Max Mode (cannot disable). " +
      "composer-2.5 uses standard tier by default here; set CURSOR_MODEL_FAST=true for Fast. " +
      "For cheapest reviews, use AI_REVIEW_PROVIDER=anthropic or openai.",
  },
  {
    name: "openai",
    aliases: [],
    label: "OpenAI",
    envKeys: ["OPENAI_API_KEY"],
    modelEnvVars: ["OPENAI_MODEL", "AI_REVIEW_MODEL"],
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "o4-mini", label: "o4-mini" },
    ],
    keyPrompt: "OPENAI_API_KEY",
    modelIdHint: "See platform.openai.com/docs/models",
  },
  {
    name: "codex",
    aliases: [],
    label: "OpenAI Codex",
    envKeys: ["OPENAI_API_KEY", "CODEX_API_KEY"],
    modelEnvVars: ["CODEX_MODEL", "OPENAI_MODEL", "AI_REVIEW_MODEL"],
    defaultModel: "gpt-4.1",
    models: [
      { id: "gpt-4.1", label: "GPT-4.1 (Codex)" },
      { id: "o4-mini", label: "o4-mini" },
      { id: "gpt-4o", label: "GPT-4o" },
    ],
    keyPrompt: "OPENAI_API_KEY",
    modelIdHint: "Same IDs as OpenAI API",
  },
  {
    name: "anthropic",
    aliases: ["claude"],
    label: "Anthropic Claude",
    envKeys: ["ANTHROPIC_API_KEY"],
    modelEnvVars: ["ANTHROPIC_MODEL", "AI_REVIEW_MODEL"],
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      { id: "claude-fable-5", label: "Claude Fable 5" },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    ],
    keyPrompt: "ANTHROPIC_API_KEY",
    modelIdHint: "See docs.anthropic.com — e.g. claude-fable-5 (not 'Fable 5')",
  },
  {
    name: "gemini",
    aliases: ["google"],
    label: "Google Gemini",
    envKeys: ["GOOGLE_API_KEY", "GEMINI_API_KEY"],
    modelEnvVars: ["GEMINI_MODEL", "GOOGLE_MODEL", "AI_REVIEW_MODEL"],
    defaultModel: "gemini-2.0-flash",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
    keyPrompt: "GOOGLE_API_KEY",
    modelIdHint: "See ai.google.dev/gemini-api/docs/models",
  },
];

const ALIAS_MAP = new Map<string, string>();

for (const def of PROVIDER_DEFINITIONS) {
  ALIAS_MAP.set(def.name, def.name);
  for (const alias of def.aliases) {
    ALIAS_MAP.set(alias, def.name);
  }
}

export function normalizeProviderName(name: string): string {
  return ALIAS_MAP.get(name.trim().toLowerCase()) ?? name.trim().toLowerCase();
}

export function getProviderDefinition(name: string): ProviderDefinition | undefined {
  const normalized = normalizeProviderName(name);
  return PROVIDER_DEFINITIONS.find((def) => def.name === normalized);
}

export function isKnownProvider(name: string): boolean {
  return getProviderDefinition(name) !== undefined;
}

export function normalizeModelId(input: string, provider: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return getProviderDefinition(provider)?.defaultModel ?? trimmed;
  }

  const lower = trimmed.toLowerCase();

  const displayNameAliases: Record<string, string> = {
    "fable 5": "claude-fable-5",
    "claude fable 5": "claude-fable-5",
    fable5: "claude-fable-5",
    "fable-5": "claude-fable-5",
    "composer 2.5": "composer-2.5",
    "composer2.5": "composer-2.5",
    "composer 2.5 fast": "composer-2.5-fast",
    "composer-2.5 fast": "composer-2.5-fast",
  };

  if (displayNameAliases[lower]) {
    return displayNameAliases[lower];
  }

  if (/\s/.test(trimmed)) {
    return lower.replace(/\s+/g, "-");
  }

  return lower;
}

export function providerHasCredentials(name: string): boolean {
  const def = getProviderDefinition(name);
  if (!def) {
    return false;
  }

  return def.envKeys.some((key) => Boolean(process.env[key]?.trim()));
}

export function resolveModel(name: string): string {
  const def = getProviderDefinition(name);
  if (!def) {
    return process.env.AI_REVIEW_MODEL?.trim() || "gpt-4o-mini";
  }

  for (const envVar of def.modelEnvVars) {
    const value = process.env[envVar]?.trim();
    if (value) {
      return value;
    }
  }

  return def.defaultModel;
}

export function resolveApiKey(name: string): string | undefined {
  const def = getProviderDefinition(name);
  if (!def) {
    return undefined;
  }

  for (const key of def.envKeys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function detectConfiguredProvider(): string | null {
  const priority = ["cursor", "openai", "codex", "anthropic", "gemini"];

  for (const name of priority) {
    if (providerHasCredentials(name)) {
      return name;
    }
  }

  return null;
}

export function listConfiguredProviders(): string[] {
  return PROVIDER_DEFINITIONS.filter((def) => providerHasCredentials(def.name)).map(
    (def) => def.name
  );
}

export function primaryModelEnvVar(name: string): string {
  const def = getProviderDefinition(name);
  return def?.modelEnvVars[0] ?? "AI_REVIEW_MODEL";
}
