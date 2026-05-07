import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import type { Extension } from "@codemirror/state";
import type { WorkspaceLanguage } from "@/features/workspace/types";

export function getCodeMirrorLanguage(language: WorkspaceLanguage): Extension {
  switch (language) {
    case "css":
      return css();
    case "html":
      return html();
    case "javascript":
      return javascript({ jsx: true });
    case "json":
      return json();
    case "markdown":
      return markdown();
    case "typescript":
      return javascript({ jsx: true, typescript: true });
    case "text":
    default:
      return [];
  }
}
