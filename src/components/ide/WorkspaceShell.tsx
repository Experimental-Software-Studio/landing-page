"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ActivityBar } from "./ActivityBar";
import { CommandPaletteHint } from "./CommandPaletteHint";
import { EditorPane } from "./EditorPane";
import { FileExplorer } from "./FileExplorer";
import { QuickOpen } from "./QuickOpen";
import { StatusBar } from "./StatusBar";
import { TabBar } from "./TabBar";
import type { EditorFoldRange, EditorScrollPosition } from "@/features/editor/CodeEditor";
import {
  createInitialWorkspaceState,
  getFileContent,
  workspaceReducer,
} from "@/features/workspace/workspace";

const defaultExplorerWidth = 288;
const minExplorerWidth = 168;
const maxExplorerWidth = 520;
const resizeKeyboardStep = 16;

function clampExplorerWidth(width: number) {
  return Math.min(maxExplorerWidth, Math.max(minExplorerWidth, width));
}

export function WorkspaceShell() {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () =>
    createInitialWorkspaceState(),
  );
  const [explorerWidth, setExplorerWidth] = useState(defaultExplorerWidth);
  const [isResizeHandleHoverActive, setIsResizeHandleHoverActive] = useState(false);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const scrollPositionsRef = useRef<Record<string, EditorScrollPosition>>({});
  const foldRangesRef = useRef<Record<string, EditorFoldRange[]>>({});
  const resizeHoverTimerRef = useRef<number | null>(null);

  const activeFile = state.filesById[state.activeFileId];
  const files = Object.values(state.filesById);
  const openTabs = state.openTabs.map((fileId) => state.filesById[fileId]).filter(Boolean);
  const mode = state.editorModes[activeFile.id] ?? "code";
  const content = getFileContent(state, activeFile.id);
  const getScrollPosition = useCallback(
    (fileId: string) => scrollPositionsRef.current[fileId] ?? { left: 0, top: 0 },
    [],
  );
  const getFoldRanges = useCallback((fileId: string) => foldRangesRef.current[fileId] ?? [], []);
  const clearResizeHoverTimer = useCallback(() => {
    if (resizeHoverTimerRef.current === null) {
      return;
    }

    window.clearTimeout(resizeHoverTimerRef.current);
    resizeHoverTimerRef.current = null;
  }, []);
  const showResizeHoverAfterDelay = useCallback(() => {
    clearResizeHoverTimer();
    resizeHoverTimerRef.current = window.setTimeout(() => {
      setIsResizeHandleHoverActive(true);
      resizeHoverTimerRef.current = null;
    }, 500);
  }, [clearResizeHoverTimer]);
  const hideResizeHover = useCallback(() => {
    clearResizeHoverTimer();
    setIsResizeHandleHoverActive(false);
  }, [clearResizeHoverTimer]);
  const resizeExplorerBy = useCallback((delta: number) => {
    setExplorerWidth((current) => clampExplorerWidth(current + delta));
  }, []);
  const startExplorerResize = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = explorerWidth;
    const body = event.currentTarget.ownerDocument.body;

    clearResizeHoverTimer();
    setIsResizeHandleHoverActive(true);
    body.classList.add("is-resizing-explorer");

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setExplorerWidth(clampExplorerWidth(startWidth + moveEvent.clientX - startX));
    };

    const stopResize = () => {
      body.classList.remove("is-resizing-explorer");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  }, [clearResizeHoverTimer, explorerWidth]);

  useEffect(() => {
    const openQuickOpen = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "p" || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      setQuickOpenVisible(true);
    };

    window.addEventListener("keydown", openQuickOpen);

    return () => {
      window.removeEventListener("keydown", openQuickOpen);
    };
  }, []);

  return (
    <main
      className="ide-shell"
      style={{ "--explorer-width": `${explorerWidth}px` } as CSSProperties}
    >
      <header className="title-bar">
        <div className="traffic-lights" aria-hidden="true">
          <span className="traffic traffic-close" />
          <span className="traffic traffic-minimize" />
          <span className="traffic traffic-maximize" />
        </div>
        <div className="window-title">Experimental Software Studio - landing-page</div>
        <CommandPaletteHint onOpen={() => setQuickOpenVisible(true)} />
      </header>

      <div className="workspace-grid">
        <ActivityBar />
        <FileExplorer
          tree={state.tree}
          activeFileId={state.activeFileId}
          onSelectFile={(fileId) => dispatch({ type: "openFile", fileId })}
          onPinFile={(fileId) => dispatch({ type: "pinFile", fileId })}
        />
        <div
          className="explorer-resizer"
          data-hover-active={isResizeHandleHoverActive}
          role="separator"
          aria-label="Resize explorer"
          aria-orientation="vertical"
          aria-valuemin={minExplorerWidth}
          aria-valuemax={maxExplorerWidth}
          aria-valuenow={explorerWidth}
          tabIndex={0}
          onPointerDown={startExplorerResize}
          onPointerEnter={showResizeHoverAfterDelay}
          onPointerLeave={hideResizeHover}
          onBlur={hideResizeHover}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              resizeExplorerBy(-resizeKeyboardStep);
            }

            if (event.key === "ArrowRight") {
              event.preventDefault();
              resizeExplorerBy(resizeKeyboardStep);
            }
          }}
        />
        <div className="editor-workbench">
          <TabBar
            tabs={openTabs}
            activeFileId={state.activeFileId}
            previewTabId={state.previewTabId}
            onSelectTab={(fileId) => dispatch({ type: "openFile", fileId })}
            onPinTab={(fileId) => dispatch({ type: "pinFile", fileId })}
            onCloseTab={(fileId) => dispatch({ type: "closeTab", fileId })}
            onCloseOtherTabs={(fileId) => dispatch({ type: "closeOtherTabs", fileId })}
            onCloseTabsToRight={(fileId) => dispatch({ type: "closeTabsToRight", fileId })}
            onReorderTab={(fileId, targetIndex) =>
              dispatch({ type: "reorderTab", fileId, targetIndex })
            }
          />
          <EditorPane
            file={activeFile}
            value={content}
            mode={mode}
            onModeChange={(nextMode) =>
              dispatch({ type: "setMode", fileId: activeFile.id, mode: nextMode })
            }
            onChange={(nextContent) =>
              dispatch({
                type: "updateContent",
                fileId: activeFile.id,
                content: nextContent,
              })
            }
            getScrollPosition={getScrollPosition}
            onScrollPositionChange={(fileId, position) => {
              scrollPositionsRef.current[fileId] = position;
            }}
            getFoldRanges={getFoldRanges}
            onFoldRangesChange={(fileId, ranges) => {
              foldRangesRef.current[fileId] = ranges;
            }}
          />
        </div>
      </div>

      {quickOpenVisible ? (
        <QuickOpen
          files={files}
          activeFileId={state.activeFileId}
          onClose={() => setQuickOpenVisible(false)}
          onOpenFile={(fileId) => dispatch({ type: "pinFile", fileId })}
        />
      ) : null}

      <StatusBar file={activeFile} mode={mode} openCount={openTabs.length} />
    </main>
  );
}
