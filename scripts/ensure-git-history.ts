import { execFileSync } from "node:child_process";

function git(args: string[]) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryGit(args: string[]) {
  try {
    return git(args);
  } catch {
    return null;
  }
}

const isShallowRepository = tryGit(["rev-parse", "--is-shallow-repository"]);

if (isShallowRepository !== "true") {
  process.exit(0);
}

try {
  execFileSync("git", ["fetch", "--unshallow", "--tags"], { stdio: "inherit" });
} catch {
  console.warn("Could not unshallow git history. Trying a deeper fetch instead.");

  try {
    execFileSync("git", ["fetch", "--all", "--tags", "--depth=1000"], {
      stdio: "inherit",
    });
  } catch {
    console.warn("Could not fetch full git history. Continuing with checkout history.");
  }
}
