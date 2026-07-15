import { closeSync, openSync } from "node:fs";
import { ReadStream } from "node:tty";
import { emitKeypressEvents } from "node:readline";
import { stdin as input } from "node:process";

export type PreReviewChoice = "run" | "skip";

function attachKeypressListener(
  stream: NodeJS.ReadStream,
  onChoice: (choice: PreReviewChoice) => void
): () => void {
  emitKeypressEvents(stream);

  if (stream.isTTY) {
    stream.setRawMode(true);
  }

  const handler = (
    str: string,
    key: { name?: string; ctrl?: boolean }
  ): void => {
    if (key.ctrl && key.name === "c") {
      cleanup();
      onChoice("skip");
      return;
    }

    if (str.toLowerCase() === "s" || key.name === "s") {
      cleanup();
      onChoice("skip");
      return;
    }

    if (key.name === "return" || key.name === "enter") {
      cleanup();
      onChoice("run");
    }
  };

  const cleanup = (): void => {
    stream.removeListener("keypress", handler);
    if (stream.isTTY) {
      stream.setRawMode(false);
    }
  };

  stream.on("keypress", handler);
  return cleanup;
}

function openTtyInput(): { stream: NodeJS.ReadStream; fd: number | null } | null {
  if (input.isTTY) {
    return { stream: input, fd: null };
  }

  if (process.platform === "win32") {
    return null;
  }

  try {
    const ttyFd = openSync("/dev/tty", "r");
    return { stream: new ReadStream(ttyFd), fd: ttyFd };
  } catch {
    return null;
  }
}

export function canPromptPreReview(): boolean {
  if (input.isTTY) {
    return true;
  }

  if (process.platform === "win32") {
    return false;
  }

  try {
    const ttyFd = openSync("/dev/tty", "r");
    closeSync(ttyFd);
    return true;
  } catch {
    return false;
  }
}

export function printPreReviewPrompt(): void {
  console.log("\n[S] Skip review (no tokens)  [Enter] Run review");
}

export async function promptPreReview(
  timeoutMs = 0
): Promise<PreReviewChoice> {
  const ttyHandle = openTtyInput();
  if (!ttyHandle) {
    return "run";
  }

  const { stream: tty, fd } = ttyHandle;
  printPreReviewPrompt();

  return new Promise((resolve) => {
    let settled = false;
    let timer: NodeJS.Timeout | undefined;

    const finish = (choice: PreReviewChoice): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      cleanup();
      if (fd !== null) {
        closeSync(fd);
      }
      resolve(choice);
    };

    const cleanup = attachKeypressListener(tty, finish);

    if (timeoutMs > 0) {
      timer = setTimeout(() => finish("run"), timeoutMs);
    }
  });
}
