import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileExplorer } from "./FileExplorer";
import { createInitialWorkspaceState } from "@/features/workspace/workspace";
import type { WorkspaceFolder } from "@/features/workspace/types";

describe("FileExplorer", () => {
  it("selects files from the tree", async () => {
    const user = userEvent.setup();
    const onSelectFile = vi.fn();
    const state = createInitialWorkspaceState();

    render(
      <FileExplorer
        tree={state.tree}
        activeFileId={state.activeFileId}
        onSelectFile={onSelectFile}
        onPinFile={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /ABOUT.md/i }));

    expect(onSelectFile).toHaveBeenCalledWith("repo:content/ABOUT.md");
  });

  it("preserves nested folder expansion state when a parent is collapsed", async () => {
    const user = userEvent.setup();
    const onSelectFile = vi.fn();
    const state = createInitialWorkspaceState();
    const tree = state.tree.children.find((node) => node.name === "src") as WorkspaceFolder;

    render(
      <FileExplorer
        tree={tree}
        activeFileId={state.activeFileId}
        onSelectFile={onSelectFile}
        onPinFile={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "app" }));
    await user.click(screen.getByRole("button", { name: "app" }));
    await user.click(screen.getByRole("button", { name: "src" }));
    await user.click(screen.getByRole("button", { name: "src" }));

    expect(screen.queryByRole("button", { name: "globals.css" })).not.toBeInTheDocument();
  });

  it("pins files on double click", async () => {
    const user = userEvent.setup();
    const state = createInitialWorkspaceState();
    const onPinFile = vi.fn();

    render(
      <FileExplorer
        tree={state.tree}
        activeFileId={state.activeFileId}
        onSelectFile={vi.fn()}
        onPinFile={onPinFile}
      />,
    );

    await user.dblClick(screen.getByRole("button", { name: /ABOUT.md/i }));

    expect(onPinFile).toHaveBeenCalledWith("repo:content/ABOUT.md");
  });
});
