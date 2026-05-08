import type { WorkspaceLanguage, WorkspaceRenderer } from "./types";

const languageByExtension: Record<string, WorkspaceLanguage> = {
  avif: "image",
  css: "css",
  gif: "image",
  html: "html",
  ico: "image",
  jpeg: "image",
  jpg: "image",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  mjs: "javascript",
  png: "image",
  svg: "image",
  ts: "typescript",
  tsx: "typescript",
  webp: "image",
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
  const language = getLanguageForPath(path);

  if (language === "markdown") return "markdown";
  if (language === "image") return "image";

  return "code";
}
