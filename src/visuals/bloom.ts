import { setCanvas2DSize } from "./shared";
import type { PointerState, Visual } from "./types";

type Filament = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  life: number;
  age: number;
  turn: number;
};

function spawn(width: number, height: number, angle = Math.random() * Math.PI * 2): Filament {
  return {
    x: width * 0.5 + (Math.random() - 0.5) * 36,
    y: height * 0.5 + (Math.random() - 0.5) * 36,
    angle,
    speed: 0.7 + Math.random() * 1.8,
    life: 120 + Math.random() * 170,
    age: 0,
    turn: (Math.random() - 0.5) * 0.035,
  };
}

export function createBloomVisual(canvas: HTMLCanvasElement): Visual {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    throw new Error("2D canvas context unavailable");
  }

  let width = 1;
  let height = 1;
  let dpr = 1;
  let filaments: Filament[] = [];

  return {
    resize(nextWidth, nextHeight, nextDpr) {
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      setCanvas2DSize(canvas, context, width, height, dpr);
      filaments = Array.from({ length: 150 }, (_, index) =>
        spawn(width, height, (index / 150) * Math.PI * 2),
      );
    },
    render(time, delta, pointer: PointerState) {
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "rgba(3, 4, 5, 0.12)";
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      const attractorX = pointer.active ? pointer.x : width * 0.5 + Math.cos(time * 0.2) * 90;
      const attractorY = pointer.active ? pointer.y : height * 0.5 + Math.sin(time * 0.17) * 70;
      const stepScale = Math.max(1, delta * 60);

      filaments.forEach((filament, index) => {
        const previousX = filament.x;
        const previousY = filament.y;
        const dx = attractorX - filament.x;
        const dy = attractorY - filament.y;
        const attraction = Math.atan2(dy, dx);
        const blend = pointer.active ? 0.018 : 0.006;
        filament.angle =
          filament.angle * (1 - blend) +
          attraction * blend +
          Math.sin(time * 0.8 + index) * 0.016 +
          filament.turn;
        filament.x += Math.cos(filament.angle) * filament.speed * stepScale;
        filament.y += Math.sin(filament.angle) * filament.speed * stepScale;
        filament.age += stepScale;

        const alpha = Math.max(0, 1 - filament.age / filament.life);
        context.strokeStyle = `rgba(244, 249, 255, ${alpha * 0.18})`;
        context.lineWidth = 0.55 + alpha * 0.85;
        context.beginPath();
        context.moveTo(previousX, previousY);
        context.lineTo(filament.x, filament.y);
        context.stroke();

        if (
          filament.age > filament.life ||
          filament.x < -80 ||
          filament.x > width + 80 ||
          filament.y < -80 ||
          filament.y > height + 80
        ) {
          filaments[index] = spawn(width, height, time + index);
        } else if (Math.random() < 0.003 && filaments.length < 230) {
          filaments.push({
            ...filament,
            angle: filament.angle + (Math.random() - 0.5) * 1.2,
            life: filament.life * 0.66,
            age: filament.age * 0.42,
          });
        }
      });

      context.globalCompositeOperation = "screen";
      const glow = context.createRadialGradient(
        attractorX,
        attractorY,
        0,
        attractorX,
        attractorY,
        pointer.active ? 220 : 150,
      );
      glow.addColorStop(0, "rgba(210, 230, 255, 0.12)");
      glow.addColorStop(1, "rgba(210, 230, 255, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    },
    destroy() {
      context.clearRect(0, 0, width, height);
    },
  };
}
