import { envSetupHint } from "../../../config/envPaths.js";

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
      `${envName} is missing for provider "${provider}". ${envSetupHint()}`
    );
  }

  return value.trim();
}
