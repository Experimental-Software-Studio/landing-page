import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TabBar } from "./TabBar";
import type { WorkspaceFile } from "@/features/workspace/types";

const tabs: WorkspaceFile[] = [
  {
    id: "repo:content/README.md",
    path: "content/README.md",
    name: "README.md",
    extension: "md",
    content: "# README",
    editable: true,
    source: "content",
    renderer: "markdown",
    language: "markdown",
  },
  {
    id: "repo:content/philosophy.md",
    path: "content/philosophy.md",
    name: "philosophy.md",
    extension: "md",
    content: "# Philosophy",
    editable: true,
    source: "content",
    renderer: "markdown",
    language: "markdown",
  },
];

describe("TabBar", () => {
  it("selects and closes tabs", async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    const onPinTab = vi.fn();
    const onCloseTab = vi.fn();

    render(
      <TabBar
        tabs={tabs}
        activeFileId={tabs[0].id}
        previewTabId={tabs[0].id}
        onSelectTab={onSelectTab}
        onPinTab={onPinTab}
        onCloseTab={onCloseTab}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /philosophy.md/i }));
    expect(onSelectTab).toHaveBeenCalledWith("repo:content/philosophy.md");

    await user.click(screen.getByLabelText("Close philosophy.md"));
    expect(onCloseTab).toHaveBeenCalledWith("repo:content/philosophy.md");
  });

  it("pins tabs on double click", async () => {
    const user = userEvent.setup();
    const onPinTab = vi.fn();

    render(
      <TabBar
        tabs={tabs}
        activeFileId={tabs[0].id}
        previewTabId={tabs[0].id}
        onSelectTab={vi.fn()}
        onPinTab={onPinTab}
        onCloseTab={vi.fn()}
      />,
    );

    await user.dblClick(screen.getByRole("tab", { name: /README.md/i }));

    expect(onPinTab).toHaveBeenCalledWith("repo:content/README.md");
  });
});
