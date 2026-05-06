import * as THREE from "three";

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setClearColor(0x030405, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

export function createPerspectiveCamera(z = 7) {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, z);
  return camera;
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh | THREE.LineSegments | THREE.Points;
    const material = mesh.material;
    const geometry = mesh.geometry;

    if (geometry) {
      geometry.dispose();
    }

    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}

export function easeToward(current: number, target: number, factor: number) {
  return current + (target - current) * factor;
}

export function setCanvas2DSize(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
) {
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}
