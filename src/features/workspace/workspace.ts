import { repoMirrorFiles } from "@generated/repoMirror";
import { buildWorkspaceTree } from "./tree";
import type { EditorMode, WorkspaceAction, WorkspaceFile, WorkspaceState } from "./types";

export const defaultFileId = "repo:content/README.md";

export function createInitialWorkspaceState(
  repoFiles: WorkspaceFile[] = repoMirrorFiles,
): WorkspaceState {
  const files = repoFiles;
  const filesById = Object.fromEntries(files.map((file) => [file.id, file]));
  const editorModes = Object.fromEntries(
    files.map((file): [string, EditorMode] => [file.id, "code"]),
  );

  return {
    tree: buildWorkspaceTree(files),
    filesById,
    openTabs: [defaultFileId],
    previewTabId: defaultFileId,
    activeFileId: defaultFileId,
    editorModes,
    editedContents: {},
  };
}

export function getFileContent(state: WorkspaceState, fileId: string) {
  return state.editedContents[fileId] ?? state.filesById[fileId]?.content ?? "";
}

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case "openFile": {
      if (!state.filesById[action.fileId]) {
        return state;
      }

      if (state.openTabs.includes(action.fileId)) {
        return {
          ...state,
          activeFileId: action.fileId,
        };
      }

      const openTabs = state.previewTabId
        ? state.openTabs.map((fileId) =>
            fileId === state.previewTabId ? action.fileId : fileId,
          )
        : [...state.openTabs, action.fileId];

      return {
        ...state,
        activeFileId: action.fileId,
        openTabs,
        previewTabId: action.fileId,
      };
    }

    case "pinFile": {
      if (!state.filesById[action.fileId]) {
        return state;
      }

      return {
        ...state,
        activeFileId: action.fileId,
        openTabs: state.openTabs.includes(action.fileId)
          ? state.openTabs
          : [...state.openTabs, action.fileId],
        previewTabId: state.previewTabId === action.fileId ? null : state.previewTabId,
      };
    }

    case "closeTab": {
      const nextTabs = state.openTabs.filter((fileId) => fileId !== action.fileId);

      if (nextTabs.length === 0) {
        return state;
      }

      const activeFileId =
        state.activeFileId === action.fileId ? nextTabs[nextTabs.length - 1] : state.activeFileId;

      return {
        ...state,
        openTabs: nextTabs,
        previewTabId: state.previewTabId === action.fileId ? null : state.previewTabId,
        activeFileId,
      };
    }

    case "closeOtherTabs": {
      if (!state.openTabs.includes(action.fileId)) {
        return state;
      }

      return {
        ...state,
        openTabs: [action.fileId],
        previewTabId: state.previewTabId === action.fileId ? action.fileId : null,
        activeFileId: action.fileId,
      };
    }

    case "closeTabsToRight": {
      const tabIndex = state.openTabs.indexOf(action.fileId);

      if (tabIndex === -1) {
        return state;
      }

      const nextTabs = state.openTabs.slice(0, tabIndex + 1);
      const activeFileId = nextTabs.includes(state.activeFileId) ? state.activeFileId : action.fileId;

      return {
        ...state,
        openTabs: nextTabs,
        previewTabId:
          state.previewTabId && nextTabs.includes(state.previewTabId) ? state.previewTabId : null,
        activeFileId,
      };
    }

    case "setMode": {
      if (!state.filesById[action.fileId]) {
        return state;
      }

      return {
        ...state,
        editorModes: {
          ...state.editorModes,
          [action.fileId]: action.mode,
        },
      };
    }

    case "updateContent": {
      const file = state.filesById[action.fileId];

      if (!file?.editable) {
        return state;
      }

      return {
        ...state,
        editedContents: {
          ...state.editedContents,
          [action.fileId]: action.content,
        },
      };
    }

    default:
      return state;
  }
}
