let scene, camera, renderer, earth, controls;
let isPlaying = false;
let animationDirection = 1;

init();
animate();

function init() {
  // 場景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000814);

  // 相機
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 3.5);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('container').appendChild(renderer.domElement);

  // 控制
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 地球
  const geometry = new THREE.SphereGeometry(1.5, 128, 128);
  const textureLoader = new THREE.TextureLoader();
  
  // 預載所有年代貼圖（使用我壓縮過的小圖，總共 < 5MB）
  const textures = {
    "-600": "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/600Ma.jpg",
    "-540": "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/540Ma.jpg",
    "-450": "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/450Ma.jpg",
    "-335": "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/335Ma.jpg",
    "-250": "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/250Ma.jpg",
    "-200": "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/200Ma.jpg", // 盤古大陸
    "-150": "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/150Ma.jpg",
    "-100": "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/100Ma.jpg",
    "-50":  "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/50Ma.jpg",
    "0":    "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/present.jpg",
    "50":   "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/future50.jpg",
    "100":  "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/future100.jpg",
    "250":  "https://raw.githubusercontent.com/ycgu/tectonic-earth-textures/main/250Ma_future.jpg"
  };

  const material = new THREE.MeshPhongMaterial({
    map: textureLoader.load(textures["0"]),
    bumpScale: 0.05,
    specular: new THREE.Color(0x333333),
    shininess: 15
  });

  earth = new THREE.Mesh(geometry, material);
  scene.add(earth);

  // 光源
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  // UI 控制
  const slider = document.getElementById('timeSlider');
  slider.addEventListener('input', (e) => {
    updateEarth(parseInt(e.target.value));
  });

  document.getElementById('playBtn').addEventListener('click', () => {
    isPlaying = !isPlaying;
    document.getElementById('playBtn').textContent = isPlaying ? "暫停" : "播放動畫";
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    slider.value = 0;
    updateEarth(0);
    isPlaying = false;
    document.getElementById('playBtn').textContent = "播放動畫";
  });

  window.addEventListener('resize', onWindowResize);
}

function updateEarth(ma) {
  const keys = Object.keys(textures).map(Number).sort((a,b)=>a-b);
  let closest = keys[0];
  for (let key of keys) {
    if (Math.abs(key - ma) < Math.abs(closest - ma)) closest = key;
  }

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(textures[closest], (tex) => {
    earth.material.map = tex;
    earth.material.needsUpdate = true;
  });

  const label = ma < 0 ? `${Math.abs(ma)} 百萬年前` : ma > 0 ? `未來 ${ma} 百萬年` : "現在";
  document.getElementById('timeLabel').textContent = label;
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (isPlaying) {
    let current = parseInt(document.getElementById('timeSlider').value);
    current += animationDirection * 2;
    if (current >= 250 || current <= -600) animationDirection *= -1;
    document.getElementById('timeSlider').value = current;
    updateEarth(current);
  }

  earth.rotation.y += 0.002;
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
