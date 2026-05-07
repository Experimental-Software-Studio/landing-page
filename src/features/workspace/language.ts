import type { WorkspaceLanguage, WorkspaceRenderer } from "./types";

const languageByExtension: Record<string, WorkspaceLanguage> = {
  css: "css",
  html: "html",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  mjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  yaml: "yaml",
  yml: "yaml",
};

export function getExtension(path: string) {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export function getLanguageForPath(path: string): WorkspaceLanguage {
  return languageByExtension[getExtension(path)] ?? "text";
}

export function getRendererForPath(path: string): WorkspaceRenderer {
  return getLanguageForPath(path) === "markdown" ? "markdown" : "code";
}
