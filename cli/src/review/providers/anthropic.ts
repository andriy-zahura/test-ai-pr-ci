import { createLlmReviewProvider } from "./shared/llmReview.js";
import { callAnthropicChat } from "./shared/anthropicChat.js";

export const anthropicProvider = createLlmReviewProvider("anthropic", callAnthropicChat);
