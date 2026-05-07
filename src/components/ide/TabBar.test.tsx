import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TabBar } from "./TabBar";
import { contentFiles } from "@/content/workspace/contentFiles";

describe("TabBar", () => {
  it("selects and closes tabs", async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();
    const tabs = contentFiles.slice(0, 2);

    render(
      <TabBar
        tabs={tabs}
        activeFileId={tabs[0].id}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /philosophy.md/i }));
    expect(onSelectTab).toHaveBeenCalledWith("content-philosophy");

    await user.click(screen.getByLabelText("Close philosophy.md"));
    expect(onCloseTab).toHaveBeenCalledWith("content-philosophy");
  });
});
