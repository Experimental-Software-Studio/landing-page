import * as THREE from "three";
import {
  createPerspectiveCamera,
  createRenderer,
  disposeObject,
  easeToward,
} from "./shared";
import type { PointerState, Visual } from "./types";

const nodeCount = 224;
const connectionCount = 560;

type Node = {
  base: THREE.Vector3;
  current: THREE.Vector3;
  phase: number;
};

export function createConstellationVisual(canvas: HTMLCanvasElement): Visual {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = createPerspectiveCamera(8.4);
  const group = new THREE.Group();
  scene.add(group);

  const nodes: Node[] = Array.from({ length: nodeCount }, (_, index) => {
    const band = Math.floor(index / 56);
    const radius = 3.2 + Math.random() * 5.4 + band * 0.55;
    const angle = index * 2.399 + Math.random() * 0.9;
    const z = (Math.random() - 0.5) * 3.6;
    const base = new THREE.Vector3(
      Math.cos(angle) * radius * 1.16 + (Math.random() - 0.5) * 2.1,
      Math.sin(angle) * radius * 0.7 + (Math.random() - 0.5) * 1.5,
      z,
    );

    return {
      base,
      current: base.clone(),
      phase: Math.random() * Math.PI * 2,
    };
  });

  const connections = nodes
    .flatMap((node, index) =>
      nodes
        .map((target, targetIndex) => ({
          from: index,
          to: targetIndex,
          distance: node.base.distanceTo(target.base),
        }))
        .filter((entry) => entry.to > index),
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, connectionCount);

  const positions = new Float32Array(connections.length * 2 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xf4f0e9,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(geometry, material);
  group.add(lines);

  let width = 1;
  let height = 1;
  let dpr = 1;
  let cameraX = 0;
  let cameraY = 0;

  return {
    resize(nextWidth, nextHeight, nextDpr) {
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render(time, delta, pointer: PointerState) {
      const influenceX = pointer.active ? pointer.normalizedX * 10.2 : 0;
      const influenceY = pointer.active ? -pointer.normalizedY * 6.2 : 0;

      nodes.forEach((node) => {
        const drift = Math.sin(time * 0.36 + node.phase) * 0.32;
        const target = node.base.clone();
        target.x += Math.cos(node.phase + time * 0.22) * drift * 1.25;
        target.y += Math.sin(node.phase * 0.9 + time * 0.28) * drift;

        const pointerDistance = Math.hypot(
          target.x - influenceX,
          target.y - influenceY,
        );
        const pull = pointer.active
          ? Math.max(0, 3.2 - pointerDistance) * 0.1
          : 0;
        const swirl = pointer.active
          ? Math.max(0, 4.4 - pointerDistance) * 0.055
          : 0;
        target.x += (target.x - influenceX) * pull;
        target.y += (target.y - influenceY) * pull;
        target.x += -(target.y - influenceY) * swirl;
        target.y += (target.x - influenceX) * swirl;

        node.current.lerp(target, Math.min(1, delta * 9));
      });

      connections.forEach((connection, index) => {
        const from = nodes[connection.from].current;
        const to = nodes[connection.to].current;
        const offset = index * 6;
        positions[offset] = from.x;
        positions[offset + 1] = from.y;
        positions[offset + 2] = from.z;
        positions[offset + 3] = to.x;
        positions[offset + 4] = to.y;
        positions[offset + 5] = to.z;
      });

      geometry.attributes.position.needsUpdate = true;
      (material as THREE.LineBasicMaterial).opacity =
        pointer.active ? 0.44 : 0.3 + Math.sin(time * 0.7) * 0.04;
      cameraX = easeToward(cameraX, pointer.normalizedX * 0.7, 0.06);
      cameraY = easeToward(cameraY, -pointer.normalizedY * 0.44, 0.06);
      camera.position.x = cameraX;
      camera.position.y = cameraY;
      camera.lookAt(0, 0, 0);
      group.rotation.z = Math.sin(time * 0.08) * 0.05;
      group.rotation.y = pointer.normalizedX * 0.12;
      renderer.render(scene, camera);
    },
    destroy() {
      disposeObject(group);
      renderer.dispose();
    },
  };
}
