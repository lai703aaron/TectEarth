const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 0, 18);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 10;
controls.maxDistance = 40;

// Stars background
scene.background = new THREE.CubeTextureLoader()
  .setPath('https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/stars/')
  .load(['px.jpg','nx.jpg','py.jpg','ny.jpg','pz.jpg','nz.jpg']);

// Earth group
const earthGroup = new THREE.Group();
scene.add(earthGroup);

// High-res Earth (8K)
const loader = new THREE.TextureLoader();
const earthGeo = new THREE.SphereGeometry(5, 256, 256);
const earthMat = new THREE.MeshPhongMaterial({
  map:          loader.load('https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/8k_earth_daymap.jpg'),
  bumpMap:      loader.load('https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/8k_earth_bump.jpg'),
  bumpScale:    0.15,
  specularMap:  loader.load('https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/8k_earth_specular.jpg'),
  specular:     new THREE.Color('grey'),
  shininess:    15,
  emissiveMap:  loader.load('https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/8k_earth_nightmap.jpg'),
  emissive:     new THREE.Color(0x333333),
  emissiveIntensity: 1.5
});
const earth = new THREE.Mesh(earthGeo, earthMat);
earthGroup.add(earth);

// Realistic clouds (8K)
const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(5.05, 256, 256),
  new THREE.MeshPhongMaterial({
    map: loader.load('https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/8k_earth_clouds.jpg'),
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  })
);
earthGroup.add(clouds);

// Glowing atmosphere
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(5.3, 64, 64),
  new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.75 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  })
);
earthGroup.add(atmosphere);

// Lighting
scene.add(new THREE.AmbientLight(0x404040));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(15, 8, 12);
scene.add(sun);

// Paleomap textures (same keys as before)
const paleomaps = {
   0: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/8k_earth_daymap.jpg",     // modern 8K
  66: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/paleo/66_cretaceous.jpg",
 100: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/paleo/100_ma.jpg",
 150: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/paleo/150_jurassic.jpg",
 200: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/paleo/200_triassic.jpg",
 250: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/paleo/250_pangaea.jpg",
 340: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/paleo/340_devonian.jpg",
 540: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/paleo/540_cambrian.jpg"
};

// Timeline
const timeline = document.getElementById('timeline');
const yearLabel = document.getElementById('year');
let currentAge = 0;

function getMapForAge(age) {
  const ages = Object.keys(paleomaps).map(Number).sort((a,b)=>a-b);
  for (let i = ages.length-1; i >= 0; i--) {
    if (age >= ages[i]) return paleomaps[ages[i]];
  }
  return paleomaps[0];
}

timeline.addEventListener('input', e => {
  const age = Number(e.target.value);
  currentAge = age;
  yearLabel.textContent = age === 0 ? '現在 (0 Ma)' : `${age} 百萬年前`;

  const url = getMapForAge(age);
  const newTex = loader.load(url, () => {
    gsap.to(earthMat, {
      opacity: 0, duration: 0.5,
      onUpdate: () => earthMat.needsUpdate = true,
      onComplete: () => {
        earthMat.map = newTex;
        earthMat.opacity = 1;
        earthMat.needsUpdate = true;
        gsap.to(earthMat, {opacity:1, duration:0.7});
      }
    });
  });
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  clouds.rotation.y += 0.00015;
  earthGroup.rotation.y += 0.0002;
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
