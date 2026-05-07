"use client";

import { ChevronRight, Eye, FileCode2, Lock } from "lucide-react";
import {
  CodeEditor,
  type EditorFoldRange,
  type EditorScrollPosition,
} from "@/features/editor/CodeEditor";
import { MarkdownPreview } from "@/features/preview/MarkdownPreview";
import type { EditorMode, WorkspaceFile } from "@/features/workspace/types";

interface EditorPaneProps {
  file: WorkspaceFile;
  value: string;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onChange: (value: string) => void;
  getScrollPosition: (fileId: string) => EditorScrollPosition;
  onScrollPositionChange: (fileId: string, position: EditorScrollPosition) => void;
  getFoldRanges: (fileId: string) => EditorFoldRange[];
  onFoldRangesChange: (fileId: string, ranges: EditorFoldRange[]) => void;
}

export function EditorPane({
  file,
  value,
  mode,
  onModeChange,
  onChange,
  getScrollPosition,
  onScrollPositionChange,
  getFoldRanges,
  onFoldRangesChange,
}: EditorPaneProps) {
  const canPreview = file.renderer === "markdown";
  const breadcrumbSegments = file.path.split("/");

  return (
    <section className="editor-pane" aria-label={`${file.name} editor`}>
      <header className="editor-toolbar">
        <div className="editor-breadcrumb" aria-label={file.path}>
          {breadcrumbSegments.map((segment, index) => (
            <span key={`${segment}-${index}`} className="breadcrumb-segment">
              {index > 0 ? (
                <ChevronRight className="breadcrumb-separator" size={15} aria-hidden="true" />
              ) : null}
              <span>{segment}</span>
            </span>
          ))}
        </div>
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
            fileId={file.id}
            value={value}
            language={file.language}
            readOnly={!file.editable}
            onChange={onChange}
            getScrollPosition={getScrollPosition}
            onScrollPositionChange={onScrollPositionChange}
            getFoldRanges={getFoldRanges}
            onFoldRangesChange={onFoldRangesChange}
          />
        )}
      </div>
    </section>
  );
}
