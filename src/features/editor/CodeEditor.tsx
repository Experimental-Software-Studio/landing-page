"use client";

import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { useEffect, useRef } from "react";
import type { WorkspaceLanguage } from "@/features/workspace/types";
import { getCodeMirrorLanguage } from "./languageExtensions";

interface CodeEditorProps {
  value: string;
  language: WorkspaceLanguage;
  readOnly: boolean;
  onChange: (value: string) => void;
}

export function CodeEditor({ value, language, readOnly, onChange }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: "",
        extensions: [
          lineNumbers(),
          vscodeDark,
          getCodeMirrorLanguage(language),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !readOnly) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, readOnly]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const current = view.state.doc.toString();

    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} className="editor-host" data-testid="code-editor" />;
}
