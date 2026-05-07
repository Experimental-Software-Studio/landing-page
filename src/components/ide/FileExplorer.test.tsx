import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileExplorer } from "./FileExplorer";
import { createInitialWorkspaceState } from "@/features/workspace/workspace";

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
      />,
    );

    await user.click(screen.getByRole("button", { name: /philosophy.md/i }));

    expect(onSelectFile).toHaveBeenCalledWith("content-philosophy");
  });
});
