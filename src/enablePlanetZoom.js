import * as THREE from 'three';

let followPlanet = null;
let isZoomedIn = false;

export function enablePlanetZoom(renderer, camera, controls, planetMeshes, sunMesh) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('pointerdown', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Add sunMesh to selectable objects
    const objects = planetMeshes.map(obj => obj.mesh).concat(sunMesh);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects, true);

    if (intersects.length > 0) {
      let target = intersects[0].object;
      while (target.parent && !objects.includes(target)) {
        target = target.parent;
      }

      // Only zoom if not already following this object
      if (followPlanet !== target) {
        followPlanet = target;
        isZoomedIn = true;
        const worldPosition = new THREE.Vector3();
        target.getWorldPosition(worldPosition);
        zoomToPlanet(worldPosition, camera, controls, true);
      }
      // else: already following, do nothing
    } else {
      // Clicked empty space, stop following any planet
      followPlanet = null;
      isZoomedIn = false;
    }
  });
}

export function updateCameraFollow(camera, controls) {
  if (followPlanet && isZoomedIn) {
    const worldPosition = new THREE.Vector3();
    followPlanet.getWorldPosition(worldPosition);

    // Keep the camera at the same offset from the target as after zoom
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);

    controls.target.copy(worldPosition);
    camera.position.copy(worldPosition).add(offset);
    controls.update();
  }
}

function zoomToPlanet(targetPosition, camera, controls, zoomIn = false) {
  let offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  if (zoomIn) {
    offset.multiplyScalar(0.5);
  }
  let progress = 0;
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new THREE.Vector3().copy(targetPosition).add(offset);

  function animateZoom() {
    progress += 0.05;
    if (progress > 1) progress = 1;
    camera.position.lerpVectors(startPos, endPos, progress);
    controls.target.lerpVectors(startTarget, targetPosition, progress);
    controls.update();
    if (progress < 1) {
      requestAnimationFrame(animateZoom);
    }
  }
  animateZoom();
}