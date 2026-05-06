import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Activity,
  Atom,
  GitBranch,
  Network,
  Orbit,
  Sparkles,
} from "lucide-react";
import { VisualStage } from "./VisualStage";
import type { VisualId } from "./visuals/types";

type Prototype = {
  id: VisualId;
  name: string;
  cue: string;
  icon: typeof Network;
};

const prototypes: Prototype[] = [
  {
    id: "constellation",
    name: "Living Wireframe Constellation",
    cue: "A graph that behaves like a thinking surface.",
    icon: Network,
  },
  {
    id: "fog",
    name: "Neural Fog Lattice",
    cue: "Structure appearing through a slow machine haze.",
    icon: Atom,
  },
  {
    id: "signal",
    name: "Signal Interference Plane",
    cue: "Launch signals folding into temporary instruments.",
    icon: Activity,
  },
  {
    id: "map",
    name: "Dark Matter Product Map",
    cue: "Products orbiting, connecting, and slipping out of view.",
    icon: Orbit,
  },
  {
    id: "bloom",
    name: "Synthetic Bloom Network",
    cue: "Organic branching pulled through computational gravity.",
    icon: GitBranch,
  },
];

export default function App() {
  const [activeId, setActiveId] = useState<VisualId>("constellation");
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const active = useMemo(
    () => prototypes.find((prototype) => prototype.id === activeId)!,
    [activeId],
  );
  const cursorStyle = {
    "--cursor-x": `${cursor.x}px`,
    "--cursor-y": `${cursor.y}px`,
  } as CSSProperties;

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      setCursor({ x: event.clientX, y: event.clientY, visible: true });
    };
    const onPointerLeave = () => {
      setCursor((current) => ({ ...current, visible: false }));
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <main className="shell">
      <VisualStage activeId={activeId} />
      <div className="grain" aria-hidden="true" />
      <div
        className={cursor.visible ? "cursor-glow visible" : "cursor-glow"}
        style={cursorStyle}
        aria-hidden="true"
      />
      <section className="hero" aria-labelledby="page-title">
        <div className="brand-mark">
          <Sparkles size={16} strokeWidth={1.7} />
          <span>Prototype field</span>
        </div>
        <h1 id="page-title">Experimental Software</h1>
        <p>{active.cue}</p>
      </section>
      <nav className="prototype-switcher" aria-label="Visual prototypes">
        {prototypes.map((prototype, index) => {
          const Icon = prototype.icon;
          const isActive = prototype.id === activeId;

          return (
            <button
              key={prototype.id}
              className={isActive ? "prototype active" : "prototype"}
              type="button"
              onClick={() => setActiveId(prototype.id)}
              aria-pressed={isActive}
              title={prototype.name}
            >
              <span className="prototype-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon size={18} strokeWidth={1.6} />
              <span>{prototype.name}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
