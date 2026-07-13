import { createLlmReviewProvider } from "./shared/llmReview.js";
import { callGeminiChat } from "./shared/geminiChat.js";

export const geminiProvider = createLlmReviewProvider("gemini", callGeminiChat);
