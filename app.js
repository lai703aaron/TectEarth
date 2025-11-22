// =============== 3D Scene Setup ===============
const scene   = new THREE.Scene();
const camera  = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 8;
controls.maxDistance = 30;

// =============== Earth + Clouds + Atmosphere ===============
const earthGroup = new THREE.Group();
scene.add(earthGroup);

const earthGeo = new THREE.SphereGeometry(5, 128, 128);
let earthMat  = new THREE.MeshPhongMaterial();
const earth    = new THREE.Mesh(earthGeo, earthMat);
earthGroup.add(earth);

const cloudGeo = new THREE.SphereGeometry(5.05, 128, 128);
const cloudMat = new THREE.MeshPhongMaterial({
  map: new THREE.TextureLoader().load('https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/clouds.png'),
  transparent: true, opacity: 0.4
});
const clouds = new THREE.Mesh(cloudGeo, cloudMat);
earthGroup.add(clouds);

// simple glowing atmosphere
const atmGeo = new THREE.SphereGeometry(5.2, 64, 64);
const atmMat = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec3 vNormal;
    void main(){ vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main(){ float intensity = pow(0.7 - dot(vNormal, vec3(0.0,0.0,1.0)), 4.0);
      gl_FragColor = vec4(0.3,0.6,1.0,1.0) * intensity; }
  `,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  transparent: true
});
const atmosphere = new THREE.Mesh(atmGeo, atmMat);
earthGroup.add(atmosphere);

// =============== Lighting ===============
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 5, 10);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x333333));

// =============== Paleomap textures (public domain / fair use) ===============
// Add new ones anytime — just drop the image in /textures/ and add to this list
const paleomaps = {
   0: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/0_present.jpg",
  66: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/66_cretaceous.jpg",
 100: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/100_ma.jpg",
 150: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/150_jurassic.jpg",
 200: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/200_triassic.jpg",
 250: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/250_pangaea.jpg",
 340: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/340_devonian.jpg",
 540: "https://raw.githubusercontent.com/lai703aaron/TectEarth/main/textures/540_cambrian.jpg"
};

// preload present day
earthMat.map = new THREE.TextureLoader().load(paleomaps[0]);
earthMat.needsUpdate = true;

// =============== Timeline Control ===============
const timeline = document.getElementById('timeline');
const yearLabel = document.getElementById('year');

let currentAge = 0;

function getTextureForAge(ageMa) {
  const ages = Object.keys(paleomaps).map(Number).sort((a,b)=>a-b);
  for (let i = ages.length-1; i >= 0; i--) {
    if (ageMa >= ages[i]) return paleomaps[ages[i]];
  }
  return paleomaps[0];
}

timeline.addEventListener('input', (e) => {
  const age = Number(e.target.value);
  currentAge = age;
  yearLabel.textContent = age === 0 ? '現在 (0 Ma)' : `${age} 百萬年前`;

  const newUrl = getTextureForAge(age);

  // smooth fade transition
  const newTex = new THREE.TextureLoader().load(newUrl, () => {
    gsap.to(earthMat, {
      opacity: 0,
      duration: 0.4,
      onUpdate: () => earthMat.needsUpdate = true,
      onComplete: () => {
        earthMat.map = newTex;
        earthMat.opacity = 1;
        earthMat.needsUpdate = true;
        gsap.to(earthMat, {opacity:1, duration:0.6});
      }
    });
  });
});

// =============== Animation Loop ===============
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  clouds.rotation.y += 0.0001;
  earthGroup.rotation.y += 0.0003;   // slow auto rotation
  renderer.render(scene, camera);
}
animate();

// =============== Resize ===============
window.addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
