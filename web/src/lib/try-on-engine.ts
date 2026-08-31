import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { coverPoint, glassesPose, type Point } from "@/lib/landmarks";
import { type RigFrame } from "@/lib/glasses-rig";
import { instantiateGlasses } from "@/lib/try-on-model";
import { pxPerMm } from "@/lib/try-on-math";

type View = { w: number; h: number; vw: number; vh: number };

export class TryOnEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private glasses: THREE.Group | null = null;
  private frame: RigFrame | null = null;
  private loadGen = 0;
  private lastPoints: Point[] = [];
  private lastView: View = { w: 1, h: 1, vw: 1, vh: 1 };
  private lastIpd?: number;
  private pmrem: THREE.PMREMGenerator;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 0, 1, -4000, 4000);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 1.05;
    this.scene.add(new THREE.HemisphereLight(0xfff4e8, 0x1c1814, 0.55));
    const key = new THREE.DirectionalLight(0xfff7ef, 1.2);
    key.position.set(-70, -90, 260);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xcfe4ff, 0.7);
    rim.position.set(120, 40, 80);
    this.scene.add(rim);
  }

  setFrame(frame: RigFrame) {
    this.frame = frame;
    this.loadGen += 1;
    const gen = this.loadGen;
    void instantiateGlasses(frame).then((group) => {
      if (gen !== this.loadGen) {
        disposeGroup(group);
        return;
      }
      if (this.glasses) {
        this.scene.remove(this.glasses);
        disposeGroup(this.glasses);
      }
      this.glasses = group;
      this.scene.add(group);
      this.paint();
    });
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.left = 0;
    this.camera.right = w;
    this.camera.top = 0;
    this.camera.bottom = h;
    this.camera.updateProjectionMatrix();
    this.lastView = { ...this.lastView, w, h };
    this.paint();
  }

  update(points: Point[], view: View, ipdMm?: number) {
    this.lastPoints = points;
    this.lastView = view;
    this.lastIpd = ipdMm;
    this.paint();
  }

  dispose() {
    this.loadGen += 1;
    if (this.glasses) {
      disposeGroup(this.glasses);
    }
    this.pmrem.dispose();
    this.renderer.dispose();
  }

  private paint() {
    if (!this.glasses || !this.frame) {
      return;
    }
    const pose = glassesPose(this.lastPoints, { ...this.frame, ipdMm: this.lastIpd });
    if (!pose) {
      this.glasses.visible = false;
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const view = this.lastView;
    const placed = coverPoint(pose.cx, pose.cy, view.w, view.h, view.vw, view.vh);
    const frontPx = pose.width * placed.scale * view.vw;
    const scale = pxPerMm(frontPx, this.frame.lensWidthMm, this.frame.bridgeMm);
    this.glasses.visible = scale > 0;
    this.glasses.position.set(placed.x, placed.y, 0);
    this.glasses.rotation.set(
      THREE.MathUtils.degToRad(pose.rotateX),
      THREE.MathUtils.degToRad(-pose.rotateY),
      THREE.MathUtils.degToRad(pose.rotate),
    );
    this.glasses.scale.set(scale, -scale, scale);
    this.renderer.render(this.scene, this.camera);
  }
}

function disposeGroup(group: THREE.Group) {
  const owned = group.userData.ownedGeo === true;
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (owned) {
      mesh.geometry?.dispose();
    }
    const mat = mesh.material;
    const list = Array.isArray(mat) ? mat : mat ? [mat] : [];
    list.forEach((m) => {
      if (owned) {
        const phys = m as THREE.MeshPhysicalMaterial;
        phys.map?.dispose();
      }
      m.dispose();
    });
  });
}
