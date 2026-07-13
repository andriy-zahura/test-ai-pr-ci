import { buildReviewPrompt } from "../../buildPrompt.js";
import { parseReviewResult } from "../../parseResult.js";
import type { ReviewContext, ReviewProvider, ReviewResult } from "../../types.js";

export function createLlmReviewProvider(
  name: string,
  callChat: (system: string, user: string) => Promise<string>
): ReviewProvider {
  return {
    name,

    async review(context: ReviewContext): Promise<ReviewResult> {
      const { system, user } = await buildReviewPrompt(context);
      const raw = await callChat(system, user);
      return parseReviewResult(raw);
    },
  };
}
