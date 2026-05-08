import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";
import { shouldMirrorRepoPath } from "./repoMirrorFilter";

const outputPath = "generated/repoMirror.ts";
const gitHistoryOutputPath = "generated/gitHistory.ts";
const editableMarkdownPaths = new Set([
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

function languageForPath(path: string) {
  const extension = extname(path).slice(1);

  if (extension === "md" || extension === "mdx") return "markdown";
  if (extension === "ts" || extension === "tsx") return "typescript";
  if (extension === "js" || extension === "jsx" || extension === "mjs") return "javascript";
  if (extension === "json") return "json";
  if (extension === "css") return "css";
  if (extension === "html") return "html";
  if (extension === "yaml" || extension === "yml") return "yaml";

  return "text";
}

function fileName(path: string) {
  return path.split("/").pop() ?? path;
}

function fileId(path: string) {
  return `repo:${path}`;
}

function gitHistory() {
  const output = execFileSync(
    "git",
    ["log", "-40", "--date=short", "--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad%x1f%D%x1e"],
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
          .filter(Boolean),
      };
    });
}

function currentBranch() {
  return execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim() || "main";
}

const mirroredFiles = gitFiles().map((path) => {
  const extension = extname(path).slice(1);
  const language = languageForPath(path);

  return {
    id: fileId(path),
    path,
    name: fileName(path),
    extension,
    language,
    renderer: language === "markdown" ? "markdown" : "code",
    editable: editableMarkdownPaths.has(path),
    source: editableMarkdownPaths.has(path) ? "content" : "repo",
    content: readFileSync(path, "utf8"),
  };
});

const source = `import type { WorkspaceFile } from "@/features/workspace/types";

export const repoMirrorFiles: WorkspaceFile[] = ${JSON.stringify(mirroredFiles, null, 2)};
`;
const gitHistorySource = `import type { GitHistoryCommit } from "@/features/git/types";

export const gitHistoryCommits: GitHistoryCommit[] = ${JSON.stringify(gitHistory(), null, 2)};
export const gitCurrentBranch = ${JSON.stringify(currentBranch())};
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, source);
writeFileSync(gitHistoryOutputPath, gitHistorySource);

console.log(`Generated ${mirroredFiles.length} mirrored repo files at ${outputPath}`);
console.log(`Generated git history at ${gitHistoryOutputPath}`);
