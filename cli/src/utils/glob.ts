export function globMatch(path: string, pattern: string): boolean {
  if (pattern === path) {
    return true;
  }

  const regex = new RegExp(
    "^" +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "{{GLOBSTAR}}")
        .replace(/\*/g, "[^/]*")
        .replace(/{{GLOBSTAR}}/g, ".*") +
      "$"
  );

  return regex.test(path);
}
