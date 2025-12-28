import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createOrbitsAndPlanets } from "./createPlanest.js";
import { enablePlanetZoom, updateCameraFollow } from "./enablePlanetZoom.js";
import { createMoons } from "./createMoons.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const w = window.innerWidth;
const h = window.innerHeight;

// --- SCENE ---
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();

// --- SPACE BACKGROUND ---
const spaceSphereGeometry = new THREE.SphereGeometry(100, 64, 64);
const spaceSphereMaterial = new THREE.MeshBasicMaterial({
  map: loader.load("/img/8k_stars_milky_way.jpg"),
  side: THREE.BackSide,
});
scene.add(new THREE.Mesh(spaceSphereGeometry, spaceSphereMaterial));

// --- SUN ---
const sunTexture = loader.load("/img/8k_sun.jpg");
sunTexture.minFilter = THREE.LinearFilter;
sunTexture.magFilter = THREE.LinearFilter;

const sunGeometry = new THREE.SphereGeometry(0.2, 128, 128);
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffdd66),
  emissiveMap: sunTexture,
  emissiveIntensity: 1.5,
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sunMesh);

const sunLight = new THREE.PointLight(0xffffff, 2, 100);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// --- STARS ---
const starGeometry = new THREE.BufferGeometry();
const starCount = 10000;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 200;
}
starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
scene.add(new THREE.Points(starGeometry, starMaterial));

// --- PLANET DATA ---
const orbitalPeriods = [0.24, 0.62, 1.0, 1.88, 11.86, 29.46, 84.01, 164.8]; // Earth years
const planetRadii = [0.03, 0.04, 0.045, 0.05, 0.09, 0.08, 0.07, 0.07];
const planetTextures = [
  "/img/8k_mercury.jpg",
  "/img/8k_venus_surface.jpg",
  "/img/8k_earth_daymap.jpg",
  "/img/8k_mars.jpg",
  "/img/8k_jupiter.jpg",
  "/img/8k_saturn.jpg",
  "/img/2k_uranus.jpg",
  "/img/2k_neptune.jpg",
];
const orbitCount = 8;
const orbitGap = 0.4;

// --- CREATE PLANETS ---
const { planetMeshes, planetAngles } = createOrbitsAndPlanets(
  scene,
  loader,
  planetRadii,
  planetTextures,
  orbitalPeriods,
  orbitCount,
  orbitGap
);

// --- CREATE MOONS ---
createMoons(loader, planetMeshes);

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0, 1, 2);
scene.add(camera);

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// --- CONTROLS ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// --- COMPOSER / BLOOM ---
const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // strength
  0.4, // radius
  0.85 // threshold
);
composer.addPass(bloomPass);

// --- PLANET ZOOM ---
enablePlanetZoom(renderer, camera, controls, planetMeshes, sunMesh);

// --- WINDOW RESIZE ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMATION LOOP ---
let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  const simulationYear = 60;

  // Animate planets
  for (let i = 0; i < planetMeshes.length; i++) {
    const angularSpeed =
      (2 * Math.PI) / (planetMeshes[i].period * simulationYear);
    planetAngles[i] += angularSpeed * delta;
    const x = Math.cos(planetAngles[i]) * planetMeshes[i].radius;
    const z = Math.sin(planetAngles[i]) * planetMeshes[i].radius;
    planetMeshes[i].mesh.position.set(x, 0, z);

    // Rotate planet
    if (planetMeshes[i].mesh.isGroup) {
      planetMeshes[i].mesh.children[0].rotation.y += 0.01 * delta;
    } else {
      planetMeshes[i].mesh.rotation.y += 0.01 * delta;
    }

    // Animate moons
    if (planetMeshes[i].moons) {
      planetMeshes[i].moons.forEach((moon) => {
        const moonAngularSpeed = (2 * Math.PI) / (moon.period * simulationYear);
        moon.angle += moonAngularSpeed * delta;
        moon.mesh.position.set(
          Math.cos(moon.angle) * moon.distance,
          0,
          Math.sin(moon.angle) * moon.distance
        );
        moon.mesh.rotation.y += 0.02 * delta;
      });
    }
  }

  // Rotate sun
  sunMesh.rotation.y += 0.0005;

  // Camera follow
  updateCameraFollow(camera, controls);

  controls.update();
  composer.render();
}

animate();
