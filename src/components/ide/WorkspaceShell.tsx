"use client";

import { useReducer } from "react";
import { ActivityBar } from "./ActivityBar";
import { CommandPaletteHint } from "./CommandPaletteHint";
import { EditorPane } from "./EditorPane";
import { FileExplorer } from "./FileExplorer";
import { StatusBar } from "./StatusBar";
import { TabBar } from "./TabBar";
import {
  createInitialWorkspaceState,
  getFileContent,
  workspaceReducer,
} from "@/features/workspace/workspace";

export function WorkspaceShell() {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () =>
    createInitialWorkspaceState(),
  );

  const activeFile = state.filesById[state.activeFileId];
  const openTabs = state.openTabs.map((fileId) => state.filesById[fileId]).filter(Boolean);
  const mode = state.editorModes[activeFile.id] ?? "code";
  const content = getFileContent(state, activeFile.id);

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
        />
        <div className="editor-workbench">
          <TabBar
            tabs={openTabs}
            activeFileId={state.activeFileId}
            onSelectTab={(fileId) => dispatch({ type: "openFile", fileId })}
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
          />
        </div>
      </div>

      <StatusBar file={activeFile} mode={mode} openCount={openTabs.length} />
    </main>
  );
}
