import { createLlmReviewProvider } from "./shared/llmReview.js";
import { callOpenAIChat } from "./shared/openaiChat.js";

export const codexProvider = createLlmReviewProvider("codex", (system, user) =>
  callOpenAIChat("codex", system, user)
);
