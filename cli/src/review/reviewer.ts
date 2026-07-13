import type { ReviewProvider } from "./types.js";
import { mockProvider } from "./providers/mock.js";

const providers: Record<string, ReviewProvider> = {
  mock: mockProvider,
};

export function getProvider(name: string): ReviewProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Unknown provider "${name}". Available: ${Object.keys(providers).join(", ")}`
    );
  }
  return provider;
}

export function listProviders(): string[] {
  return Object.keys(providers);
}
