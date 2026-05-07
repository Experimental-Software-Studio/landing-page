import type { Range } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  type ViewUpdate,
  ViewPlugin,
  type DecorationSet,
} from "@codemirror/view";

const openingBrackets: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  "<": ">",
};

const closingBrackets = Object.fromEntries(
  Object.entries(openingBrackets).map(([opening, closing]) => [closing, opening]),
);

const colorClasses = ["cm-bracket-pair-1", "cm-bracket-pair-2", "cm-bracket-pair-3"];

interface BracketStackItem {
  char: string;
  colorClass: string;
  from: number;
}

function getBracketPairDecorations(view: EditorView) {
  const decorations: Range<Decoration>[] = [];
  const stack: BracketStackItem[] = [];
  const doc = view.state.doc.toString();

  for (let position = 0; position < doc.length; position += 1) {
    const char = doc[position];
    const matchingClose = openingBrackets[char];

    if (matchingClose) {
      stack.push({
        char,
        colorClass: colorClasses[stack.length % colorClasses.length],
        from: position,
      });
      continue;
    }

    const matchingOpen = closingBrackets[char];

    if (!matchingOpen) {
      continue;
    }

    const open = stack.pop();

    if (open?.char !== matchingOpen) {
      continue;
    }

    const mark = Decoration.mark({ class: open.colorClass });

    decorations.push(mark.range(open.from, open.from + 1), mark.range(position, position + 1));
  }

  return Decoration.set(decorations.sort((a, b) => a.from - b.from));
}

const bracketPairColorPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = getBracketPairDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = getBracketPairDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);

const bracketPairColorTheme = EditorView.baseTheme({
  ".cm-bracket-pair-1, .cm-bracket-pair-1 > span": {
    color: "#ffd700 !important",
  },
  ".cm-bracket-pair-2, .cm-bracket-pair-2 > span": {
    color: "#da70d6 !important",
  },
  ".cm-bracket-pair-3, .cm-bracket-pair-3 > span": {
    color: "#179fff !important",
  },
});

export function bracketPairColors() {
  return [bracketPairColorPlugin, bracketPairColorTheme];
}
