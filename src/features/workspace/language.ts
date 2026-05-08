import type { WorkspaceLanguage, WorkspaceRenderer } from "./types";

const imageExtensions = new Set(["avif", "gif", "ico", "jpeg", "jpg", "png", "svg", "webp"]);

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

export function isImageExtension(extension: string) {
  return imageExtensions.has(extension.toLowerCase());
}

export function getImageMimeType(extension: string) {
  const normalizedExtension = extension.toLowerCase();

  if (normalizedExtension === "svg") return "image/svg+xml";
  if (normalizedExtension === "jpg") return "image/jpeg";
  if (normalizedExtension === "ico") return "image/x-icon";

  return `image/${normalizedExtension}`;
}

export function getLanguageForPath(path: string): WorkspaceLanguage {
  const extension = getExtension(path);

  if (isImageExtension(extension)) return "image";

  return languageByExtension[extension] ?? "text";
}

export function getRendererForPath(path: string): WorkspaceRenderer {
  const language = getLanguageForPath(path);

  if (language === "markdown") return "markdown";
  if (language === "image") return "image";

  return "code";
}
