import { resolveApiKey, resolveModel } from "../../../config/providerConfig.js";
import { readErrorBody, requireEnvValue } from "./http.js";

export async function callAnthropicChat(system: string, user: string): Promise<string> {
  const apiKey = requireEnvValue(
    resolveApiKey("anthropic"),
    "ANTHROPIC_API_KEY",
    "anthropic"
  );
  const model = resolveModel("anthropic");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new Error(`Anthropic API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = data.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");

  if (!text) {
    throw new Error("Anthropic API returned empty response");
  }

  return text;
}
