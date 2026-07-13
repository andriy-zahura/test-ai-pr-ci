import { resolveApiKey, resolveModel } from "../../../config/providerConfig.js";
import { readErrorBody, requireEnvValue } from "./http.js";

export async function callGeminiChat(system: string, user: string): Promise<string> {
  const apiKey = requireEnvValue(
    resolveApiKey("gemini"),
    "GOOGLE_API_KEY",
    "gemini"
  );
  const model = resolveModel("gemini");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: user }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new Error(`Gemini API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini API returned empty response");
  }

  return text;
}
