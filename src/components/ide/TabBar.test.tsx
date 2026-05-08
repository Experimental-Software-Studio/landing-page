import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
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
  {
    id: "repo:package.json",
    path: "package.json",
    name: "package.json",
    extension: "json",
    content: "{}",
    editable: false,
    source: "repo",
    renderer: "code",
    language: "json",
  },
];

function renderTabBar(overrides: Partial<ComponentProps<typeof TabBar>> = {}) {
  return render(
    <TabBar
      tabs={tabs}
      activeFileId={tabs[0].id}
      previewTabId={tabs[0].id}
      onSelectTab={vi.fn()}
      onPinTab={vi.fn()}
      onCloseTab={vi.fn()}
      onCloseOtherTabs={vi.fn()}
      onCloseTabsToRight={vi.fn()}
      onReorderTab={vi.fn()}
      {...overrides}
    />,
  );
}

describe("TabBar", () => {
  it("selects and closes tabs", async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    const onPinTab = vi.fn();
    const onCloseTab = vi.fn();

    renderTabBar({ onSelectTab, onPinTab, onCloseTab });

    await user.click(screen.getByRole("tab", { name: /philosophy.md/i }));
    expect(onSelectTab).toHaveBeenCalledWith("repo:content/philosophy.md");

    await user.click(screen.getByLabelText("Close philosophy.md"));
    expect(onCloseTab).toHaveBeenCalledWith("repo:content/philosophy.md");
  });

  it("pins tabs on double click", async () => {
    const user = userEvent.setup();
    const onPinTab = vi.fn();

    renderTabBar({ onPinTab });

    await user.dblClick(screen.getByRole("tab", { name: /README.md/i }));

    expect(onPinTab).toHaveBeenCalledWith("repo:content/README.md");
  });

  it("opens tab context menu actions", async () => {
    const user = userEvent.setup();
    const onCloseTab = vi.fn();
    const onCloseOtherTabs = vi.fn();
    const onCloseTabsToRight = vi.fn();

    renderTabBar({ onCloseTab, onCloseOtherTabs, onCloseTabsToRight });

    fireEvent.contextMenu(screen.getByRole("tab", { name: /philosophy.md/i }), {
      clientX: 120,
      clientY: 80,
    });

    await user.click(screen.getByRole("menuitem", { name: "Close Others" }));
    expect(onCloseOtherTabs).toHaveBeenCalledWith("repo:content/philosophy.md");

    fireEvent.contextMenu(screen.getByRole("tab", { name: /philosophy.md/i }), {
      clientX: 120,
      clientY: 80,
    });

    await user.click(screen.getByRole("menuitem", { name: "Close to the Right" }));
    expect(onCloseTabsToRight).toHaveBeenCalledWith("repo:content/philosophy.md");

    fireEvent.contextMenu(screen.getByRole("tab", { name: /philosophy.md/i }), {
      clientX: 120,
      clientY: 80,
    });

    await user.click(screen.getByRole("menuitem", { name: "Close" }));
    expect(onCloseTab).toHaveBeenCalledWith("repo:content/philosophy.md");
  });

  it("selects on pointer down and reorders tabs on drop", () => {
    const onSelectTab = vi.fn();
    const onReorderTab = vi.fn();

    renderTabBar({ onSelectTab, onReorderTab });

    const readmeTab = screen.getByRole("tab", { name: /README.md/i });
    const packageTab = screen.getByRole("tab", { name: /package.json/i });

    fireEvent.pointerDown(packageTab);
    expect(onSelectTab).toHaveBeenCalledWith("repo:package.json");

    packageTab.getBoundingClientRect = () =>
      ({
        left: 100,
        right: 220,
        top: 0,
        bottom: 36,
        width: 120,
        height: 36,
        x: 100,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.dragStart(readmeTab, {
      dataTransfer: { effectAllowed: "move", setData: vi.fn(), setDragImage: vi.fn() },
    });
    fireEvent.dragOver(packageTab, { clientX: 210 });
    fireEvent.drop(screen.getByRole("tablist", { name: "Open files" }));

    expect(onReorderTab).toHaveBeenCalledWith("repo:content/README.md", 3);
  });
});
