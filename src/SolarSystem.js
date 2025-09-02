import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createOrbitsAndPlanets } from './createPlanest.js';
import { enablePlanetZoom } from './enablePlanetZoom.js';
import { updateCameraFollow } from './enablePlanetZoom.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const w = window.innerWidth;
const h = window.innerHeight;

// Scene
const scene = new THREE.Scene();

// Texture loader
const loader = new THREE.TextureLoader();

// Create a huge sphere for the space background
const spaceSphereGeometry = new THREE.SphereGeometry(100, 64, 64);
const spaceSphereMaterial = new THREE.MeshBasicMaterial({
  map: loader.load('./img/8k_stars_milky_way.jpg'), // Use your own starfield image
  side: THREE.BackSide // Render inside of sphere
});
const spaceSphere = new THREE.Mesh(spaceSphereGeometry, spaceSphereMaterial);
scene.add(spaceSphere);

// --- SUN TEXTURE ---
const sunTexture = loader.load('./img/8k_sun.jpg');
sunTexture.minFilter = THREE.LinearFilter;
sunTexture.magFilter = THREE.LinearFilter;

// Sun core (surface)
const sunGeometry = new THREE.SphereGeometry(0.2, 128, 128);
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: new THREE.Color(0xffdd66), // soft yellow-white glow
  emissiveMap: sunTexture,
  emissiveIntensity: 1.5,
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sunMesh);


// Light source (Sunlight) at the center
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
starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Orbital periods in Earth years (Mercury to Neptune)
const orbitalPeriods = [0.24, 0.62, 1.0, 1.88, 11.86, 29.46, 84.01, 164.8];
const orbitCount = 8;
const orbitGap = 0.4;

// Example planet radii (Mercury to Neptune)
const planetRadii = [0.03, 0.04, 0.045, 0.05, 0.09, 0.08, 0.07, 0.07];

// Example planet textures
const planetTextures = [
  './img/8k_mercury.jpg',
  './img/8k_venus_surface.jpg',
  './img/8k_earth_daymap.jpg',
  './img/8k_mars.jpg',
  './img/8k_jupiter.jpg',
  './img/8k_saturn.jpg',
  './img/2k_uranus.jpg',
  './img/2k_neptune.jpg',
];

// Planets
const { planetMeshes, planetAngles } = createOrbitsAndPlanets(
  scene,
  loader,
  planetRadii,
  planetTextures,
  orbitalPeriods,
  orbitCount,
  orbitGap
);

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0, 1, 2);
scene.add(camera);

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio); // FIX pixelation
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// --- ORBIT CONTROLS ---
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

// --- RESIZE HANDLER ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMATION LOOP ---
// ...existing code...

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
    const angularSpeed = (2 * Math.PI) / (planetMeshes[i].period * simulationYear);
    planetAngles[i] += angularSpeed * delta;
    const x = Math.cos(planetAngles[i]) * planetMeshes[i].radius;
    const z = Math.sin(planetAngles[i]) * planetMeshes[i].radius;
    planetMeshes[i].mesh.position.set(x, 0, z);

    // Rotate planet in place
    if (planetMeshes[i].mesh.isGroup) {
      // If mesh is a group (e.g., Saturn with rings), rotate the planet mesh inside the group
      planetMeshes[i].mesh.children[0].rotation.y += 0.01 * delta;
    } else {
      planetMeshes[i].mesh.rotation.y += 0.01 * delta;
    }
  }

  // Rotate sun
  sunMesh.rotation.y += 0.0005;

  // Follow planet if selected
  updateCameraFollow(camera, controls);

  // Update controls
  controls.update();

  // Render with bloom
  composer.render();
}

animate();
// ...existing code...

animate();
