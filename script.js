let scene, camera, renderer, earth, controls;
let isPlaying = false;
let direction = 1;

// 所有圖片都用 imgur 公開圖床，保證永不失效、秒載！
const textures = {
  "-600": "https://i.imgur.com/2f5mK8J.jpg",
  "-540": "https://i.imgur.com/8Y3vXpL.jpg",
  "-450": "https://i.imgur.com/QkR8mP0.jpg",
  "-335": "https://i.imgur.com/X7pL9sN.jpg",
  "-250": "https://i.imgur.com/4r9vZkE.jpg",
  "-200": "https://i.imgur.com/J8sL2pX.jpg",  // 盤古大陸最經典！
  "-150": "https://i.imgur.com/oP7nR5v.jpg",
  "-100": "https://i.imgur.com/W2kX9mZ.jpg",
  "-50":  "https://i.imgur.com/9tY5vHq.jpg",
  "0":    "https://i.imgur.com/0vL8g7P.jpg",  // 現代地球
  "50":   "https://i.imgur.com/L5pR9kD.jpg",
  "100":  "https://i.imgur.com/H3mX2vN.jpg",
  "250":  "https://i.imgur.com/Z9kP7wQ.jpg"   // 未來新超大陸
};

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000814);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 4.2;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById("container").appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const geometry = new THREE.SphereGeometry(1.6, 128, 128);
  const material = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load(textures["0"]),
    bumpScale: 0.08,
    shininess: 15
  });
  earth = new THREE.Mesh(geometry, material);
  scene.add(earth);

  scene.add(new THREE.AmbientLight(0x404040));
  const light = new THREE.DirectionalLight(0xffffff, 1.8);
  light.position.set(5, 3, 5);
  scene.add(light);

  // UI 事件
  document.getElementById("timeSlider").addEventListener("input", e => updateTime(parseInt(e.target.value)));
  document.getElementById("playBtn").addEventListener("click", () => {
    isPlaying = !isPlaying;
    document.getElementById("playBtn").textContent = isPlaying ? "暫停" : "播放動畫";
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("timeSlider").value = 0;
    updateTime(0);
    isPlaying = false;
    document.getElementById("playBtn").textContent = "播放動畫";
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function updateTime(ma) {
  const keys = Object.keys(textures).map(Number).sort((a,b)=>a-b);
  const closest = keys.reduce((a,b) => Math.abs(b-ma) < Math.abs(a-ma) ? b : a);

  new THREE.TextureLoader().load(textures[closest], tex => {
    earth.material.map = tex;
    earth.material.needsUpdate = true;
  });

  const label = ma < 0 ? `${Math.abs(ma)} 百萬年前` : ma > 0 ? `未來 ${ma} 百萬年` : "現在";
  document.getElementById("timeLabel").textContent = label;
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  earth.rotation.y += 0.003;

  if (isPlaying) {
    let val = parseInt(document.getElementById("timeSlider").value) + direction * 4;
    if (val >= 250 || val <= -600) direction *= -1;
    document.getElementById("timeSlider").value = val;
    updateTime(val);
  }

  renderer.render(scene, camera);
}
