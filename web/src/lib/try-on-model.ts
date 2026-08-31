import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { buildGlassesRig, type RigFrame } from "@/lib/glasses-rig";
import { publicAsset } from "@/lib/public-asset";

const loader = new GLTFLoader();
const cache = new Map<string, THREE.Group>();

export const TINTS: { id: string; hex: number; label: string }[] = [
  { id: "black", hex: 0x161310, label: "Чёрный" },
  { id: "gold", hex: 0xc9a66b, label: "Золото" },
  { id: "silver", hex: 0xd0cbc3, label: "Серебро" },
  { id: "tortoise", hex: 0x7a4a28, label: "Черепаховый" },
  { id: "horn", hex: 0x4a3428, label: "Рог" },
  { id: "burgundy", hex: 0x6b1c28, label: "Бордо" },
  { id: "grey", hex: 0x6e6b67, label: "Серый" },
];

export function tintHex(color: string): number {
  return TINTS.find((t) => t.id === color)?.hex ?? 0x161310;
}

export function isLensMaterial(name: string, transmission: number, opacity: number): boolean {
  if (/temple|hinge|frame|rim|arm|acetate|metal/i.test(name)) {
    return false;
  }
  if (/lens|glass|iridesc/i.test(name)) {
    return true;
  }
  return transmission > 0.45 || opacity < 0.85;
}

export function frontAxisWidth(sizeX: number, sizeZ: number): number {
  if (sizeX > 1e-6) {
    return sizeX;
  }
  return sizeZ;
}

export function scaleForFront(modelWidth: number, lensWidthMm: number, bridgeMm: number): number {
  const front = lensWidthMm * 2 + bridgeMm;
  if (modelWidth <= 0 || front <= 0) {
    return 1;
  }
  return front / modelWidth;
}

export function applyFrameTint(root: THREE.Object3D, color: string, material = "acetate") {
  const hex = tintHex(color);
  const metal = material === "metal";
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      const phys = mat as THREE.MeshPhysicalMaterial;
      const transmission = phys.transmission ?? 0;
      const opacity = phys.opacity ?? 1;
      if (isLensMaterial(mesh.name + " " + (phys.name ?? ""), transmission, opacity)) {
        dressLens(phys);
        return;
      }
      dressRim(phys, hex, metal);
    });
  });
}

function dressLens(phys: THREE.MeshPhysicalMaterial) {
  phys.color?.setHex(0x1c2428);
  phys.emissive?.setHex(0x000000);
  phys.metalness = 0;
  phys.roughness = 0.05;
  phys.transmission = 0;
  phys.iridescence = 0;
  phys.transparent = true;
  phys.opacity = 0.32;
  phys.depthWrite = false;
  phys.envMapIntensity = 1.15;
  phys.clearcoat = 1;
  phys.clearcoatRoughness = 0.06;
  phys.side = THREE.DoubleSide;
}

function dressRim(phys: THREE.MeshPhysicalMaterial, hex: number, metal: boolean) {
  phys.color?.setHex(hex);
  phys.emissive?.setHex(0x000000);
  if (!phys.roughnessMap) {
    phys.roughness = metal ? 0.22 : 0.32;
  }
  if (!phys.metalnessMap) {
    phys.metalness = metal ? 0.82 : 0.06;
  }
  phys.clearcoat = metal ? 0.45 : 0.9;
  phys.clearcoatRoughness = metal ? 0.18 : 0.12;
  phys.transmission = 0;
  phys.iridescence = 0;
  phys.transparent = false;
  phys.opacity = 1;
  phys.depthWrite = true;
  phys.envMapIntensity = metal ? 1.25 : 0.85;
}

export function fitModelToFront(root: THREE.Object3D, lensWidthMm: number, bridgeMm: number) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const width = frontAxisWidth(size.x, size.z);
  root.scale.multiplyScalar(scaleForFront(width, lensWidthMm, bridgeMm));
  root.updateMatrixWorld(true);
  const centered = new THREE.Box3().setFromObject(root);
  const mid = new THREE.Vector3();
  centered.getCenter(mid);
  root.position.sub(mid);
}

export function wrapForPose(content: THREE.Group, ownedGeo: boolean): THREE.Group {
  const root = new THREE.Group();
  root.userData.ownedGeo = ownedGeo;
  root.add(content);
  return root;
}

export function usesParametricRig(model?: string): boolean {
  return !model || model.startsWith("rig:");
}

export async function instantiateGlasses(frame: RigFrame): Promise<THREE.Group> {
  if (!frame.model || frame.model.startsWith("rig:")) {
    return wrapForPose(buildGlassesRig(frame), true);
  }
  try {
    const proto = await loadPrototype(publicAsset(frame.model));
    const inst = proto.clone(true);
    inst.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = cloneMat(mesh.material);
        mesh.frustumCulled = false;
      }
    });
    fitModelToFront(inst, frame.lensWidthMm, frame.bridgeMm);
    inst.rotation.x = 0.18;
    applyFrameTint(inst, frame.color, frame.material);
    return wrapForPose(inst, false);
  } catch {
    return wrapForPose(buildGlassesRig(frame), true);
  }
}

function cloneMat(mat: THREE.Material | THREE.Material[]): THREE.Material | THREE.Material[] {
  if (Array.isArray(mat)) {
    return mat.map((m) => m.clone());
  }
  return mat.clone();
}

async function loadPrototype(url: string): Promise<THREE.Group> {
  const hit = cache.get(url);
  if (hit) {
    return hit;
  }
  const gltf = await loader.loadAsync(url);
  cache.set(url, gltf.scene);
  return gltf.scene;
}
