import { readErrorBody } from "../review/providers/shared/http.js";
import type { ModelOption } from "../config/providerConfig.js";

interface CursorModelItem {
  id?: string;
  displayName?: string;
}

export async function fetchCursorModels(apiKey: string): Promise<ModelOption[]> {
  const response = await fetch("https://api.cursor.com/v1/models", {
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey.trim()}:`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new Error(`Could not fetch Cursor models (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { items?: CursorModelItem[] };
  const items = data.items ?? [];

  const models: ModelOption[] = [];
  const seen = new Set<string>();

  const add = (id: string, label: string) => {
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    models.push({ id, label });
  };

  add("auto", "Auto (account default)");

  for (const item of items) {
    if (item.id) {
      add(item.id, item.displayName?.trim() || item.id);
    }
  }

  return models;
}
