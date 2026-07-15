export interface CursorModelRequest {
  id: string;
  params?: Array<{ id: string; value: string }>;
}

function parseFastPreference(): boolean | undefined {
  const raw = process.env.CURSOR_MODEL_FAST?.trim().toLowerCase();
  if (!raw) {
    return undefined;
  }

  if (raw === "1" || raw === "true" || raw === "yes") {
    return true;
  }

  if (raw === "0" || raw === "false" || raw === "no") {
    return false;
  }

  return undefined;
}

function withFastParam(id: string, fast: boolean): CursorModelRequest {
  return {
    id,
    params: [{ id: "fast", value: fast ? "true" : "false" }],
  };
}

/**
 * Cursor Cloud Agents default composer-2.5 to the fast (pricier) variant.
 * We default to standard unless the model id or CURSOR_MODEL_FAST says otherwise.
 */
export function resolveCursorModelRequest(modelId: string): CursorModelRequest | null {
  const trimmed = modelId.trim();
  if (!trimmed || trimmed === "auto") {
    return null;
  }

  const fastPref = parseFastPreference();

  if (trimmed === "composer-2.5-fast") {
    return withFastParam("composer-2.5", true);
  }

  if (trimmed === "composer-2.5") {
    return withFastParam("composer-2.5", fastPref ?? false);
  }

  if (trimmed.endsWith("-fast")) {
    const baseId = trimmed.slice(0, -"-fast".length);
    return withFastParam(baseId, true);
  }

  if (fastPref !== undefined && trimmed.startsWith("composer-")) {
    return withFastParam(trimmed, fastPref);
  }

  return { id: trimmed };
}

export function formatCursorModelForLog(request: CursorModelRequest | null): string {
  if (!request) {
    return "auto";
  }

  const fastParam = request.params?.find((param) => param.id === "fast");
  if (fastParam) {
    return `${request.id} (fast=${fastParam.value})`;
  }

  return request.id;
}
