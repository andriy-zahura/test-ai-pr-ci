import { parseReviewResult } from "../../parseResult.js";
import { resolveApiKey, resolveModel } from "../../../config/providerConfig.js";
import { readErrorBody, requireEnvValue } from "./http.js";

const CURSOR_API_BASE = "https://api.cursor.com/v1";
const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 5 * 60 * 1000;

interface CursorAgentResponse {
  agent?: { id?: string };
  run?: { id?: string };
}

interface CursorRunResponse {
  id?: string;
  status?: string;
  result?: string;
}

function cursorAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

async function cursorFetch(
  apiKey: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${CURSOR_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: cursorAuthHeader(apiKey),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStreamUnavailable(status: number, body: string): boolean {
  if (status === 410) {
    return true;
  }

  const lower = body.toLowerCase();
  return (
    lower.includes("no longer available") ||
    lower.includes("stream_expired") ||
    lower.includes("stream expired")
  );
}

function buildCursorReviewPrompt(system: string, user: string): string {
  return [
    "You are a JSON-only code review endpoint.",
    "Do NOT use tools. Do NOT edit files. Do NOT write prose or markdown.",
    "Your entire reply must be one JSON object starting with { and ending with }.",
    "",
    system,
    "",
    user,
  ].join("\n");
}

const JSON_FOLLOW_UP_PROMPT = [
  "Output ONLY the final code review as a single JSON object.",
  "No markdown fences, no explanation, no preamble.",
  "Start with { and end with }.",
  "Include overallScore, categories, issues, improvements, and previousReviewResolved.",
].join(" ");

async function readCursorRunStream(response: Response): Promise<string | null> {
  const body = response.body;
  if (!body) {
    return null;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";
  let assistantText = "";
  let resultText = "";
  let streamUnavailable = false;

  const deadline = Date.now() + MAX_WAIT_MS;

  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    if (Date.now() > deadline) {
      return null;
    }

    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
        continue;
      }

      if (!line.startsWith("data:")) {
        continue;
      }

      const payload = line.slice(5).trim();
      if (!payload) {
        continue;
      }

      try {
        const data = JSON.parse(payload) as {
          text?: string;
          message?: string;
          code?: string;
        };

        if (currentEvent === "assistant" && data.text) {
          assistantText += data.text;
        }

        if (currentEvent === "result" && data.text) {
          resultText = data.text;
        }

        if (currentEvent === "error") {
          const message = data.message ?? data.code ?? "";
          if (isStreamUnavailable(0, message)) {
            streamUnavailable = true;
            break;
          }
          throw new Error(`Cursor stream error: ${message}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Cursor stream error:")) {
          throw error;
        }
      }
    }

    if (streamUnavailable) {
      break;
    }
  }

  if (streamUnavailable) {
    return null;
  }

  const text = resultText.trim() || assistantText.trim();
  return text.length > 0 ? text : null;
}

async function streamCursorRun(
  apiKey: string,
  agentId: string,
  runId: string
): Promise<string | null> {
  const response = await cursorFetch(apiKey, `/agents/${agentId}/runs/${runId}/stream`, {
    headers: { Accept: "text/event-stream" },
  });

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    if (isStreamUnavailable(response.status, errorBody)) {
      return null;
    }
    throw new Error(`Cursor stream error (${response.status}): ${errorBody}`);
  }

  return readCursorRunStream(response);
}

async function pollCursorRun(
  apiKey: string,
  agentId: string,
  runId: string
): Promise<string> {
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    const response = await cursorFetch(apiKey, `/agents/${agentId}/runs/${runId}`);

    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new Error(`Cursor API error (${response.status}): ${body}`);
    }

    const run = (await response.json()) as CursorRunResponse;
    const status = run.status?.toUpperCase();

    if (status === "FINISHED") {
      if (!run.result?.trim()) {
        throw new Error("Cursor agent finished without a result");
      }
      return run.result;
    }

    if (status === "ERROR" || status === "CANCELLED" || status === "EXPIRED") {
      throw new Error(`Cursor agent run ended with status: ${status}`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Cursor agent run timed out after 5 minutes");
}

async function waitForCursorRunText(
  apiKey: string,
  agentId: string,
  runId: string
): Promise<string> {
  const streamed = await streamCursorRun(apiKey, agentId, runId).catch(() => null);
  if (streamed?.trim()) {
    return streamed;
  }

  return pollCursorRun(apiKey, agentId, runId);
}

async function createCursorRun(
  apiKey: string,
  prompt: string,
  model: string,
  agentId?: string
): Promise<{ agentId: string; runId: string; text: string }> {
  const body: Record<string, unknown> = {
    prompt: { text: prompt },
    mode: "plan",
  };

  if (model !== "auto") {
    body.model = { id: model };
  }

  const path = agentId ? `/agents/${agentId}/runs` : "/agents";
  const response = await cursorFetch(apiKey, path, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new Error(`Cursor API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as CursorAgentResponse & CursorRunResponse;
  const resolvedAgentId = agentId ?? data.agent?.id;
  const runId = data.run?.id ?? data.id;

  if (!resolvedAgentId || !runId) {
    throw new Error("Cursor API did not return agent/run IDs");
  }

  const text = await waitForCursorRunText(apiKey, resolvedAgentId, runId);
  return { agentId: resolvedAgentId, runId, text };
}

function tryParseReview(raw: string): boolean {
  try {
    parseReviewResult(raw);
    return true;
  } catch {
    return false;
  }
}

export async function callCursorChat(system: string, user: string): Promise<string> {
  const apiKey = requireEnvValue(
    resolveApiKey("cursor"),
    "CURSOR_API_KEY",
    "cursor"
  );
  const model = resolveModel("cursor");
  const prompt = buildCursorReviewPrompt(system, user);

  const first = await createCursorRun(apiKey, prompt, model);

  if (tryParseReview(first.text)) {
    return first.text;
  }

  const followUp = await createCursorRun(
    apiKey,
    JSON_FOLLOW_UP_PROMPT,
    model,
    first.agentId
  );

  if (tryParseReview(followUp.text)) {
    return followUp.text;
  }

  const preview = followUp.text.trim().slice(0, 120).replace(/\s+/g, " ");
  throw new Error(
    `Cursor agent returned prose instead of JSON (got: "${preview}..."). ` +
      "For reliable pre-commit reviews, use AI_REVIEW_PROVIDER=anthropic or openai with a direct API key. " +
      "Cursor Cloud Agents are coding agents and often ignore JSON-only instructions."
  );
}
