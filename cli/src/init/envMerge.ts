import { getProviderDefinition, primaryModelEnvVar } from "../config/providerConfig.js";

export interface InitEnvSelection {
  provider: string | null;
  model: string | null;
  apiKey: string | null;
}

export interface EnvLine {
  type: "comment" | "blank" | "assignment";
  raw: string;
  key?: string;
  value?: string;
}

export function parseEnvLines(content: string): EnvLine[] {
  const lines: EnvLine[] = [];

  for (const raw of content.split("\n")) {
    const trimmed = raw.trim();

    if (!trimmed) {
      lines.push({ type: "blank", raw });
      continue;
    }

    if (trimmed.startsWith("#")) {
      lines.push({ type: "comment", raw });
      continue;
    }

    const eq = raw.indexOf("=");
    if (eq <= 0) {
      lines.push({ type: "comment", raw });
      continue;
    }

    const key = raw.slice(0, eq).trim();
    let value = raw.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    lines.push({ type: "assignment", raw, key, value });
  }

  return lines;
}

function getAssignmentMap(lines: EnvLine[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const line of lines) {
    if (line.type === "assignment" && line.key) {
      map.set(line.key, line.value ?? "");
    }
  }

  return map;
}

function formatAssignment(key: string, value: string): string {
  return `${key}=${value}`;
}

export function mergeEnvContent(
  existingContent: string | null,
  patch: Record<string, string | undefined>,
  appendTemplate?: string
): string {
  if (!existingContent?.trim()) {
    return buildFreshFromTemplate(patch, appendTemplate);
  }

  const lines = parseEnvLines(existingContent);
  const values = getAssignmentMap(lines);
  let changed = false;

  for (const [key, newValue] of Object.entries(patch)) {
    if (newValue === undefined) {
      continue;
    }

    const current = values.get(key) ?? "";

    if (!newValue.trim() && current.trim()) {
      continue;
    }

    if (newValue === current) {
      continue;
    }

    values.set(key, newValue);
    changed = true;

    let replaced = false;
    for (const line of lines) {
      if (line.type === "assignment" && line.key === key) {
        line.value = newValue;
        line.raw = formatAssignment(key, newValue);
        replaced = true;
        break;
      }
    }

    if (!replaced) {
      if (lines.length > 0 && lines[lines.length - 1].type !== "blank") {
        lines.push({ type: "blank", raw: "" });
      }
      lines.push({
        type: "assignment",
        raw: formatAssignment(key, newValue),
        key,
        value: newValue,
      });
    }
  }

  if (appendTemplate) {
    const appended = appendMissingTemplateKeys(lines, values, appendTemplate);
    if (appended) {
      changed = true;
    }
  }

  if (!changed) {
    return existingContent.replace(/\n*$/, "\n");
  }

  return lines.map((line) => line.raw).join("\n").replace(/\n*$/, "\n");
}

function appendMissingTemplateKeys(
  lines: EnvLine[],
  values: Map<string, string>,
  template: string
): boolean {
  const missing: string[] = [];

  for (const raw of template.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = raw.indexOf("=");
    if (eq <= 0) {
      continue;
    }

    const key = raw.slice(0, eq).trim();
    if (!values.has(key)) {
      missing.push(raw);
      values.set(key, raw.slice(eq + 1).trim());
    }
  }

  if (missing.length === 0) {
    return false;
  }

  if (lines.length > 0 && lines[lines.length - 1].type !== "blank") {
    lines.push({ type: "blank", raw: "" });
  }

  lines.push({
    type: "comment",
    raw: "# --- ai-review (added by init) ---",
  });

  for (const raw of missing) {
    const eq = raw.indexOf("=");
    const key = raw.slice(0, eq).trim();
    const value = raw.slice(eq + 1).trim();
    lines.push({
      type: "assignment",
      raw,
      key,
      value,
    });
  }

  return true;
}

function buildFreshFromTemplate(
  patch: Record<string, string | undefined>,
  template?: string
): string {
  if (!template) {
    return Object.entries(patch)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => formatAssignment(key, value ?? ""))
      .join("\n")
      .concat("\n");
  }

  const values = new Map<string, string>();

  for (const raw of template.split("\n")) {
    const eq = raw.indexOf("=");
    if (eq <= 0 || raw.trimStart().startsWith("#")) {
      continue;
    }
    values.set(raw.slice(0, eq).trim(), raw.slice(eq + 1).trim());
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      values.set(key, value);
    }
  }

  return template
    .split("\n")
    .map((line) => {
      const eq = line.indexOf("=");
      if (eq <= 0 || line.trimStart().startsWith("#")) {
        return line;
      }

      const key = line.slice(0, eq).trim();
      if (values.has(key)) {
        return formatAssignment(key, values.get(key) ?? "");
      }

      return line;
    })
    .join("\n")
    .replace(/\n*$/, "\n");
}

export function selectionToEnvPatch(selection: InitEnvSelection): Record<string, string | undefined> {
  if (!selection.provider) {
    return {};
  }

  const def = getProviderDefinition(selection.provider);
  if (!def) {
    return {};
  }

  const patch: Record<string, string | undefined> = {
    AI_REVIEW_PROVIDER: selection.provider,
  };

  if (selection.model) {
    patch[primaryModelEnvVar(def.name)] = selection.model;
  }

  if (selection.apiKey) {
    patch[def.keyPrompt] = selection.apiKey;
  }

  return patch;
}
