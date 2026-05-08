import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { Options as SanitizeOptions } from "rehype-sanitize";

type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const sanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ["target", "_blank"],
      ["rel", "noopener", "noreferrer"],
    ],
  },
};

function isExternalHref(href: unknown) {
  return typeof href === "string" && /^(https?:\/\/|\/\/|mailto:)/i.test(href);
}

function openExternalLinksInNewTab() {
  return (tree: HastNode) => {
    visit(tree, (node) => {
      if (node.type !== "element" || node.tagName !== "a") return;
      if (!isExternalHref(node.properties?.href)) return;

      node.properties = {
        ...node.properties,
        target: "_blank",
        rel: ["noopener", "noreferrer"],
      };
    });
  };
}

function sanitizeMarkdown() {
  return rehypeSanitize(sanitizeSchema);
}

function visit(node: HastNode, callback: (node: HastNode) => void) {
  callback(node);
  node.children?.forEach((child) => visit(child, callback));
}

export function renderMarkdown(markdown: string) {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(openExternalLinksInNewTab)
      .use(sanitizeMarkdown)
      .use(rehypeStringify)
      .processSync(markdown),
  );
}
