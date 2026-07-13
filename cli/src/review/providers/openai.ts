import { createLlmReviewProvider } from "./shared/llmReview.js";
import { callOpenAIChat } from "./shared/openaiChat.js";

export const openaiProvider = createLlmReviewProvider("openai", (system, user) =>
  callOpenAIChat("openai", system, user)
);
