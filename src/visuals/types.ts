export type VisualId = "constellation" | "fog" | "signal" | "map" | "bloom";

export type PointerState = {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
  active: boolean;
};

export type Visual = {
  resize: (width: number, height: number, dpr: number) => void;
  render: (time: number, delta: number, pointer: PointerState) => void;
  destroy: () => void;
};
