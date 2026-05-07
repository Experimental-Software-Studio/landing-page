import { describe, expect, it } from "vitest";
import {
  createInitialWorkspaceState,
  getFileContent,
  workspaceReducer,
} from "./workspace";
import type { WorkspaceFile } from "./types";

const repoFile: WorkspaceFile = {
  id: "repo:src/app/page.tsx",
  path: "src/app/page.tsx",
  name: "page.tsx",
  extension: "tsx",
  content: "export default function Page() {}",
  editable: false,
  source: "repo",
  renderer: "code",
  language: "typescript",
};

const configFile: WorkspaceFile = {
  id: "repo:package.json",
  path: "package.json",
  name: "package.json",
  extension: "json",
  content: "{}",
  editable: false,
  source: "repo",
  renderer: "code",
  language: "json",
};

const readmeFile: WorkspaceFile = {
  id: "repo:content/README.md",
  path: "content/README.md",
  name: "README.md",
  extension: "md",
  content: "# README",
  editable: true,
  source: "content",
  renderer: "markdown",
  language: "markdown",
};

describe("workspaceReducer", () => {
  const readmeId = "repo:content/README.md";

  it("single-click opens files as a preview tab and replaces the existing preview", () => {
    const state = createInitialWorkspaceState([readmeFile, repoFile]);
    const next = workspaceReducer(state, { type: "openFile", fileId: repoFile.id });

    expect(next.activeFileId).toBe(repoFile.id);
    expect(next.openTabs).toEqual([repoFile.id]);
    expect(next.previewTabId).toBe(repoFile.id);
  });

  it("double-click pins a preview tab so later previews open separately", () => {
    const state = createInitialWorkspaceState([readmeFile, repoFile]);
    const pinned = workspaceReducer(state, { type: "pinFile", fileId: readmeId });
    const next = workspaceReducer(pinned, { type: "openFile", fileId: repoFile.id });

    expect(next.openTabs).toEqual([readmeId, repoFile.id]);
    expect(next.previewTabId).toBe(repoFile.id);
  });

  it("double-click pins the active preview tab", () => {
    const state = createInitialWorkspaceState([readmeFile, repoFile]);
    const preview = workspaceReducer(state, { type: "openFile", fileId: repoFile.id });
    const pinned = workspaceReducer(preview, { type: "pinFile", fileId: repoFile.id });

    expect(pinned.openTabs).toEqual([repoFile.id]);
    expect(pinned.previewTabId).toBeNull();
  });

  it("switches mode per file", () => {
    const state = createInitialWorkspaceState();
    const next = workspaceReducer(state, {
      type: "setMode",
      fileId: readmeId,
      mode: "preview",
    });

    expect(next.editorModes[readmeId]).toBe("preview");
  });

  it("edits editable files in memory", () => {
    const state = createInitialWorkspaceState();
    const next = workspaceReducer(state, {
      type: "updateContent",
      fileId: readmeId,
      content: "# Changed",
    });

    expect(getFileContent(next, readmeId)).toBe("# Changed");
  });

  it("blocks edits to read-only repo files", () => {
    const state = createInitialWorkspaceState([readmeFile, repoFile]);
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
      fileId: readmeId,
    });

    expect(next.openTabs).toEqual([readmeId]);
    expect(next.previewTabId).toBe(readmeId);
  });

  it("closes other tabs around the selected tab", () => {
    const state = createInitialWorkspaceState([readmeFile, repoFile, configFile]);
    const withPinnedReadme = workspaceReducer(state, { type: "pinFile", fileId: readmeId });
    const withRepo = workspaceReducer(withPinnedReadme, { type: "pinFile", fileId: repoFile.id });
    const withConfig = workspaceReducer(withRepo, { type: "pinFile", fileId: configFile.id });

    const next = workspaceReducer(withConfig, { type: "closeOtherTabs", fileId: repoFile.id });

    expect(next.openTabs).toEqual([repoFile.id]);
    expect(next.activeFileId).toBe(repoFile.id);
    expect(next.previewTabId).toBeNull();
  });

  it("closes tabs to the right of the selected tab", () => {
    const state = createInitialWorkspaceState([readmeFile, repoFile, configFile]);
    const withPinnedReadme = workspaceReducer(state, { type: "pinFile", fileId: readmeId });
    const withRepo = workspaceReducer(withPinnedReadme, { type: "pinFile", fileId: repoFile.id });
    const withConfig = workspaceReducer(withRepo, { type: "pinFile", fileId: configFile.id });

    const next = workspaceReducer(withConfig, { type: "closeTabsToRight", fileId: repoFile.id });

    expect(next.openTabs).toEqual([readmeId, repoFile.id]);
    expect(next.activeFileId).toBe(repoFile.id);
    expect(next.previewTabId).toBeNull();
  });
});
