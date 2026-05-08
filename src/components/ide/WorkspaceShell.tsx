"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ActivityBar, type ActivityView } from "./ActivityBar";
import { CommandPalette, type CommandPaletteCommand } from "./CommandPalette";
import { CommandPaletteHint } from "./CommandPaletteHint";
import { EditorPane } from "./EditorPane";
import { FileExplorer } from "./FileExplorer";
import { QuickOpen } from "./QuickOpen";
import { SearchPanel } from "./SearchPanel";
import { StatusBar } from "./StatusBar";
import { TabBar } from "./TabBar";
import type {
  EditorFoldRange,
  EditorRevealRequest,
  EditorScrollPosition,
} from "@/features/editor/CodeEditor";
import {
  createInitialWorkspaceState,
  getFileContent,
  workspaceReducer,
} from "@/features/workspace/workspace";

const defaultExplorerWidth = 288;
const minExplorerWidth = 168;
const maxExplorerWidth = 520;
const resizeKeyboardStep = 16;
const githubRepoUrl = "https://github.com/Experimental-Software-Studio/landing-page";

function clampExplorerWidth(width: number) {
  return Math.min(maxExplorerWidth, Math.max(minExplorerWidth, width));
}

export function WorkspaceShell() {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () =>
    createInitialWorkspaceState(),
  );
  const [explorerWidth, setExplorerWidth] = useState(defaultExplorerWidth);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeActivityView, setActiveActivityView] = useState<ActivityView>("explorer");
  const [searchQuery, setSearchQuery] = useState("");
  const [revealRequest, setRevealRequest] = useState<EditorRevealRequest | null>(null);
  const [isResizeHandleHoverActive, setIsResizeHandleHoverActive] = useState(false);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const scrollPositionsRef = useRef<Record<string, EditorScrollPosition>>({});
  const foldRangesRef = useRef<Record<string, EditorFoldRange[]>>({});
  const resizeHoverTimerRef = useRef<number | null>(null);

  const activeFile = state.filesById[state.activeFileId];
  const files = Object.values(state.filesById);
  const searchableFiles = files.map((file) => ({
    ...file,
    currentContent: getFileContent(state, file.id),
  }));
  const openTabs = state.openTabs.map((fileId) => state.filesById[fileId]).filter(Boolean);
  const mode = state.editorModes[activeFile.id] ?? "code";
  const content = getFileContent(state, activeFile.id);
  const openPinnedFile = useCallback((fileId: string) => {
    dispatch({ type: "pinFile", fileId });
  }, []);
  const openSearchMatch = useCallback(
    (fileId: string, lineNumber: number) => {
      dispatch({ type: "openFile", fileId });
      dispatch({ type: "setMode", fileId, mode: "code" });
      setRevealRequest({
        fileId,
        lineNumber,
        nonce: Date.now(),
      });
    },
    [],
  );
  const commandPaletteCommands = useMemo<CommandPaletteCommand[]>(
    () => [
      {
        id: "github.open-repository",
        label: "GitHub: Open Repository",
        detail: "Experimental-Software-Studio/landing-page",
        run: () => window.open(githubRepoUrl, "_blank", "noopener,noreferrer"),
      },
      {
        id: "github.open-issues",
        label: "GitHub: Open Issues",
        detail: "View repo issues",
        run: () => window.open(`${githubRepoUrl}/issues`, "_blank", "noopener,noreferrer"),
      },
      {
        id: "file.open-readme",
        label: "File: Open README",
        detail: "content/README.md",
        run: () => openPinnedFile("repo:content/README.md"),
      },
      {
        id: "file.open-roadmap",
        label: "File: Open Roadmap",
        detail: "content/roadmap.md",
        run: () => openPinnedFile("repo:content/roadmap.md"),
      },
      {
        id: "file.open-contributing",
        label: "File: Open Contributing Guide",
        detail: "content/contributing.md",
        run: () => openPinnedFile("repo:content/contributing.md"),
      },
    ],
    [openPinnedFile],
  );
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
  const selectActivityView = useCallback(
    (view: ActivityView) => {
      if (sidebarVisible && activeActivityView === view) {
        setSidebarVisible(false);
        return;
      }

      setActiveActivityView(view);
      setSidebarVisible(true);
    },
    [activeActivityView, sidebarVisible],
  );

  useEffect(() => {
    const openKeyboardPalette = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "p" || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        setQuickOpenVisible(false);
        setCommandPaletteVisible(true);
      } else {
        setCommandPaletteVisible(false);
        setQuickOpenVisible(true);
      }
    };

    window.addEventListener("keydown", openKeyboardPalette);

    return () => {
      window.removeEventListener("keydown", openKeyboardPalette);
    };
  }, []);

  return (
    <main
      className={sidebarVisible ? "ide-shell" : "ide-shell explorer-collapsed"}
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
        <ActivityBar
          activeView={activeActivityView}
          sidebarVisible={sidebarVisible}
          onSelectView={selectActivityView}
        />
        {sidebarVisible ? (
          <>
            {activeActivityView === "explorer" ? (
              <FileExplorer
                tree={state.tree}
                activeFileId={state.activeFileId}
                onSelectFile={(fileId) => dispatch({ type: "openFile", fileId })}
                onPinFile={(fileId) => dispatch({ type: "pinFile", fileId })}
              />
            ) : (
              <SearchPanel
                files={searchableFiles}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                onOpenMatch={openSearchMatch}
              />
            )}
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
          </>
        ) : null}
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
            revealRequest={revealRequest}
          />
        </div>
      </div>

      {quickOpenVisible ? (
        <QuickOpen
          files={files}
          activeFileId={state.activeFileId}
          onClose={() => setQuickOpenVisible(false)}
          onOpenFile={openPinnedFile}
        />
      ) : null}

      {commandPaletteVisible ? (
        <CommandPalette
          commands={commandPaletteCommands}
          onClose={() => setCommandPaletteVisible(false)}
        />
      ) : null}

      <StatusBar file={activeFile} mode={mode} openCount={openTabs.length} />
    </main>
  );
}
