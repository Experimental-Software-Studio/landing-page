import { describe, expect, it } from "vitest";
import { shouldMirrorRepoPath } from "./repoMirrorFilter";

describe("shouldMirrorRepoPath", () => {
  it("excludes secrets, generated files, dependencies, and build output", () => {
    expect(shouldMirrorRepoPath(".env")).toBe(false);
    expect(shouldMirrorRepoPath(".env.local")).toBe(false);
    expect(shouldMirrorRepoPath("node_modules/pkg/index.js")).toBe(false);
    expect(shouldMirrorRepoPath(".next/server/app.js")).toBe(false);
    expect(shouldMirrorRepoPath("generated/repoMirror.ts")).toBe(false);
    expect(shouldMirrorRepoPath("pnpm-lock.yaml")).toBe(false);
  });

  it("includes source and authored content files", () => {
    expect(shouldMirrorRepoPath("src/app/page.tsx")).toBe(true);
    expect(shouldMirrorRepoPath("src/content/workspace/contentFiles.ts")).toBe(true);
    expect(shouldMirrorRepoPath("README.md")).toBe(true);
  });
});
