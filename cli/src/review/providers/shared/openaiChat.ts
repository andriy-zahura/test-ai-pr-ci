import { resolveApiKey, resolveModel } from "../../../config/providerConfig.js";
import { readErrorBody, requireEnvValue } from "./http.js";

export async function callOpenAIChat(
  provider: string,
  system: string,
  user: string
): Promise<string> {
  const apiKey = requireEnvValue(resolveApiKey(provider), "API key", provider);
  const model = resolveModel(provider);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new Error(`OpenAI API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI API returned empty response");
  }

  return content;
}
