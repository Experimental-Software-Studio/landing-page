import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TabBar } from "./TabBar";
import { contentFiles } from "@/content/workspace/contentFiles";

describe("TabBar", () => {
  it("selects and closes tabs", async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    const onPinTab = vi.fn();
    const onCloseTab = vi.fn();
    const tabs = contentFiles.slice(0, 2);

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
    expect(onSelectTab).toHaveBeenCalledWith("content-philosophy");

    await user.click(screen.getByLabelText("Close philosophy.md"));
    expect(onCloseTab).toHaveBeenCalledWith("content-philosophy");
  });

  it("pins tabs on double click", async () => {
    const user = userEvent.setup();
    const onPinTab = vi.fn();
    const tabs = contentFiles.slice(0, 1);

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

    expect(onPinTab).toHaveBeenCalledWith("content-readme");
  });
});
