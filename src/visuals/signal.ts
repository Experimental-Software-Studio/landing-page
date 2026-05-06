import { setCanvas2DSize } from "./shared";
import type { PointerState, Visual } from "./types";

type SignalLine = {
  y: number;
  phase: number;
  speed: number;
  amplitude: number;
  slant: number;
  frequency: number;
};

const lines: SignalLine[] = Array.from({ length: 52 }, (_, index) => ({
  y: index / 51,
  phase: Math.random() * Math.PI * 2,
  speed: 0.12 + Math.random() * 0.28,
  amplitude: 4 + Math.random() * 18,
  slant: (Math.random() - 0.5) * 0.18,
  frequency: 2.6 + Math.random() * 4.2,
}));

export function createSignalVisual(canvas: HTMLCanvasElement): Visual {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    throw new Error("2D canvas context unavailable");
  }

  let width = 1;
  let height = 1;
  let dpr = 1;

  return {
    resize(nextWidth, nextHeight, nextDpr) {
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      setCanvas2DSize(canvas, context, width, height, dpr);
    },
    render(time, _delta, pointer: PointerState) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(3, 5, 6, 0.9)";
      context.fillRect(0, 0, width, height);

      context.save();
      context.globalCompositeOperation = "screen";
      context.strokeStyle = "rgba(210, 230, 255, 0.035)";
      context.lineWidth = 1;
      for (let y = 0; y <= height; y += 54) {
        context.beginPath();
        context.moveTo(0, y + Math.sin(time * 0.4 + y) * 2);
        context.lineTo(width, y + Math.sin(time * 0.4 + y) * 2);
        context.stroke();
      }
      for (let x = ((time * -12) % 84) - 84; x <= width + 84; x += 84) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + height * 0.18, height);
        context.stroke();
      }
      context.restore();

      const gradient = context.createRadialGradient(
        width * (0.5 + pointer.normalizedX * 0.2),
        height * (0.5 + pointer.normalizedY * 0.2),
        20,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.72,
      );
      gradient.addColorStop(0, "rgba(170, 204, 255, 0.08)");
      gradient.addColorStop(0.42, "rgba(150, 190, 255, 0.025)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.lineCap = "round";
      lines.forEach((line, index) => {
        const baseY = line.y * height;
        const pulseWave = (Math.sin(time * 1.6 + index * 0.43) + 1) / 2;
        const pulse = Math.pow(pulseWave, 9);
        const pointerWave =
          pointer.active ?
            Math.sin((pointer.x / width) * Math.PI * 2 + index + time * 0.8) *
              Math.max(0, 1 - Math.abs(pointer.y - baseY) / 190) *
              26 :
            0;
        const drift = time * (14 + line.speed * 62);

        context.beginPath();
        for (let x = -40; x <= width + 40; x += 16) {
          const normalized = x / width;
          const carrier =
            Math.sin(normalized * Math.PI * line.frequency + line.phase + drift * 0.012) *
            line.amplitude;
          const sub =
            Math.sin(normalized * Math.PI * (line.frequency * 2.7) - drift * 0.017) *
            line.amplitude *
            0.32;
          const y =
            baseY +
            carrier +
            sub +
            pointerWave +
            (normalized - 0.5) * height * line.slant;

          if (x === -30) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.strokeStyle = `rgba(238, 246, 255, ${0.045 + pulse * 0.18})`;
        context.lineWidth = 0.62 + pulse * 0.62;
        context.stroke();

        context.fillStyle = `rgba(255, 255, 255, ${pulse * 0.18})`;
        context.fillRect((time * 74 + index * 173) % width, baseY - 1, 54, 1.4);
      });

      context.save();
      context.globalCompositeOperation = "screen";
      context.strokeStyle = "rgba(200, 222, 255, 0.18)";
      context.lineWidth = 1;
      for (let index = 0; index < 8; index += 1) {
        const x = ((time * 22 + index * width * 0.17) % (width + 220)) - 110;
        context.beginPath();
        context.moveTo(x, height * 0.18);
        context.lineTo(x + height * 0.24, height * 0.82);
        context.stroke();
      }
      context.restore();
    },
    destroy() {
      context.clearRect(0, 0, width, height);
    },
  };
}
