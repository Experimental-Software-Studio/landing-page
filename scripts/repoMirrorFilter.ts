const excludedExactPaths = new Set(["generated/repoMirror.ts"]);

const excludedPrefixes = [
  ".git/",
  ".next/",
  ".pnpm-store/",
  "coverage/",
  "dist/",
  "generated/",
  "node_modules/",
];

const excludedSuffixes = [".tsbuildinfo"];

export function shouldMirrorRepoPath(path: string) {
  if (!path || path.startsWith(".env") || path.includes("/.env")) {
    return false;
  }

  if (excludedExactPaths.has(path)) {
    return false;
  }

  if (excludedPrefixes.some((prefix) => path.startsWith(prefix))) {
    return false;
  }

  if (excludedSuffixes.some((suffix) => path.endsWith(suffix))) {
    return false;
  }

  return true;
}
