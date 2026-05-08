"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ActivityBar, type ActivityView } from "./ActivityBar";
import { CommandPalette, type CommandPaletteCommand } from "./CommandPalette";
import { EditorPane } from "./EditorPane";
import { FileExplorer } from "./FileExplorer";
import { QuickOpen } from "./QuickOpen";
import { SearchPanel } from "./SearchPanel";
import { SourceControlPanel } from "./SourceControlPanel";
import { StatusBar } from "./StatusBar";
import { TabBar } from "./TabBar";
import { gitCurrentBranch, gitHistoryCommits } from "@generated/gitHistory";
import type {
  EditorCursorPosition,
  EditorFoldRange,
  EditorRevealRequest,
  EditorSerializedState,
  EditorScrollPosition,
} from "@/features/editor/CodeEditor";
import {
  createInitialWorkspaceState,
  getFileContent,
  workspaceReducer,
} from "@/features/workspace/workspace";
import { contentRouteForFileId, contentRouteForSlug } from "@/features/workspace/contentRoutes";

const defaultExplorerWidth = 288;
const minExplorerWidth = 168;
const maxExplorerWidth = 520;
const resizeKeyboardStep = 16;
const githubRepoUrl = "https://github.com/Experimental-Software-Studio/landing-page";
const mobileSidebarQuery = "(max-width: 820px)";
type SidebarMode = "auto" | "open" | "closed";

function clampExplorerWidth(width: number) {
  return Math.min(maxExplorerWidth, Math.max(minExplorerWidth, width));
}

function subscribeToPathnameChanges(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getBrowserPathname() {
  return window.location.pathname;
}

interface WorkspaceShellProps {
  initialFileId?: string;
}

export function WorkspaceShell({ initialFileId }: WorkspaceShellProps) {
  const initialPathname = usePathname();
  const pathname = useSyncExternalStore(
    subscribeToPathnameChanges,
    getBrowserPathname,
    () => initialPathname,
  );
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () =>
    createInitialWorkspaceState(undefined, initialFileId),
  );
  const [explorerWidth, setExplorerWidth] = useState(defaultExplorerWidth);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("auto");
  const [activeActivityView, setActiveActivityView] = useState<ActivityView>("explorer");
  const [searchQuery, setSearchQuery] = useState("");
  const [revealRequest, setRevealRequest] = useState<EditorRevealRequest | null>(null);
  const [isResizeHandleHoverActive, setIsResizeHandleHoverActive] = useState(false);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const scrollPositionsRef = useRef<Record<string, EditorScrollPosition>>({});
  const editorStatesRef = useRef<Record<string, EditorSerializedState>>({});
  const foldRangesRef = useRef<Record<string, EditorFoldRange[]>>({});
  const lastHandledPathnameRef = useRef(pathname);
  const [cursorPositions, setCursorPositions] = useState<Record<string, EditorCursorPosition>>({});
  const resizeHoverTimerRef = useRef<number | null>(null);

  const activeFile = state.activeFileId ? state.filesById[state.activeFileId] : null;
  const files = Object.values(state.filesById);
  const searchableFiles = files
    .filter((file) => file.renderer !== "image")
    .map((file) => ({
      ...file,
      currentContent: getFileContent(state, file.id),
    }));
  const changedFiles = files.filter(
    (file) => file.editable && state.editedContents[file.id] !== undefined &&
      state.editedContents[file.id] !== file.content,
  );
  const modifiedFileIds = useMemo(
    () => new Set(changedFiles.map((file) => file.id)),
    [changedFiles],
  );
  const openTabs = state.openTabs.map((fileId) => state.filesById[fileId]).filter(Boolean);
  const mode = activeFile ? state.editorModes[activeFile.id] ?? "code" : "code";
  const content = activeFile ? getFileContent(state, activeFile.id) : "";
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
        id: "file.open-projects",
        label: "File: Open Projects",
        detail: "content/PROJECTS.md",
        run: () => openPinnedFile("repo:content/PROJECTS.md"),
      },
      {
        id: "file.open-about",
        label: "File: Open About",
        detail: "content/ABOUT.md",
        run: () => openPinnedFile("repo:content/ABOUT.md"),
      },
      {
        id: "file.open-contact",
        label: "File: Open Contact",
        detail: "content/CONTACT.md",
        run: () => openPinnedFile("repo:content/CONTACT.md"),
      },
      {
        id: "file.open-website",
        label: "File: Open Website",
        detail: "content/WEBSITE.md",
        run: () => openPinnedFile("repo:content/WEBSITE.md"),
      },
    ],
    [openPinnedFile],
  );
  const getScrollPosition = useCallback(
    (fileId: string) => scrollPositionsRef.current[fileId] ?? { left: 0, top: 0 },
    [],
  );
  const getEditorState = useCallback(
    (fileId: string) => editorStatesRef.current[fileId] ?? null,
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
    }, 350);
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
      const autoSidebarOpen = !window.matchMedia(mobileSidebarQuery).matches;
      const sidebarOpen = sidebarMode === "open" || (sidebarMode === "auto" && autoSidebarOpen);

      if (sidebarOpen && activeActivityView === view) {
        setSidebarMode("closed");
        return;
      }

      setActiveActivityView(view);
      setSidebarMode("open");
    },
    [activeActivityView, sidebarMode],
  );

  useEffect(() => {
    if (lastHandledPathnameRef.current === pathname) {
      return;
    }

    lastHandledPathnameRef.current = pathname;
    const route = contentRouteForSlug(pathname.replace(/^\/+/, ""));

    if (!route || route.fileId === state.activeFileId) {
      return;
    }

    dispatch({ type: "openFile", fileId: route.fileId });
  }, [pathname, state.activeFileId]);

  useEffect(() => {
    if (!state.activeFileId) {
      return;
    }

    const route = contentRouteForFileId(state.activeFileId);

    if (!route || route.route === pathname) {
      return;
    }

    window.history.pushState(null, "", route.route);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [pathname, state.activeFileId]);

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
      className={
        sidebarMode === "closed"
          ? "ide-shell explorer-collapsed"
          : sidebarMode === "open"
            ? "ide-shell sidebar-open"
            : "ide-shell sidebar-auto"
      }
      style={{ "--explorer-width": `${explorerWidth}px` } as CSSProperties}
    >
      <header className="title-bar">
        <div className="traffic-lights" aria-hidden="true">
          <span className="traffic traffic-close" />
          <span className="traffic traffic-minimize" />
          <span className="traffic traffic-maximize" />
        </div>
        <div className="window-title">Experimental Software Studio - landing-page</div>
      </header>

      <div className="workspace-grid">
        <ActivityBar
          activeView={activeActivityView}
          sidebarVisible={sidebarMode !== "closed"}
          sourceControlCount={changedFiles.length}
          onSelectView={selectActivityView}
        />
        {sidebarMode !== "closed" ? (
          <>
            {activeActivityView === "explorer" ? (
              <FileExplorer
                tree={state.tree}
                activeFileId={state.activeFileId}
                modifiedFileIds={modifiedFileIds}
                onSelectFile={(fileId) => dispatch({ type: "openFile", fileId })}
                onPinFile={(fileId) => dispatch({ type: "pinFile", fileId })}
              />
            ) : activeActivityView === "search" ? (
              <SearchPanel
                files={searchableFiles}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                onOpenMatch={openSearchMatch}
              />
            ) : (
              <SourceControlPanel
                changedFiles={changedFiles}
                commits={gitHistoryCommits}
                branchName={gitCurrentBranch}
                githubUrl={githubRepoUrl}
                onOpenFile={(fileId) => dispatch({ type: "openFile", fileId })}
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
            modifiedFileIds={modifiedFileIds}
            onSelectTab={(fileId) => dispatch({ type: "openFile", fileId })}
            onPinTab={(fileId) => dispatch({ type: "pinFile", fileId })}
            onCloseTab={(fileId) => dispatch({ type: "closeTab", fileId })}
            onCloseOtherTabs={(fileId) => dispatch({ type: "closeOtherTabs", fileId })}
            onCloseTabsToRight={(fileId) => dispatch({ type: "closeTabsToRight", fileId })}
            onReorderTab={(fileId, targetIndex) =>
              dispatch({ type: "reorderTab", fileId, targetIndex })
            }
          />
          {activeFile ? (
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
              getEditorState={getEditorState}
              getScrollPosition={getScrollPosition}
              onEditorStateChange={(fileId, editorState) => {
                editorStatesRef.current[fileId] = editorState;
              }}
              onScrollPositionChange={(fileId, position) => {
                scrollPositionsRef.current[fileId] = position;
              }}
              getFoldRanges={getFoldRanges}
              onFoldRangesChange={(fileId, ranges) => {
                foldRangesRef.current[fileId] = ranges;
              }}
              onCursorPositionChange={(fileId, position) => {
                setCursorPositions((current) =>
                  current[fileId]?.line === position.line &&
                  current[fileId]?.column === position.column
                    ? current
                    : { ...current, [fileId]: position },
                );
              }}
              revealRequest={revealRequest}
            />
          ) : (
            <EmptyEditorPane />
          )}
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

      <StatusBar
        file={activeFile}
        cursorPosition={activeFile ? cursorPositions[activeFile.id] : undefined}
      />
    </main>
  );
}

function EmptyEditorPane() {
  return (
    <section className="empty-editor-pane" aria-label="No open editors">
      <div className="empty-editor-mark" aria-hidden="true" />
    </section>
  );
}
