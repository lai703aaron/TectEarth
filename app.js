console.log('app.js starting...');

// Safety check
if (typeof THREE === 'undefined') {
  console.error('THREE not loaded!');
} else {
  console.log('Three.js loaded OK');
}

// Scene init
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 8;
controls.maxDistance = 30;

console.log('Scene & controls ready');

// Earth group
const earthGroup = new THREE.Group();
scene.add(earthGroup);

const loader = new THREE.TextureLoader();

// Procedural modern Earth (fallback if no textures)
const earthGeo = new THREE.SphereGeometry(5, 128, 128); // High-res for 3D detail
let earthMat = new THREE.MeshPhongMaterial({
  color: 0x2233ff, // Blue base
  // Load local textures for modern look (upload these JPGs)
  map: loader.load('textures/modern_earth.jpg', undefined, undefined, () => console.log('Earth texture fallback to procedural')),
  bumpMap: loader.load('textures/earth_bump.jpg'),
  bumpScale: 0.1,
  specular: 0x333333,
  shininess: 25
});
const earth = new THREE.Mesh(earthGeo, earthMat);
earthGroup.add(earth);

// Clouds (animated drift)
const cloudGeo = new THREE.SphereGeometry(5.01, 128, 128);
const cloudMat = new THREE.MeshPhongMaterial({
  map: loader.load('textures/clouds.jpg'),
  transparent: true,
  opacity: 0.4
});
const clouds = new THREE.Mesh(cloudGeo, cloudMat);
earthGroup.add(clouds);

// Glowing atmosphere shader
const atmGeo = new THREE.SphereGeometry(5.2, 64, 64);
const atmMat = new THREE.ShaderMaterial({
  vertexShader: 'varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'varying vec3 vNormal; void main() { float intensity = pow(0.7 - dot(vNormal, vec3(0,0,1.0)), 2.0); gl_FragColor = vec4(0.3,0.6,1.0, 1) * intensity; }',
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  transparent: true
});
const atmosphere = new THREE.Mesh(atmGeo, atmMat);
earthGroup.add(atmosphere);

console.log('Earth models created');

// Lighting for modern shine
const ambient = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 5, 5);
scene.add(sun);

// Time slider logic (procedural paleomap shifts)
const timeline = document.getElementById('timeline');
const yearEl = document.getElementById('year');
const ui = document.getElementById('ui');
ui.style.display = 'block'; // Show UI now

let currentAge = 0;
timeline.addEventListener('input', (e) => {
  currentAge = parseInt(e.target.value);
  yearEl.textContent = currentAge === 0 ? '現在 (0 Ma)' : `${currentAge} 百萬年前`;
  
  // Procedural "paleo" change: Shift colors/rotation for demo (fade to land-heavy for past)
  const targetColor = currentAge > 200 ? new THREE.Color(0x8B4513) : new THREE.Color(0x2233ff); // Brown for Pangaea
  gsap.to(earthMat.color, {
    r: targetColor.r, g: targetColor.g, b: targetColor.b,
    duration: 1,
    onUpdate: () => earthMat.needsUpdate = true
  });
  // Add rotation shift for "drift"
  gsap.to(earth.rotation, { y: currentAge * 0.01, duration: 1 });
});

console.log('Timeline ready');

// Animation loop - THIS MAKES IT SPIN!
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  earthGroup.rotation.y += 0.005; // Auto-spin!
  clouds.rotation.y += 0.001; // Cloud drift
  renderer.render(scene, camera);
}
animate();

console.log('Animation started - Earth should spin!');

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('app.js fully loaded - Check for Earth!');
