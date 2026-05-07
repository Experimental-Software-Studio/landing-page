"use client";

import { useMemo } from "react";
import { renderMarkdown } from "./renderMarkdown";

interface MarkdownPreviewProps {
  markdown: string;
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);

  return (
    <article
      className="markdown-preview"
      data-testid="markdown-preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
