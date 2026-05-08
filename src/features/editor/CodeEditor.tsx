"use client";

import { foldEffect, foldGutter, foldedRanges, unfoldEffect } from "@codemirror/language";
import { history, historyField, historyKeymap } from "@codemirror/commands";
import { EditorState, Transaction } from "@codemirror/state";
import {
  EditorView,
  ViewPlugin,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  type ViewUpdate,
} from "@codemirror/view";
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
  getEditorState: (fileId: string) => EditorSerializedState | null;
  getScrollPosition: (fileId: string) => EditorScrollPosition;
  onEditorStateChange: (fileId: string, state: EditorSerializedState) => void;
  onScrollPositionChange: (fileId: string, position: EditorScrollPosition) => void;
  getFoldRanges: (fileId: string) => EditorFoldRange[];
  onFoldRangesChange: (fileId: string, ranges: EditorFoldRange[]) => void;
  onCursorPositionChange: (fileId: string, position: EditorCursorPosition) => void;
  revealRequest: EditorRevealRequest | null;
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

export interface EditorCursorPosition {
  column: number;
  line: number;
}

export type EditorSerializedState = unknown;

export interface EditorRevealRequest {
  fileId: string;
  lineNumber: number;
  nonce: number;
}

const horizontalScrollTheme = EditorView.theme({
  ".cm-line": {
    boxSizing: "border-box",
    paddingRight: "96px",
  },
});

const activeLineTheme = EditorView.theme({
  "&": {
    position: "relative",
  },
  ".cm-activeVisualLine": {
    position: "absolute",
    zIndex: "1",
    pointerEvents: "none",
    boxShadow:
      "inset 0 2px 0 rgb(255 255 255 / 0.055), inset 0 -2px 0 rgb(255 255 255 / 0.055)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent !important",
    color: "#999999",
  },
});

const restoreScrollMeasureKey = {};
const activeVisualLineMeasureKey = {};
const scrollBeyondLastLineExtraPx = 1;
const editorStateFields = { history: historyField };

interface ActiveVisualLineMeasure {
  height: number;
  left: number;
  top: number;
  width: number;
}

const activeVisualLine = ViewPlugin.fromClass(
  class {
    private readonly marker: HTMLDivElement;

    constructor(private readonly view: EditorView) {
      this.marker = document.createElement("div");
      this.marker.className = "cm-activeVisualLine";
      this.marker.style.display = "none";
      this.view.dom.append(this.marker);
      this.view.scrollDOM.addEventListener("scroll", this.scheduleMeasure, { passive: true });
      this.scheduleMeasure();
    }

    update(update: ViewUpdate) {
      if (
        update.selectionSet ||
        update.docChanged ||
        update.viewportChanged ||
        update.geometryChanged
      ) {
        this.scheduleMeasure();
      }
    }

    destroy() {
      this.view.scrollDOM.removeEventListener("scroll", this.scheduleMeasure);
      this.marker.remove();
    }

    private readonly scheduleMeasure = () => {
      this.view.requestMeasure({
        key: activeVisualLineMeasureKey,
        read: (view) => {
          const cursor = view.state.selection.main.head;
          const cursorRect = view.coordsAtPos(cursor);

          if (!cursorRect) {
            return null;
          }

          const editorRect = view.dom.getBoundingClientRect();
          const contentRect = view.contentDOM.getBoundingClientRect();
          const scrollRect = view.scrollDOM.getBoundingClientRect();
          const contentLeft = contentRect.left - editorRect.left;
          const contentRight = scrollRect.left - editorRect.left + view.scrollDOM.clientWidth;

          return {
            height: Math.max(cursorRect.bottom - cursorRect.top, view.defaultLineHeight),
            left: contentLeft,
            top: cursorRect.top - editorRect.top,
            width: Math.max(0, contentRight - contentLeft),
          };
        },
        write: (measure) => {
          if (!measure) {
            this.marker.style.display = "none";
            return;
          }

          this.marker.style.display = "block";
          this.marker.style.left = `${measure.left}px`;
          this.marker.style.top = `${measure.top}px`;
          this.marker.style.width = `${measure.width}px`;
          this.marker.style.height = `${measure.height}px`;
        },
      });
    };
  },
);

const scrollBeyondLastLine = ViewPlugin.fromClass(
  class {
    private height = -1;

    constructor(private readonly view: EditorView) {
      this.updateBottomPadding();
    }

    update() {
      this.updateBottomPadding();
    }

    destroy() {
      this.view.contentDOM.style.paddingBottom = "";
    }

    private updateBottomPadding() {
      const lastLine = this.view.lineBlockAt(this.view.state.doc.length);
      const height = Math.max(
        0,
        this.view.scrollDOM.clientHeight -
          lastLine.height -
          this.view.documentPadding.top +
          scrollBeyondLastLineExtraPx,
      );

      if (height === this.height) {
        return;
      }

      this.height = height;
      this.view.contentDOM.style.paddingBottom = `${height}px`;
    }
  },
);

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
  ".cm-foldGutter > .cm-gutterElement:first-child": {
    opacity: "0 !important",
    pointerEvents: "none",
  },
  ".cm-foldGutter:hover .cm-gutterElement, .cm-foldGutter .cm-gutterElement:hover": {
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

function getEditorCursorPosition(view: EditorView): EditorCursorPosition {
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);

  return {
    column: head - line.from + 1,
    line: line.number,
  };
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

function editorExtensions(
  language: WorkspaceLanguage,
  readOnly: boolean,
  updateListener: (update: ViewUpdate) => void,
) {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    history({ newGroupDelay: 750 }),
    keymap.of(historyKeymap),
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
    activeVisualLine,
    activeLineTheme,
    language === "markdown" ? [] : bracketPairColors(),
    getCodeMirrorLanguage(language),
    EditorState.readOnly.of(readOnly),
    EditorView.editable.of(!readOnly),
    language === "markdown" ? EditorView.lineWrapping : horizontalScrollTheme,
    scrollBeyondLastLine,
    EditorView.updateListener.of(updateListener),
  ];
}

function createEditorState(
  fileId: string,
  value: string,
  language: WorkspaceLanguage,
  readOnly: boolean,
  getEditorState: (fileId: string) => EditorSerializedState | null,
  updateListener: (update: ViewUpdate) => void,
) {
  const extensions = editorExtensions(language, readOnly, updateListener);
  const serializedState = getEditorState(fileId);

  if (serializedState) {
    try {
      const restoredState = EditorState.fromJSON(
        serializedState,
        { extensions },
        editorStateFields,
      );

      if (restoredState.doc.toString() === value) {
        return restoredState;
      }
    } catch {
      // Ignore invalid cached state and fall back to a fresh editor state.
    }
  }

  return EditorState.create({
    doc: value,
    extensions,
  });
}

export function CodeEditor({
  fileId,
  value,
  language,
  readOnly,
  onChange,
  getEditorState,
  getScrollPosition,
  onEditorStateChange,
  onScrollPositionChange,
  getFoldRanges,
  onFoldRangesChange,
  onCursorPositionChange,
  revealRequest,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const getEditorStateRef = useRef(getEditorState);
  const getScrollPositionRef = useRef(getScrollPosition);
  const onEditorStateChangeRef = useRef(onEditorStateChange);
  const onScrollPositionChangeRef = useRef(onScrollPositionChange);
  const getFoldRangesRef = useRef(getFoldRanges);
  const onFoldRangesChangeRef = useRef(onFoldRangesChange);
  const onCursorPositionChangeRef = useRef(onCursorPositionChange);
  const fileIdRef = useRef(fileId);
  const suppressScrollSaveRef = useRef(false);
  const suppressFoldSaveRef = useRef(false);
  const suppressChangeRef = useRef(false);
  const lastRevealNonceRef = useRef<number | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    getEditorStateRef.current = getEditorState;
  }, [getEditorState]);

  useEffect(() => {
    onEditorStateChangeRef.current = onEditorStateChange;
  }, [onEditorStateChange]);

  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

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

  useEffect(() => {
    onCursorPositionChangeRef.current = onCursorPositionChange;
  }, [onCursorPositionChange]);

  useLayoutEffect(() => {
    const view = viewRef.current;
    const previousFileId = fileIdRef.current;

    if (view && previousFileId !== fileId) {
      onEditorStateChangeRef.current(previousFileId, view.state.toJSON(editorStateFields));
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

    container.ownerDocument.getSelection()?.removeAllRanges();

    const updateListener = (update: ViewUpdate) => {
      if (update.docChanged && !readOnly && !suppressChangeRef.current) {
        onChangeRef.current(update.state.doc.toString());
      }

      if (!suppressFoldSaveRef.current) {
        onFoldRangesChangeRef.current(fileIdRef.current, getEditorFoldRanges(update.view));
      }

      if (update.docChanged || update.selectionSet) {
        onEditorStateChangeRef.current(
          fileIdRef.current,
          update.state.toJSON(editorStateFields),
        );
      }

      if (update.selectionSet || update.docChanged) {
        onCursorPositionChangeRef.current(
          fileIdRef.current,
          getEditorCursorPosition(update.view),
        );
      }
    };

    const view = new EditorView({
      parent: container,
      state: createEditorState(
        fileId,
        valueRef.current,
        language,
        readOnly,
        getEditorStateRef.current,
        updateListener,
      ),
    });

    viewRef.current = view;
    const saveScrollPosition = () => {
      if (suppressScrollSaveRef.current) {
        return;
      }

      onScrollPositionChangeRef.current(fileIdRef.current, getEditorScrollPosition(view));
    };

    view.scrollDOM.addEventListener("scroll", saveScrollPosition, { passive: true });
    onCursorPositionChangeRef.current(fileIdRef.current, getEditorCursorPosition(view));
    view.focus();
    const focusFrame = requestAnimationFrame(() => {
      if (viewRef.current === view) {
        view.focus();
      }
    });

    return () => {
      cancelAnimationFrame(focusFrame);
      saveScrollPosition();
      onEditorStateChangeRef.current(fileIdRef.current, view.state.toJSON(editorStateFields));
      onFoldRangesChangeRef.current(fileIdRef.current, getEditorFoldRanges(view));
      view.scrollDOM.removeEventListener("scroll", saveScrollPosition);
      view.destroy();
      viewRef.current = null;
    };
  }, [fileId, language, readOnly]);

  useLayoutEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const current = view.state.doc.toString();

    if (current !== value) {
      suppressScrollSaveRef.current = true;
      suppressFoldSaveRef.current = true;
      suppressChangeRef.current = true;
      try {
        view.dispatch({
          changes: { from: 0, to: current.length, insert: value },
          annotations: Transaction.addToHistory.of(false),
        });
      } finally {
        suppressChangeRef.current = false;
      }

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

    if (!view || !revealRequest || revealRequest.fileId !== fileId) {
      return;
    }

    if (lastRevealNonceRef.current === revealRequest.nonce) {
      return;
    }

    lastRevealNonceRef.current = revealRequest.nonce;

    const lineNumber = Math.min(Math.max(1, revealRequest.lineNumber), view.state.doc.lines);
    const line = view.state.doc.line(lineNumber);

    suppressScrollSaveRef.current = true;
    view.dispatch({
      selection: { anchor: line.from },
      effects: EditorView.scrollIntoView(line.from, {
        y: "center",
      }),
    });

    requestAnimationFrame(() => {
      view.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, {
          y: "center",
        }),
      });
      view.focus();
      onCursorPositionChangeRef.current(fileId, getEditorCursorPosition(view));
      onScrollPositionChangeRef.current(fileId, getEditorScrollPosition(view));
      suppressScrollSaveRef.current = false;
    });
  }, [fileId, revealRequest]);

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

    if (revealRequest?.fileId === fileId) {
      suppressScrollSaveRef.current = false;
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
  }, [fileId, revealRequest]);

  return <div ref={containerRef} className="editor-host" data-testid="code-editor" />;
}
