import { createLlmReviewProvider } from "./shared/llmReview.js";
import { callCursorChat } from "./shared/cursorChat.js";

export const cursorProvider = createLlmReviewProvider("cursor", callCursorChat);
