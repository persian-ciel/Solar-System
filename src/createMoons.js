import * as THREE from "three";

// --- MOONS DATA ---
// Distances are relative (scaled), periods are in Earth days
export const moonsData = {
  2: [
    // Earth (index 2)
    {
      name: "Moon",
      radius: 0.01,
      distance: 0.08,
      texture: "/img/2k_moon.jpg",
      period: 27.3,
    },
  ],
  3: [
    // Mars
    {
      name: "Phobos",
      radius: 0.005,
      distance: 0.03,
      texture: "/img/phobos_texture_map_by_askaniy_dcyuzcx-pre.jpg",
      period: 0.32,
    },
    {
      name: "Deimos",
      radius: 0.003,
      distance: 0.05,
      texture: "/img/deimos_texture_map_by_askaniy_dczaq88-pre.jpg",
      period: 1.26,
    },
  ],
  4: [
    // Jupiter
    {
      name: "Io",
      radius: 0.01,
      distance: 0.12,
      texture:
        "/img/io_truecolor_texture_map_8k_by_fargetanik_dbpxndx-fullview.jpg",
      period: 1.77,
    },
    {
      name: "Europa",
      radius: 0.009,
      distance: 0.16,
      texture: "/img/europa_texture_map__20k__by_askaniy_dcqbaif-pre.jpg",
      period: 3.55,
    },
    {
      name: "Ganymede",
      radius: 0.015,
      distance: 0.2,
      texture: "/img/ganymede_texture_map__11k__by_askaniy_dddhxoy-pre.jpg",
      period: 7.15,
    },
    {
      name: "Callisto",
      radius: 0.013,
      distance: 0.26,
      texture: "/img/callisto_texture_map__8k__by_askaniy_dddit1h-pre.jpg",
      period: 16.7,
    },
  ],
  5: [
    // Saturn
    {
      name: "Titan",
      radius: 0.012,
      distance: 0.18,
      texture:
        "/img/titan_texture_map_8k__2018_editon__by_fargetanik_dd05ce1-pre.jpg",
      period: 15.9,
    },
  ],
  6: [
    // Uranus
    {
      name: "Titania",
      radius: 0.009,
      distance: 0.12,
      texture:
        "/img/titania_texture_map_by_neptuneproproduction_dccgm21-fullview.jpg",
      period: 8.7,
    },
  ],
  7: [
    // Neptune
    {
      name: "Triton",
      radius: 0.01,
      distance: 0.14,
      texture: "/img/triton_texture_map__14k__by_askaniy_dcln18g-pre.jpg",
      period: 5.9,
    },
  ],
};

// Function to create moons for a planet
export function createMoons(loader, planetMeshes) {
  for (let i = 0; i < planetMeshes.length; i++) {
    planetMeshes[i].moons = [];
    if (moonsData[i]) {
      moonsData[i].forEach((moon) => {
        const moonTexture = loader.load(moon.texture);
        const moonGeo = new THREE.SphereGeometry(moon.radius, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({ map: moonTexture });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);

        // Parent moon to a group for easy rotation around planet
        const moonGroup = new THREE.Group();
        moonGroup.add(moonMesh);
        planetMeshes[i].mesh.add(moonGroup);

        planetMeshes[i].moons.push({
          mesh: moonMesh,
          group: moonGroup,
          distance: moon.distance,
          angle: Math.random() * Math.PI * 2,
          period: moon.period,
        });
      });
    }
  }
}
