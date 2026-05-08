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

function fetchHistory(args: string[]) {
  execFileSync("git", ["fetch", ...args], { stdio: "inherit" });
}

const vercelBranch = process.env.VERCEL_GIT_COMMIT_REF;
const vercelRepoOwner =
  process.env.VERCEL_GIT_REPO_OWNER ?? process.env.VERCEL_GIT_ORG ?? "Experimental-Software-Studio";
const vercelRepoSlug =
  process.env.VERCEL_GIT_REPO_SLUG ?? process.env.VERCEL_GIT_REPO ?? "landing-page";
const isShallowRepository = tryGit(["rev-parse", "--is-shallow-repository"]);

if (vercelBranch) {
  const githubRepoUrl = `https://github.com/${vercelRepoOwner}/${vercelRepoSlug}.git`;

  try {
    console.log(`Fetching git history for ${vercelRepoOwner}/${vercelRepoSlug}:${vercelBranch}.`);
    fetchHistory([
      githubRepoUrl,
      `${vercelBranch}:refs/remotes/origin/${vercelBranch}`,
      "--depth=1000",
      "--tags",
    ]);
    process.exit(0);
  } catch {
    console.warn(`Could not fetch git history for ${vercelBranch}. Continuing with checkout history.`);
    process.exit(0);
  }
}

if (isShallowRepository !== "true") {
  process.exit(0);
}

try {
  console.log("Unshallowing git history.");
  fetchHistory(["--unshallow", "--tags"]);
} catch {
  console.warn("Could not unshallow git history. Trying a deeper fetch instead.");

  try {
    fetchHistory(["--all", "--tags", "--depth=1000"]);
  } catch {
    console.warn("Could not fetch full git history. Continuing with checkout history.");
  }
}
