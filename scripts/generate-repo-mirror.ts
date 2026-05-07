import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";
import { shouldMirrorRepoPath } from "./repoMirrorFilter";

const outputPath = "generated/repoMirror.ts";

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
    .filter(shouldMirrorRepoPath);
}

function languageForPath(path: string) {
  const extension = extname(path).slice(1);

  if (extension === "md" || extension === "mdx") return "markdown";
  if (extension === "ts" || extension === "tsx") return "typescript";
  if (extension === "js" || extension === "jsx" || extension === "mjs") return "javascript";
  if (extension === "json") return "json";
  if (extension === "css") return "css";
  if (extension === "html") return "html";

  return "text";
}

function fileName(path: string) {
  return path.split("/").pop() ?? path;
}

function fileId(path: string) {
  return `repo:${path}`;
}

const mirroredFiles = gitFiles().map((path) => {
  const extension = extname(path).slice(1);
  const language = languageForPath(path);

  return {
    id: fileId(path),
    path: `repo/${path}`,
    name: fileName(path),
    extension,
    language,
    renderer: language === "markdown" ? "markdown" : "code",
    editable: false,
    source: "repo",
    content: readFileSync(path, "utf8"),
  };
});

const source = `import type { WorkspaceFile } from "@/features/workspace/types";

export const repoMirrorFiles: WorkspaceFile[] = ${JSON.stringify(mirroredFiles, null, 2)};
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, source);

console.log(`Generated ${mirroredFiles.length} mirrored repo files at ${outputPath}`);
