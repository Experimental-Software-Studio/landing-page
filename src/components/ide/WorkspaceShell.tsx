"use client";

import { useCallback, useReducer, useRef } from "react";
import { ActivityBar } from "./ActivityBar";
import { CommandPaletteHint } from "./CommandPaletteHint";
import { EditorPane } from "./EditorPane";
import { FileExplorer } from "./FileExplorer";
import { StatusBar } from "./StatusBar";
import { TabBar } from "./TabBar";
import type { EditorScrollPosition } from "@/features/editor/CodeEditor";
import {
  createInitialWorkspaceState,
  getFileContent,
  workspaceReducer,
} from "@/features/workspace/workspace";

export function WorkspaceShell() {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () =>
    createInitialWorkspaceState(),
  );
  const scrollPositionsRef = useRef<Record<string, EditorScrollPosition>>({});

  const activeFile = state.filesById[state.activeFileId];
  const openTabs = state.openTabs.map((fileId) => state.filesById[fileId]).filter(Boolean);
  const mode = state.editorModes[activeFile.id] ?? "code";
  const content = getFileContent(state, activeFile.id);
  const getScrollPosition = useCallback(
    (fileId: string) => scrollPositionsRef.current[fileId] ?? { left: 0, top: 0 },
    [],
  );

  return (
    <main className="ide-shell">
      <header className="title-bar">
        <div className="traffic-lights" aria-hidden="true">
          <span className="traffic traffic-close" />
          <span className="traffic traffic-minimize" />
          <span className="traffic traffic-maximize" />
        </div>
        <div className="window-title">Experimental Software Studio - landing-page</div>
        <CommandPaletteHint />
      </header>

      <div className="workspace-grid">
        <ActivityBar />
        <FileExplorer
          tree={state.tree}
          activeFileId={state.activeFileId}
          onSelectFile={(fileId) => dispatch({ type: "openFile", fileId })}
          onPinFile={(fileId) => dispatch({ type: "pinFile", fileId })}
        />
        <div className="editor-workbench">
          <TabBar
            tabs={openTabs}
            activeFileId={state.activeFileId}
            previewTabId={state.previewTabId}
            onSelectTab={(fileId) => dispatch({ type: "openFile", fileId })}
            onPinTab={(fileId) => dispatch({ type: "pinFile", fileId })}
            onCloseTab={(fileId) => dispatch({ type: "closeTab", fileId })}
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
          />
        </div>
      </div>

      <StatusBar file={activeFile} mode={mode} openCount={openTabs.length} />
    </main>
  );
}
