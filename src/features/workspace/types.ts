export type WorkspaceFileSource = "content" | "repo";
export type WorkspaceRenderer = "markdown" | "code";
export type WorkspaceLanguage =
  | "markdown"
  | "typescript"
  | "javascript"
  | "json"
  | "css"
  | "html"
  | "yaml"
  | "text";

export type EditorMode = "code" | "preview";

export interface WorkspaceFile {
  id: string;
  path: string;
  name: string;
  extension: string;
  content: string;
  editable: boolean;
  source: WorkspaceFileSource;
  renderer: WorkspaceRenderer;
  language: WorkspaceLanguage;
}

export interface WorkspaceFolder {
  id: string;
  path: string;
  name: string;
  children: WorkspaceNode[];
}

export type WorkspaceNode = WorkspaceFile | WorkspaceFolder;

export interface WorkspaceState {
  tree: WorkspaceFolder;
  filesById: Record<string, WorkspaceFile>;
  openTabs: string[];
  previewTabId: string | null;
  activeFileId: string;
  editorModes: Record<string, EditorMode>;
  editedContents: Record<string, string>;
}

export type WorkspaceAction =
  | { type: "openFile"; fileId: string }
  | { type: "pinFile"; fileId: string }
  | { type: "closeTab"; fileId: string }
  | { type: "closeOtherTabs"; fileId: string }
  | { type: "closeTabsToRight"; fileId: string }
  | { type: "reorderTab"; fileId: string; targetIndex: number }
  | { type: "setMode"; fileId: string; mode: EditorMode }
  | { type: "updateContent"; fileId: string; content: string };

export function isWorkspaceFile(node: WorkspaceNode): node is WorkspaceFile {
  return "content" in node;
}
