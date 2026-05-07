const excludedExactPaths = new Set([
  "generated/repoMirror.ts",
  "next-env.d.ts",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
]);

const excludedPrefixes = [
  ".git/",
  ".next/",
  "coverage/",
  "dist/",
  "node_modules/",
];

const excludedSuffixes = [
  ".log",
  ".map",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".tsbuildinfo",
];

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
