import {
  access,
  appendFile,
  chmod,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import {
  AI_REVIEW_MARKER_END,
  AI_REVIEW_MARKER_START,
  GITIGNORE_LINES,
  SCAFFOLD_FILES,
} from "./templates.js";
import { setupEnv } from "./setupEnv.js";

type WriteResult = "created" | "skipped" | "overwritten";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function writeScaffoldFile(
  rootDir: string,
  relativePath: string,
  content: string,
  force: boolean,
  executable?: boolean
): Promise<WriteResult> {
  const filePath = join(rootDir, relativePath);
  const fileExists = await exists(filePath);

  if (fileExists && !force) {
    return "skipped";
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");

  if (executable) {
    await chmod(filePath, 0o755);
  }

  return fileExists ? "overwritten" : "created";
}

async function patchGitignore(rootDir: string, force: boolean): Promise<WriteResult> {
  const gitignorePath = join(rootDir, ".gitignore");
  const block = GITIGNORE_LINES.join("\n");

  if (!(await exists(gitignorePath))) {
    await writeFile(gitignorePath, block.trimStart() + "\n", "utf8");
    return "created";
  }

  const current = await readFile(gitignorePath, "utf8");
  if (current.includes("docs/reviews/**")) {
    return "skipped";
  }

  const separator = current.endsWith("\n") ? "" : "\n";
  await appendFile(gitignorePath, `${separator}${block}\n`, "utf8");
  return "created";
}

async function patchAgentsMd(rootDir: string, force: boolean): Promise<WriteResult> {
  const agentsPath = join(rootDir, "AGENTS.md");
  const template = SCAFFOLD_FILES.find((file) => file.path === "AGENTS.md");

  if (!template) {
    return "skipped";
  }

  if (!(await exists(agentsPath))) {
    await writeFile(agentsPath, template.content, "utf8");
    return "created";
  }

  const current = await readFile(agentsPath, "utf8");
  if (current.includes(AI_REVIEW_MARKER_START)) {
    if (!force) {
      return "skipped";
    }
    const stripped = current.replace(
      new RegExp(
        `${AI_REVIEW_MARKER_START}[\\s\\S]*?${AI_REVIEW_MARKER_END}\\n?`,
        "m"
      ),
      ""
    );
    await writeFile(agentsPath, `${stripped.trimEnd()}\n\n${template.content}`, "utf8");
    return "overwritten";
  }

  await appendFile(agentsPath, `\n${template.content}`, "utf8");
  return "created";
}

async function patchPackageJson(rootDir: string): Promise<string[]> {
  const packagePath = join(rootDir, "package.json");
  if (!(await exists(packagePath))) {
    return [];
  }

  const pkg = JSON.parse(await readFile(packagePath, "utf8")) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  pkg.scripts ??= {};
  pkg.devDependencies ??= {};
  const added: string[] = [];
  const hasLocalCli = await exists(join(rootDir, "cli/tsconfig.json"));

  if (!pkg.scripts["ai-review"]) {
    pkg.scripts["ai-review"] = hasLocalCli
      ? "node dist-cli/cli.js run"
      : "ai-review run";
    added.push("ai-review");
  }

  if (hasLocalCli && !pkg.scripts["build:cli"]) {
    pkg.scripts["build:cli"] = "tsc -p cli/tsconfig.json";
    added.push("build:cli");
  }

  if (!pkg.scripts["ai-review:init"]) {
    pkg.scripts["ai-review:init"] = hasLocalCli
      ? "node dist-cli/cli.js init"
      : "ai-review init";
    added.push("ai-review:init");
  }

  if (!pkg.devDependencies.husky) {
    pkg.devDependencies.husky = "^9.1.7";
    added.push("husky (devDependency)");
  }

  if (!pkg.scripts.prepare) {
    pkg.scripts.prepare = "husky";
    added.push("prepare");
  }

  if (added.length > 0) {
    await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  }

  return added;
}

export interface InitResult {
  created: string[];
  skipped: string[];
  overwritten: string[];
  merged: string[];
  packageScripts: string[];
}

export interface InitOptions {
  skipPrompt?: boolean;
}

export async function runInit(
  rootDir: string,
  force: boolean,
  options: InitOptions = {}
): Promise<InitResult> {
  const result: InitResult = {
    created: [],
    skipped: [],
    overwritten: [],
    merged: [],
    packageScripts: [],
  };

  for (const file of SCAFFOLD_FILES) {
    if (file.path === "AGENTS.md") {
      continue;
    }

    const status = await writeScaffoldFile(
      rootDir,
      file.path,
      file.content,
      force,
      file.executable
    );
    result[status].push(file.path);
  }

  const agentsStatus = await patchAgentsMd(rootDir, force);
  result[agentsStatus].push("AGENTS.md");

  const gitignoreStatus = await patchGitignore(rootDir, force);
  result[gitignoreStatus].push(".gitignore");

  const envSetup = await setupEnv(rootDir, force, Boolean(options.skipPrompt));
  if (envSetup.env === "merged") {
    result.merged.push(".env");
  } else {
    result[envSetup.env].push(".env");
  }
  result[envSetup.example].push(".env.example");

  result.packageScripts = await patchPackageJson(rootDir);

  return result;
}

export function printInitResult(result: InitResult): void {
  if (result.created.length > 0) {
    console.log("Created:");
    for (const file of result.created) {
      console.log(`  + ${file}`);
    }
  }

  if (result.overwritten.length > 0) {
    console.log("Overwritten:");
    for (const file of result.overwritten) {
      console.log(`  ~ ${file}`);
    }
  }

  if (result.merged.length > 0) {
    console.log("Merged (existing keys preserved):");
    for (const file of result.merged) {
      console.log(`  ~ ${file}`);
    }
  }

  if (result.skipped.length > 0) {
    console.log("Skipped (already exists):");
    for (const file of result.skipped) {
      console.log(`  - ${file}`);
    }
  }

  if (result.packageScripts.length > 0) {
    console.log(`Added package.json scripts: ${result.packageScripts.join(", ")}`);
  }

  console.log("\nNext steps:");
  console.log("  1. Check .env in this project (gitignored — your keys stay local)");
  console.log("  2. Re-run init to change provider/model: npm run ai-review:init -- --force");
  console.log("  3. Read docs/ai-review/README.md");
  console.log("  4. Copy skill globally (optional): cp -r .cursor/skills/jti-review ~/.cursor/skills/");
  console.log("  5. Before commit: invoke /jti-review in your agent");
  console.log("  6. Edit review-mapping.json for your features");
  console.log("  7. git add . && git commit");
}
