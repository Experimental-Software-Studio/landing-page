import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./renderMarkdown";

describe("renderMarkdown", () => {
  it("renders common GitHub-flavored markdown", () => {
    const html = renderMarkdown(`# Title

| One | Two |
| --- | --- |
| A | B |

\`\`\`ts
const value = 1;
\`\`\`
`);

    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<table>");
    expect(html).toContain("const value = 1;");
  });

  it("renders unordered and ordered lists", () => {
    const html = renderMarkdown(`- One
- Two

1. First
2. Second
`);

    expect(html).toContain("<ul>");
    expect(html).toContain("<li>One</li>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>First</li>");
  });

  it("opens external links in a new tab", () => {
    const html = renderMarkdown(
      `[External](https://example.com) and [Email](mailto:hello@example.com)`,
    );

    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a>',
    );
    expect(html).toContain(
      '<a href="mailto:hello@example.com" target="_blank" rel="noopener noreferrer">Email</a>',
    );
  });

  it("keeps internal links in the same tab", () => {
    const html = renderMarkdown(`[Projects](/projects) and [Section](#section)`);

    expect(html).toContain('<a href="/projects">Projects</a>');
    expect(html).toContain('<a href="#section">Section</a>');
    expect(html).not.toContain('target="_blank"');
  });

  it("sanitizes unsafe HTML", () => {
    const html = renderMarkdown(`<script>alert("x")</script>

<img src=x onerror=alert("x")>
`);

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
  });
});
