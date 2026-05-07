"use client";

import { Eye, FileCode2, Lock } from "lucide-react";
import { CodeEditor } from "@/features/editor/CodeEditor";
import { MarkdownPreview } from "@/features/preview/MarkdownPreview";
import type { EditorMode, WorkspaceFile } from "@/features/workspace/types";

interface EditorPaneProps {
  file: WorkspaceFile;
  value: string;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onChange: (value: string) => void;
}

export function EditorPane({ file, value, mode, onModeChange, onChange }: EditorPaneProps) {
  const canPreview = file.renderer === "markdown";

  return (
    <section className="editor-pane" aria-label={`${file.name} editor`}>
      <header className="editor-toolbar">
        <div className="editor-breadcrumb">{file.path}</div>
        <div className="editor-actions" aria-label="Editor mode">
          {canPreview ? (
            <>
              <button
                type="button"
                className={mode === "code" ? "toolbar-button active" : "toolbar-button"}
                onClick={() => onModeChange("code")}
              >
                <FileCode2 size={15} />
                <span>Code</span>
              </button>
              <button
                type="button"
                className={mode === "preview" ? "toolbar-button active" : "toolbar-button"}
                onClick={() => onModeChange("preview")}
              >
                <Eye size={15} />
                <span>Preview</span>
              </button>
            </>
          ) : null}
          {!file.editable ? (
            <span className="readonly-pill">
              <Lock size={14} />
              Read-only mirror
            </span>
          ) : null}
        </div>
      </header>
      <div className="editor-body">
        {canPreview && mode === "preview" ? (
          <MarkdownPreview markdown={value} />
        ) : (
          <CodeEditor
            value={value}
            language={file.language}
            readOnly={!file.editable}
            onChange={onChange}
          />
        )}
      </div>
    </section>
  );
}
