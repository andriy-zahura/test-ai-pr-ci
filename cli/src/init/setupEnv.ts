import { openSync } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { createInterface, type Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ReadStream } from "node:tty";
import {
  MODEL_ID_RULE,
  PROVIDER_DEFINITIONS,
  getProviderDefinition,
  isKnownProvider,
  normalizeModelId,
  normalizeProviderName,
  primaryModelEnvVar,
  type ModelOption,
  type ProviderDefinition,
} from "../config/providerConfig.js";
import { fetchCursorModels } from "./fetchCursorModels.js";

type WriteResult = "created" | "skipped" | "overwritten";

export interface InitEnvSelection {
  provider: string | null;
  model: string | null;
  apiKey: string | null;
}

export const ENV_EXAMPLE = `# AI review — copy to .env and fill in your provider key

# Provider: cursor | openai | codex | anthropic | claude | gemini | google | mock
AI_REVIEW_PROVIDER=cursor

# --- Cursor (Dashboard → Integrations → API Keys) ---
CURSOR_API_KEY=
CURSOR_MODEL=auto

# --- OpenAI / Codex ---
# OPENAI_API_KEY=
# OPENAI_MODEL=gpt-4o-mini
# CODEX_MODEL=gpt-4.1

# --- Anthropic Claude ---
# ANTHROPIC_API_KEY=
# ANTHROPIC_MODEL=claude-fable-5

# --- Google Gemini ---
# GOOGLE_API_KEY=
# GEMINI_MODEL=gemini-2.0-flash

# Generic model override (optional)
# AI_REVIEW_MODEL=
`;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

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

async function ask(rl: Interface, question: string): Promise<string> {
  return (await rl.question(question)).trim();
}

function providerMenu(): void {
  console.log("\nChoose review provider (commit reviewer on git commit):");
  PROVIDER_DEFINITIONS.forEach((def, index) => {
    console.log(`  ${index + 1}. ${def.label}`);
  });
  console.log(`  ${PROVIDER_DEFINITIONS.length + 1}. Other (enter provider name)`);
  console.log(`  ${PROVIDER_DEFINITIONS.length + 2}. Skip — use mock until .env is set\n`);
}

async function promptProvider(rl: Interface): Promise<string | null> {
  providerMenu();

  const maxChoice = PROVIDER_DEFINITIONS.length + 2;
  const answer = await ask(rl, `Provider [1-${maxChoice}]: `);

  if (!answer || answer === String(maxChoice)) {
    return null;
  }

  if (answer === String(PROVIDER_DEFINITIONS.length + 1)) {
    while (true) {
      const custom = await ask(
        rl,
        "Provider name (cursor, openai, codex, anthropic, gemini): "
      );
      const normalized = normalizeProviderName(custom);

      if (isKnownProvider(normalized)) {
        return normalized;
      }

      console.log("Unknown provider. Pick one from the list or choose a numbered option.");
    }
  }

  const index = Number(answer) - 1;
  if (index >= 0 && index < PROVIDER_DEFINITIONS.length) {
    return PROVIDER_DEFINITIONS[index].name;
  }

  const byName = normalizeProviderName(answer);
  if (isKnownProvider(byName)) {
    return byName;
  }

  console.log("Invalid choice. Using mock provider.");
  return null;
}

async function promptApiKey(
  rl: Interface,
  def: ProviderDefinition
): Promise<string | null> {
  console.log(`\n${def.label} API key`);
  console.log("Leave empty to skip — uses mock provider until key is set.\n");

  const key = await ask(rl, `${def.keyPrompt}: `);
  return key.length > 0 ? key : null;
}

async function resolveModelOptions(
  def: ProviderDefinition,
  apiKey: string | null
): Promise<ModelOption[]> {
  if (def.name === "cursor" && apiKey) {
    try {
      console.log("\nFetching models from Cursor API...");
      const live = await fetchCursorModels(apiKey);
      if (live.length > 0) {
        return live;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Could not fetch live models: ${message}`);
      console.log("Using built-in list instead.\n");
    }
  }

  return def.models;
}

function modelMenu(def: ProviderDefinition, models: ModelOption[]): void {
  console.log(`\nChoose model for ${def.label}:`);
  console.log("(Saved value is the API model ID in parentheses)\n");

  models.forEach((model, index) => {
    const marker = model.id === def.defaultModel ? " (default)" : "";
    const idHint = model.label === model.id ? "" : ` — ${model.id}`;
    console.log(`  ${index + 1}. ${model.label}${idHint}${marker}`);
  });

  console.log(`  ${models.length + 1}. Other (enter model ID)\n`);
}

async function promptCustomModelId(
  rl: Interface,
  def: ProviderDefinition
): Promise<string> {
  console.log(`\n${MODEL_ID_RULE}`);
  console.log(def.modelIdHint);
  console.log("");

  while (true) {
    const raw = await ask(rl, "Model ID: ");
    if (!raw) {
      console.log("Model ID cannot be empty.");
      continue;
    }

    const normalized = normalizeModelId(raw, def.name);

    if (normalized !== raw.trim()) {
      console.log(`Using API ID: ${normalized}`);
    }

    return normalized;
  }
}

async function promptModel(
  rl: Interface,
  def: ProviderDefinition,
  models: ModelOption[]
): Promise<string> {
  modelMenu(def, models);

  const maxChoice = models.length + 1;
  const answer = await ask(rl, `Model [1-${maxChoice}]: `);

  if (!answer) {
    return def.defaultModel;
  }

  if (answer === String(maxChoice)) {
    return promptCustomModelId(rl, def);
  }

  const index = Number(answer) - 1;
  if (index >= 0 && index < models.length) {
    return models[index].id;
  }

  const byId = models.find((model) => model.id === answer);
  if (byId) {
    return byId.id;
  }

  console.log(`Invalid choice. Using default: ${def.defaultModel}`);
  return def.defaultModel;
}

export async function promptInitEnv(): Promise<InitEnvSelection> {
  const rl = createPromptInterface();

  try {
    const provider = await promptProvider(rl);
    if (!provider) {
      return { provider: null, model: null, apiKey: null };
    }

    const def = getProviderDefinition(provider);
    if (!def) {
      return { provider: null, model: null, apiKey: null };
    }

    const apiKey = await promptApiKey(rl, def);
    const models = await resolveModelOptions(def, apiKey);
    const model = await promptModel(rl, def, models);

    return { provider, model, apiKey };
  } finally {
    rl.close();
  }
}

export function buildEnvContent(selection: InitEnvSelection): string {
  const provider = selection.provider;
  const def = provider ? getProviderDefinition(provider) : undefined;

  const values = new Map<string, string>();

  values.set("AI_REVIEW_PROVIDER", provider ?? "mock");

  if (def && selection.model) {
    values.set(primaryModelEnvVar(def.name), selection.model);
  }

  if (def) {
    values.set(def.keyPrompt, selection.apiKey ?? "");
  }

  return ENV_EXAMPLE.split("\n")
    .map((line) => {
      const eq = line.indexOf("=");
      if (eq <= 0 || line.startsWith("#")) {
        return line;
      }

      const key = line.slice(0, eq).trim();
      if (values.has(key)) {
        return `${key}=${values.get(key)}`;
      }

      return line;
    })
    .join("\n")
    .replace(/\n*$/, "\n");
}

export interface EnvSetupResult {
  env: WriteResult;
  example: WriteResult;
}

export async function setupEnv(
  rootDir: string,
  force: boolean,
  skipPrompt: boolean
): Promise<EnvSetupResult> {
  const examplePath = join(rootDir, ".env.example");
  const envPath = join(rootDir, ".env");

  const exampleExists = await exists(examplePath);
  await writeFile(examplePath, ENV_EXAMPLE, "utf8");

  let envStatus: WriteResult = "created";

  try {
    await readFile(envPath, "utf8");
    if (!force) {
      return {
        env: "skipped",
        example: exampleExists ? "skipped" : "created",
      };
    }
    envStatus = "overwritten";
  } catch {
    envStatus = "created";
  }

  let selection: InitEnvSelection = { provider: null, model: null, apiKey: null };

  if (!skipPrompt) {
    try {
      selection = await promptInitEnv();
    } catch {
      selection = { provider: null, model: null, apiKey: null };
    }
  }

  await writeFile(envPath, buildEnvContent(selection), "utf8");

  return {
    env: envStatus,
    example: exampleExists ? "overwritten" : "created",
  };
}
