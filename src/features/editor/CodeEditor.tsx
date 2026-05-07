"use client";

import { foldEffect, foldGutter, foldedRanges, unfoldEffect } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { WorkspaceLanguage } from "@/features/workspace/types";
import { bracketPairColors } from "./bracketPairColors";
import { getCodeMirrorLanguage } from "./languageExtensions";

interface CodeEditorProps {
  fileId: string;
  value: string;
  language: WorkspaceLanguage;
  readOnly: boolean;
  onChange: (value: string) => void;
  getScrollPosition: (fileId: string) => EditorScrollPosition;
  onScrollPositionChange: (fileId: string, position: EditorScrollPosition) => void;
  getFoldRanges: (fileId: string) => EditorFoldRange[];
  onFoldRangesChange: (fileId: string, ranges: EditorFoldRange[]) => void;
}

export interface EditorScrollPosition {
  anchor?: number;
  left: number;
  top: number;
  yMargin?: number;
}

export interface EditorFoldRange {
  from: number;
  to: number;
}

const horizontalScrollTheme = EditorView.theme({
  ".cm-line": {
    boxSizing: "border-box",
    paddingRight: "96px",
  },
});

const restoreScrollMeasureKey = {};

const foldingTheme = EditorView.baseTheme({
  ".cm-foldGutter": {
    width: "16px",
  },
  ".cm-foldGutter .cm-gutterElement": {
    color: "#c5c5c5",
    cursor: "pointer",
    opacity: "0",
    transition: "opacity 120ms ease",
  },
  ".cm-gutters:hover .cm-foldGutter .cm-gutterElement, .cm-foldGutter .cm-gutterElement:hover": {
    opacity: "1",
  },
  ".cm-foldGutter .cm-gutterElement:has(.is-folded)": {
    opacity: "1",
  },
  ".cm-fold-chevron": {
    alignItems: "center",
    display: "inline-flex",
    height: "100%",
    justifyContent: "center",
    width: "14px",
  },
  ".cm-fold-chevron svg": {
    display: "block",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "0",
    borderRadius: "2px",
    color: "#cccccc",
    margin: "0 3px",
    padding: "0",
  },
});

function foldMarker(open: boolean) {
  const marker = document.createElement("span");
  marker.className = open ? "cm-fold-chevron" : "cm-fold-chevron is-folded";
  marker.setAttribute("aria-hidden", "true");
  marker.innerHTML = open
    ? '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 5.25 7 8.75l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M5.25 3.5 8.75 7l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  return marker;
}

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

function getEditorFoldRanges(view: EditorView): EditorFoldRange[] {
  const ranges: EditorFoldRange[] = [];

  foldedRanges(view.state).between(0, view.state.doc.length, (from, to) => {
    ranges.push({ from, to });
  });

  return ranges;
}

function getValidFoldRanges(view: EditorView, ranges: EditorFoldRange[]) {
  return ranges.filter(({ from, to }) => from < to && to <= view.state.doc.length);
}

function restoreEditorFoldRanges(view: EditorView, ranges: EditorFoldRange[]) {
  const currentRanges = getEditorFoldRanges(view);
  const effects = [
    ...currentRanges.map((range) => unfoldEffect.of(range)),
    ...getValidFoldRanges(view, ranges).map((range) => foldEffect.of(range)),
  ];

  if (effects.length > 0) {
    view.dispatch({ effects });
  }
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
  getFoldRanges,
  onFoldRangesChange,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const getScrollPositionRef = useRef(getScrollPosition);
  const onScrollPositionChangeRef = useRef(onScrollPositionChange);
  const getFoldRangesRef = useRef(getFoldRanges);
  const onFoldRangesChangeRef = useRef(onFoldRangesChange);
  const fileIdRef = useRef(fileId);
  const suppressScrollSaveRef = useRef(false);
  const suppressFoldSaveRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    getScrollPositionRef.current = getScrollPosition;
  }, [getScrollPosition]);

  useEffect(() => {
    onScrollPositionChangeRef.current = onScrollPositionChange;
  }, [onScrollPositionChange]);

  useEffect(() => {
    getFoldRangesRef.current = getFoldRanges;
  }, [getFoldRanges]);

  useEffect(() => {
    onFoldRangesChangeRef.current = onFoldRangesChange;
  }, [onFoldRangesChange]);

  useLayoutEffect(() => {
    const view = viewRef.current;
    const previousFileId = fileIdRef.current;

    if (view && previousFileId !== fileId) {
      onScrollPositionChangeRef.current(previousFileId, getEditorScrollPosition(view));
      onFoldRangesChangeRef.current(previousFileId, getEditorFoldRanges(view));
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
          foldGutter({
            markerDOM: foldMarker,
          }),
          foldingTheme,
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
          language === "markdown" ? [] : bracketPairColors(),
          getCodeMirrorLanguage(language),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          language === "markdown" ? EditorView.lineWrapping : horizontalScrollTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !readOnly) {
              onChangeRef.current(update.state.doc.toString());
            }

            if (!suppressFoldSaveRef.current) {
              onFoldRangesChangeRef.current(fileIdRef.current, getEditorFoldRanges(update.view));
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
      onFoldRangesChangeRef.current(fileIdRef.current, getEditorFoldRanges(view));
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
      suppressFoldSaveRef.current = true;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });

      const releaseFoldSave = window.setTimeout(() => {
        suppressFoldSaveRef.current = false;
      }, 120);

      return () => {
        window.clearTimeout(releaseFoldSave);
      };
    }
  }, [value]);

  useLayoutEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    suppressFoldSaveRef.current = true;
    restoreEditorFoldRanges(view, getFoldRangesRef.current(fileId));

    const releaseFoldSave = window.setTimeout(() => {
      suppressFoldSaveRef.current = false;
    }, 120);

    return () => {
      window.clearTimeout(releaseFoldSave);
    };
  }, [fileId]);

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
