import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FileExplorer, getInitiallyExpandedFolderIds } from "./FileExplorer";
import { createInitialWorkspaceState } from "@/features/workspace/workspace";
import type { WorkspaceFolder } from "@/features/workspace/types";

function renderFileExplorer({
  activeFileId,
  tree,
  onPinFile = vi.fn(),
  onSelectFile = vi.fn(),
}: {
  activeFileId: string | null;
  tree: WorkspaceFolder;
  onPinFile?: (fileId: string) => void;
  onSelectFile?: (fileId: string) => void;
}) {
  function FileExplorerHarness() {
    const [expandedFolderIds, setExpandedFolderIds] = useState(() =>
      getInitiallyExpandedFolderIds(tree, activeFileId),
    );

    return (
      <FileExplorer
        tree={tree}
        activeFileId={activeFileId}
        expandedFolderIds={expandedFolderIds}
        onSelectFile={onSelectFile}
        onPinFile={onPinFile}
        onExpandedFolderIdsChange={setExpandedFolderIds}
      />
    );
  }

  return render(<FileExplorerHarness />);
}

describe("FileExplorer", () => {
  it("selects files from the tree", async () => {
    const user = userEvent.setup();
    const onSelectFile = vi.fn();
    const state = createInitialWorkspaceState();

    renderFileExplorer({
      tree: state.tree,
      activeFileId: state.activeFileId,
      onSelectFile,
    });

    await user.click(screen.getByRole("button", { name: /ABOUT.md/i }));

    expect(onSelectFile).toHaveBeenCalledWith("repo:content/ABOUT.md");
  });

  it("preserves nested folder expansion state when a parent is collapsed", async () => {
    const user = userEvent.setup();
    const onSelectFile = vi.fn();
    const state = createInitialWorkspaceState();
    const tree = state.tree.children.find((node) => node.name === "src") as WorkspaceFolder;

    renderFileExplorer({
      tree,
      activeFileId: state.activeFileId,
      onSelectFile,
    });

    await user.click(screen.getByRole("button", { name: "app" }));
    await user.click(screen.getByRole("button", { name: "app" }));
    await user.click(screen.getByRole("button", { name: "src" }));
    await user.click(screen.getByRole("button", { name: "src" }));

    expect(screen.queryByRole("button", { name: "globals.css" })).not.toBeInTheDocument();
  });

  it("collapses expanded folders from the root action", async () => {
    const user = userEvent.setup();
    const state = createInitialWorkspaceState();

    renderFileExplorer({
      tree: state.tree,
      activeFileId: state.activeFileId,
    });

    expect(screen.getByRole("button", { name: /ABOUT.md/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse all folders" }));

    expect(screen.queryByRole("button", { name: /ABOUT.md/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "LANDING-PAGE" })).toBeInTheDocument();
  });

  it("pins files on double click", async () => {
    const user = userEvent.setup();
    const state = createInitialWorkspaceState();
    const onPinFile = vi.fn();

    renderFileExplorer({
      tree: state.tree,
      activeFileId: state.activeFileId,
      onPinFile,
    });

    await user.dblClick(screen.getByRole("button", { name: /ABOUT.md/i }));

    expect(onPinFile).toHaveBeenCalledWith("repo:content/ABOUT.md");
  });
});
