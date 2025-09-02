import * as THREE from 'three';
export function createOrbitsAndPlanets(scene, loader, planetRadii, planetTextures, orbitalPeriods, orbitCount, orbitGap) {
  const planetMeshes = [];
  const planetAngles = new Array(orbitCount).fill(0);

  for (let i = 0; i < orbitCount; i++) {
    // Create orbit circle
    const orbitRadius = (i + 1) * orbitGap;
    const orbitSegments = 128;
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitVertices = [];
    for (let j = 0; j <= orbitSegments; j++) {
      const theta = (j / orbitSegments) * Math.PI * 2;
      orbitVertices.push(
        Math.cos(theta) * orbitRadius,
        0,
        Math.sin(theta) * orbitRadius
      );
    }
    orbitGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(orbitVertices, 3)
    );
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888, opacity:0.5});
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);

    // Create planet mesh
    const planetGeometry = new THREE.SphereGeometry(planetRadii[i], 32, 32);
    const planetMaterial = new THREE.MeshStandardMaterial({ 
      map: loader.load(planetTextures[i]),
      side:THREE.DoubleSide
    });

    // Saturn group (planet + ring)
    let planetObject;
    if (i === 5) {
      planetObject = new THREE.Group();

      // Saturn mesh
      const saturnMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      saturnMesh.position.set(0, 0, 0);
      planetObject.add(saturnMesh);

      // Saturn ring
      const ringInnerRadius = planetRadii[i] * 1.5;
      const ringOuterRadius = planetRadii[i] * 2.5;
      const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        map: loader.load('./img/saturn_s_ring_asset_true_color_by_askanery_dg6ymtr-pre.png'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
        // Optionally: map: loader.load('./img/saturn_ring.png')
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.position.set(0, 0, 0);
      ringMesh.rotation.x = Math.PI / 2.2; // Tilt the ring
      planetObject.add(ringMesh);

      planetObject.position.set(orbitRadius, 0, 0);
      scene.add(planetObject);

      planetMeshes.push({ mesh: planetObject, radius: orbitRadius, period: orbitalPeriods[i] });
    } else {
      const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
      planetMesh.position.set(orbitRadius, 0, 0);
      scene.add(planetMesh);

      planetMeshes.push({ mesh: planetMesh, radius: orbitRadius, period: orbitalPeriods[i] });
    }
  }

  return { planetMeshes, planetAngles };
}