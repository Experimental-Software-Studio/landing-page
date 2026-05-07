import { repoMirrorFiles } from "@generated/repoMirror";
import { contentFiles } from "@/content/workspace/contentFiles";
import { buildWorkspaceTree } from "./tree";
import type { EditorMode, WorkspaceAction, WorkspaceFile, WorkspaceState } from "./types";

export const defaultFileId = "content-readme";

export function createInitialWorkspaceState(
  repoFiles: WorkspaceFile[] = repoMirrorFiles,
): WorkspaceState {
  const files = [...contentFiles, ...repoFiles];
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
