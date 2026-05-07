import { foldService } from "@codemirror/language";
import type { EditorState, Extension } from "@codemirror/state";

function indentation(text: string) {
  return text.match(/^\s*/)?.[0].length ?? 0;
}

function nextNonBlankLine(state: EditorState, lineNumber: number) {
  for (let nextLineNumber = lineNumber + 1; nextLineNumber <= state.doc.lines; nextLineNumber += 1) {
    const line = state.doc.line(nextLineNumber);

    if (line.text.trim()) {
      return line;
    }
  }

  return null;
}

export function yamlIndentFolding(): Extension {
  return foldService.of((state, lineStart, lineEnd) => {
    const line = state.doc.lineAt(lineStart);
    const text = line.text;

    if (!text.trim()) {
      return null;
    }

    const baseIndent = indentation(text);
    const firstChild = nextNonBlankLine(state, line.number);

    if (!firstChild || indentation(firstChild.text) <= baseIndent) {
      return null;
    }

    let lastFoldedLine = firstChild;

    for (
      let nextLineNumber = firstChild.number + 1;
      nextLineNumber <= state.doc.lines;
      nextLineNumber += 1
    ) {
      const nextLine = state.doc.line(nextLineNumber);

      if (!nextLine.text.trim()) {
        lastFoldedLine = nextLine;
        continue;
      }

      if (indentation(nextLine.text) <= baseIndent) {
        break;
      }

      lastFoldedLine = nextLine;
    }

    return {
      from: lineEnd,
      to: lastFoldedLine.to,
    };
  });
}
