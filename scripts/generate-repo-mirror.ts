import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";
import {
  getImageMimeType,
  getLanguageForPath,
  getRendererForPath,
} from "../src/features/workspace/language";
import { shouldMirrorRepoPath } from "./repoMirrorFilter";

const outputPath = "generated/repoMirror.ts";
const gitHistoryOutputPath = "generated/gitHistory.ts";
const contentMarkdownPaths = new Set([
  "README.md",
  "content/README.md",
  "content/PROJECTS.md",
  "content/ABOUT.md",
  "content/CONTACT.md",
  "content/WEBSITE.md",
]);

function gitFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  );

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((path) => existsSync(path))
    .map(resolveActualPathCasing)
    .filter(shouldMirrorRepoPath);
}

function resolveActualPathCasing(path: string) {
  let currentPath = "";

  return path
    .split("/")
    .map((segment) => {
      const parentPath = currentPath || ".";
      const actualSegment =
        readdirSync(parentPath).find((entry) => entry === segment) ??
        readdirSync(parentPath).find(
          (entry) => entry.toLowerCase() === segment.toLowerCase(),
        ) ??
        segment;

      currentPath = currentPath ? `${currentPath}/${actualSegment}` : actualSegment;

      return actualSegment;
    })
    .join("/");
}

function contentForPath(path: string, language: string, extension: string) {
  if (language !== "image") {
    return readFileSync(path, "utf8");
  }

  const file = readFileSync(path);

  return `data:${getImageMimeType(extension)};base64,${file.toString("base64")}`;
}

function fileName(path: string) {
  return path.split("/").pop() ?? path;
}

function fileId(path: string) {
  return `repo:${path}`;
}

function gitHistory() {
  const branch = currentBranch();
  const historyRef = historyRefForBranch(branch);
  const output = execFileSync(
    "git",
    [
      "log",
      "-40",
      historyRef,
      "--date=short",
      "--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad%x1f%D%x1e",
    ],
    { encoding: "utf8" },
  );

  return output
    .split("\x1e")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash, shortHash, subject, author, date, refs = ""] = entry.split("\x1f");

      return {
        hash,
        shortHash,
        subject,
        author,
        date,
        refs: refs
          .split(", ")
          .map((ref) => ref.trim())
          .filter((ref) => ref && ref !== "grafted"),
      };
    });
}

function currentBranch() {
  return (
    process.env.VERCEL_GIT_COMMIT_REF ??
    (execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim() || "main")
  );
}

function historyRefForBranch(branch: string) {
  const remoteBranch = `origin/${branch}`;

  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", remoteBranch], {
      stdio: "ignore",
    });

    return remoteBranch;
  } catch {
    return "HEAD";
  }
}

const mirroredFiles = gitFiles().map((path) => {
  const extension = extname(path).slice(1);
  const language = getLanguageForPath(path);
  const editable = language !== "image";

  return {
    id: fileId(path),
    path,
    name: fileName(path),
    extension,
    language,
    renderer: getRendererForPath(path),
    editable,
    source: contentMarkdownPaths.has(path) ? "content" : "repo",
    content: contentForPath(path, language, extension),
  };
});

const source = `import type { WorkspaceFile } from "@/features/workspace/types";

export const repoMirrorFiles: WorkspaceFile[] = ${JSON.stringify(mirroredFiles, null, 2)};
`;
const gitHistoryCommits = gitHistory();
const gitHistorySource = `import type { GitHistoryCommit } from "@/features/git/types";

export const gitHistoryCommits: GitHistoryCommit[] = ${JSON.stringify(gitHistoryCommits, null, 2)};
export const gitCurrentBranch = ${JSON.stringify(currentBranch())};
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, source);
writeFileSync(gitHistoryOutputPath, gitHistorySource);

console.log(`Generated ${mirroredFiles.length} mirrored repo files at ${outputPath}`);
console.log(`Generated ${gitHistoryCommits.length} git history commits at ${gitHistoryOutputPath}`);
