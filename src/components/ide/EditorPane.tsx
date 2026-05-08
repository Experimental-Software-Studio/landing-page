"use client";

import { ChevronRight, Eye, FileCode2, Lock } from "lucide-react";
import {
  CodeEditor,
  type EditorCursorPosition,
  type EditorRevealRequest,
  type EditorFoldRange,
  type EditorSerializedState,
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
  getEditorState: (fileId: string) => EditorSerializedState | null;
  getScrollPosition: (fileId: string) => EditorScrollPosition;
  onEditorStateChange: (fileId: string, state: EditorSerializedState) => void;
  onScrollPositionChange: (fileId: string, position: EditorScrollPosition) => void;
  getFoldRanges: (fileId: string) => EditorFoldRange[];
  onFoldRangesChange: (fileId: string, ranges: EditorFoldRange[]) => void;
  onCursorPositionChange: (fileId: string, position: EditorCursorPosition) => void;
  revealRequest: EditorRevealRequest | null;
}

export function EditorPane({
  file,
  value,
  mode,
  onModeChange,
  onChange,
  getEditorState,
  getScrollPosition,
  onEditorStateChange,
  onScrollPositionChange,
  getFoldRanges,
  onFoldRangesChange,
  onCursorPositionChange,
  revealRequest,
}: EditorPaneProps) {
  const canPreview = file.renderer === "markdown";
  const isImage = file.renderer === "image";
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
          {canPreview && !isImage ? (
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
        {isImage ? (
          <ImagePreview file={file} />
        ) : canPreview && mode === "preview" ? (
          <MarkdownPreview markdown={value} />
        ) : (
          <CodeEditor
            key={file.id}
            fileId={file.id}
            value={value}
            language={file.language}
            readOnly={!file.editable}
            onChange={onChange}
            getEditorState={getEditorState}
            getScrollPosition={getScrollPosition}
            onEditorStateChange={onEditorStateChange}
            onScrollPositionChange={onScrollPositionChange}
            getFoldRanges={getFoldRanges}
            onFoldRangesChange={onFoldRangesChange}
            onCursorPositionChange={onCursorPositionChange}
            revealRequest={revealRequest}
          />
        )}
      </div>
    </section>
  );
}

function ImagePreview({ file }: { file: WorkspaceFile }) {
  return (
    <div className="image-preview" aria-label={`${file.name} image preview`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={file.content} alt={file.name} className="image-preview-image" />
      <div className="image-preview-caption">{file.path}</div>
    </div>
  );
}
