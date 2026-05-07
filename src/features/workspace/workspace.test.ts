import { describe, expect, it } from "vitest";
import {
  createInitialWorkspaceState,
  getFileContent,
  workspaceReducer,
} from "./workspace";
import type { WorkspaceFile } from "./types";

const repoFile: WorkspaceFile = {
  id: "repo:src/app/page.tsx",
  path: "repo/src/app/page.tsx",
  name: "page.tsx",
  extension: "tsx",
  content: "export default function Page() {}",
  editable: false,
  source: "repo",
  renderer: "code",
  language: "typescript",
};

describe("workspaceReducer", () => {
  it("single-click opens files as a preview tab and replaces the existing preview", () => {
    const state = createInitialWorkspaceState([repoFile]);
    const next = workspaceReducer(state, { type: "openFile", fileId: repoFile.id });

    expect(next.activeFileId).toBe(repoFile.id);
    expect(next.openTabs).toEqual([repoFile.id]);
    expect(next.previewTabId).toBe(repoFile.id);
  });

  it("double-click pins a preview tab so later previews open separately", () => {
    const state = createInitialWorkspaceState([repoFile]);
    const pinned = workspaceReducer(state, { type: "pinFile", fileId: "content-readme" });
    const next = workspaceReducer(pinned, { type: "openFile", fileId: repoFile.id });

    expect(next.openTabs).toEqual(["content-readme", repoFile.id]);
    expect(next.previewTabId).toBe(repoFile.id);
  });

  it("double-click pins the active preview tab", () => {
    const state = createInitialWorkspaceState([repoFile]);
    const preview = workspaceReducer(state, { type: "openFile", fileId: repoFile.id });
    const pinned = workspaceReducer(preview, { type: "pinFile", fileId: repoFile.id });

    expect(pinned.openTabs).toEqual([repoFile.id]);
    expect(pinned.previewTabId).toBeNull();
  });

  it("switches mode per file", () => {
    const state = createInitialWorkspaceState();
    const next = workspaceReducer(state, {
      type: "setMode",
      fileId: "content-readme",
      mode: "preview",
    });

    expect(next.editorModes["content-readme"]).toBe("preview");
  });

  it("edits editable files in memory", () => {
    const state = createInitialWorkspaceState();
    const next = workspaceReducer(state, {
      type: "updateContent",
      fileId: "content-readme",
      content: "# Changed",
    });

    expect(getFileContent(next, "content-readme")).toBe("# Changed");
  });

  it("blocks edits to read-only repo files", () => {
    const state = createInitialWorkspaceState([repoFile]);
    const next = workspaceReducer(state, {
      type: "updateContent",
      fileId: repoFile.id,
      content: "mutated",
    });

    expect(getFileContent(next, repoFile.id)).toBe(repoFile.content);
  });

  it("keeps at least one tab open", () => {
    const state = createInitialWorkspaceState();
    const next = workspaceReducer(state, {
      type: "closeTab",
      fileId: "content-readme",
    });

    expect(next.openTabs).toEqual(["content-readme"]);
    expect(next.previewTabId).toBe("content-readme");
  });
});
