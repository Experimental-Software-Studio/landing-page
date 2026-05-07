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
  it("opens files and tracks active tabs", () => {
    const state = createInitialWorkspaceState([repoFile]);
    const next = workspaceReducer(state, { type: "openFile", fileId: repoFile.id });

    expect(next.activeFileId).toBe(repoFile.id);
    expect(next.openTabs).toContain("content-readme");
    expect(next.openTabs).toContain(repoFile.id);
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
  });
});
