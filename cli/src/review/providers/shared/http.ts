export async function readErrorBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return response.statusText;
  }
}

export function requireEnvValue(
  value: string | undefined,
  envName: string,
  provider: string
): string {
  if (!value?.trim()) {
    throw new Error(
      `${envName} is missing for provider "${provider}". Add it to .env or run: npm run ai-review:init`
    );
  }

  return value.trim();
}
