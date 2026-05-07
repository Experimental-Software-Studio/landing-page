"use client";

import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { WorkspaceLanguage } from "@/features/workspace/types";
import { getCodeMirrorLanguage } from "./languageExtensions";

interface CodeEditorProps {
  fileId: string;
  value: string;
  language: WorkspaceLanguage;
  readOnly: boolean;
  onChange: (value: string) => void;
  getScrollPosition: (fileId: string) => EditorScrollPosition;
  onScrollPositionChange: (fileId: string, position: EditorScrollPosition) => void;
}

export interface EditorScrollPosition {
  anchor?: number;
  left: number;
  top: number;
  yMargin?: number;
}

const horizontalScrollTheme = EditorView.theme({
  ".cm-line": {
    boxSizing: "border-box",
    paddingRight: "96px",
  },
});

const restoreScrollMeasureKey = {};

function getEditorScrollPosition(view: EditorView): EditorScrollPosition {
  const top = view.scrollDOM.scrollTop;
  const block = view.lineBlockAtHeight(top);

  return {
    anchor: block.from,
    left: view.scrollDOM.scrollLeft,
    top,
    yMargin: block.top - top,
  };
}

function restoreEditorScroll(
  view: EditorView,
  position: EditorScrollPosition,
  onRestored: () => void,
) {
  const applyScroll = () => {
    view.scrollDOM.scrollTo({
      left: position.left,
      top: position.top,
    });
  };

  if (typeof position.anchor === "number") {
    view.dispatch({
      effects: EditorView.scrollIntoView(Math.min(position.anchor, view.state.doc.length), {
        x: "start",
        xMargin: Math.min(position.left, Math.max(0, view.scrollDOM.clientWidth - 1)),
        y: "start",
        yMargin: position.yMargin ?? 0,
      }),
    });
  }

  applyScroll();
  view.requestMeasure({
    key: restoreScrollMeasureKey,
    read: () => null,
    write: () => {
      applyScroll();
      requestAnimationFrame(() => {
        applyScroll();
        view.requestMeasure();
        onRestored();
      });
    },
  });
}

export function CodeEditor({
  fileId,
  value,
  language,
  readOnly,
  onChange,
  getScrollPosition,
  onScrollPositionChange,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const getScrollPositionRef = useRef(getScrollPosition);
  const onScrollPositionChangeRef = useRef(onScrollPositionChange);
  const fileIdRef = useRef(fileId);
  const suppressScrollSaveRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    getScrollPositionRef.current = getScrollPosition;
  }, [getScrollPosition]);

  useEffect(() => {
    onScrollPositionChangeRef.current = onScrollPositionChange;
  }, [onScrollPositionChange]);

  useLayoutEffect(() => {
    const view = viewRef.current;
    const previousFileId = fileIdRef.current;

    if (view && previousFileId !== fileId) {
      onScrollPositionChangeRef.current(previousFileId, getEditorScrollPosition(view));
    }

    fileIdRef.current = fileId;
  }, [fileId]);

  useLayoutEffect(() => {
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
          indentationMarkers({
            highlightActiveBlock: false,
            hideFirstIndent: true,
            markerType: "codeOnly",
            thickness: 1,
            colors: {
              dark: "#404040",
              activeDark: "#707070",
            },
          }),
          getCodeMirrorLanguage(language),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          language === "markdown" ? EditorView.lineWrapping : horizontalScrollTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !readOnly) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });

    viewRef.current = view;
    const saveScrollPosition = () => {
      if (suppressScrollSaveRef.current) {
        return;
      }

      onScrollPositionChangeRef.current(fileIdRef.current, getEditorScrollPosition(view));
    };

    view.scrollDOM.addEventListener("scroll", saveScrollPosition, { passive: true });

    return () => {
      saveScrollPosition();
      view.scrollDOM.removeEventListener("scroll", saveScrollPosition);
      view.destroy();
      viewRef.current = null;
    };
  }, [language, readOnly]);

  useLayoutEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const current = view.state.doc.toString();

    if (current !== value) {
      suppressScrollSaveRef.current = true;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  useLayoutEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const nextPosition = getScrollPositionRef.current(fileId);

    suppressScrollSaveRef.current = true;
    const releaseScrollSave = () => {
      suppressScrollSaveRef.current = false;
    };
    const releaseTimer = window.setTimeout(releaseScrollSave, 120);

    restoreEditorScroll(view, nextPosition, releaseScrollSave);

    return () => {
      window.clearTimeout(releaseTimer);
    };
  }, [fileId]);

  return <div ref={containerRef} className="editor-host" data-testid="code-editor" />;
}
