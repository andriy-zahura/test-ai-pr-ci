import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { globMatch } from "../utils/glob.js";

export interface MappingEntry {
  pattern: string;
  docs: string;
}

export interface ReviewMapping {
  alwaysInclude: string[];
  mappings: MappingEntry[];
}

export async function loadMapping(rootDir: string): Promise<ReviewMapping> {
  const raw = await readFile(join(rootDir, "review-mapping.json"), "utf8");
  return JSON.parse(raw) as ReviewMapping;
}

export function resolveDocDirs(
  changedFiles: string[],
  mapping: ReviewMapping
): string[] {
  const dirs = new Set<string>(mapping.alwaysInclude);

  for (const file of changedFiles) {
    for (const entry of mapping.mappings) {
      if (globMatch(file, entry.pattern)) {
        dirs.add(entry.docs);
      }
    }
  }

  return [...dirs];
}
