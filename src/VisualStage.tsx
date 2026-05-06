import { useEffect, useRef } from "react";
import { createBloomVisual } from "./visuals/bloom";
import { createConstellationVisual } from "./visuals/constellation";
import { createFogVisual } from "./visuals/fog";
import { createMapVisual } from "./visuals/map";
import { createSignalVisual } from "./visuals/signal";
import type { PointerState, Visual, VisualId } from "./visuals/types";

type VisualStageProps = {
  activeId: VisualId;
};

const factories = {
  constellation: createConstellationVisual,
  fog: createFogVisual,
  signal: createSignalVisual,
  map: createMapVisual,
  bloom: createBloomVisual,
} satisfies Record<VisualId, (canvas: HTMLCanvasElement) => Visual>;

export function VisualStage({ activeId }: VisualStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualRef = useRef<Visual | null>(null);
  const pointerRef = useRef<PointerState>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    visualRef.current?.destroy();
    visualRef.current = factories[activeId](canvas);

    const updatePointer = (clientX: number, clientY: number, active = true) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      pointerRef.current = {
        x,
        y,
        normalizedX: rect.width > 0 ? x / rect.width - 0.5 : 0,
        normalizedY: rect.height > 0 ? y / rect.height - 0.5 : 0,
        active,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY);
    };
    const onPointerLeave = () => {
      pointerRef.current = { ...pointerRef.current, active: false };
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        updatePointer(touch.clientX, touch.clientY);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      visualRef.current?.resize(rect.width, rect.height, dpr);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let frame = 0;
    let lastTime = performance.now();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const tick = (time: number) => {
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      visualRef.current?.render(time / 1000, reducedMotion ? 0 : delta, pointerRef.current);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchmove", onTouchMove);
      visualRef.current?.destroy();
      visualRef.current = null;
    };
  }, [activeId]);

  return (
    <canvas
      key={activeId}
      ref={canvasRef}
      className="visual-stage"
      aria-hidden="true"
    />
  );
}
