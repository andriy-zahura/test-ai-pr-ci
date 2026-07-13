import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export async function findLatestReview(
  reviewsDir: string
): Promise<string | null> {
  let entries: string[];
  try {
    entries = await readdir(reviewsDir);
  } catch {
    return null;
  }

  const reportPaths: string[] = [];

  for (const entry of entries) {
    const fullPath = join(reviewsDir, entry);
    const info = await stat(fullPath);

    if (info.isFile() && entry.endsWith(".md")) {
      reportPaths.push(fullPath);
      continue;
    }

    if (!info.isDirectory()) {
      continue;
    }

    const dayFiles = await readdir(fullPath);
    for (const file of dayFiles) {
      if (file.endsWith(".md")) {
        reportPaths.push(join(fullPath, file));
      }
    }
  }

  if (reportPaths.length === 0) {
    return null;
  }

  reportPaths.sort();
  return readFile(reportPaths[reportPaths.length - 1], "utf8");
}
