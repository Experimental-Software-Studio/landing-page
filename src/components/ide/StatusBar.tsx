import { GitBranch, Lock, Pencil } from "lucide-react";
import type { EditorCursorPosition } from "@/features/editor/CodeEditor";
import type { WorkspaceFile } from "@/features/workspace/types";

interface StatusBarProps {
  cursorPosition?: EditorCursorPosition;
  file: WorkspaceFile | null;
}

const languageLabels: Record<WorkspaceFile["language"], string> = {
  css: "CSS",
  html: "HTML",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  text: "Plain Text",
  typescript: "TypeScript",
  yaml: "YAML",
};

function languageLabel(file: WorkspaceFile) {
  if (file.extension === "tsx") return "TypeScript JSX";
  if (file.extension === "jsx") return "JavaScript JSX";

  return languageLabels[file.language];
}

export function StatusBar({ cursorPosition, file }: StatusBarProps) {
  if (!file) {
    return (
      <footer className="status-bar">
        <span className="status-item">
          <GitBranch size={14} />
          main
        </span>
        <span className="status-spacer" />
      </footer>
    );
  }

  const editableCursorPosition = file.editable
    ? (cursorPosition ?? { column: 1, line: 1 })
    : null;

  return (
    <footer className="status-bar">
      <span className="status-item">
        <GitBranch size={14} />
        main
      </span>
      <span className="status-item">{file.path}</span>
      <span className="status-spacer" />
      {editableCursorPosition ? (
        <span className="status-item">
          Ln {editableCursorPosition.line}, Col {editableCursorPosition.column}
        </span>
      ) : null}
      <span className="status-item">Spaces: 2</span>
      <span className="status-item">UTF-8</span>
      <span className="status-item">{languageLabel(file)}</span>
      <span className="status-item">
        {file.editable ? <Pencil size={14} /> : <Lock size={14} />}
        {file.editable ? "Session edit" : "Read-only"}
      </span>
    </footer>
  );
}
