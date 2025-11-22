// Three.js 設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 地球球體
const geometry = new THREE.SphereGeometry(5, 64, 64); // 更高解析度
const textureLoader = new THREE.TextureLoader();
const material = new THREE.MeshPhongMaterial({
    map: textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg'), // 真實地球紋理 (可替換)
    specularMap: textureLoader.load('https://threejs.org/examples/textures/water.jpg'), // 添加光澤
    shininess: 25
});
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// 光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// 相機位置
camera.position.z = 10;

// OrbitControls for better rotation
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// 簡單板塊數據 (示例：使用歐拉旋轉模擬整體地球視角變化；真實應使用個別板塊 Mesh 和 GPlates 旋轉數據)
const plateData = {
    0: { rotation: new THREE.Euler(0, 0, 0) }, // 現在
    50: { rotation: new THREE.Euler(0.1, 0.2, 0.05) }, // 5000萬年前
    100: { rotation: new THREE.Euler(0.2, 0.4, 0.1) }, // 1億年前
    150: { rotation: new THREE.Euler(0.3, 0.6, 0.15) }, // 1.5億年前
    200: { rotation: new THREE.Euler(0.4, 0.8, 0.2) }, // 2億年前 (近 Pangaea)
    250: { rotation: new THREE.Euler(0.5, 1.0, 0.25) }, // 2.5億年前
    300: { rotation: new THREE.Euler(0.6, 1.2, 0.3) }, // 3億年前
    350: { rotation: new THREE.Euler(0.7, 1.4, 0.35) }, // 3.5億年前
    400: { rotation: new THREE.Euler(0.8, 1.6, 0.4) }, // 4億年前
    450: { rotation: new THREE.Euler(0.9, 1.8, 0.45) }, // 4.5億年前
    500: { rotation: new THREE.Euler(1.0, 2.0, 0.5) }, // 5億年前
    540: { rotation: new THREE.Euler(1.1, 2.2, 0.55) }  // 5.4億年前 (寒武紀)
    // 注意：這是簡化；真實數據來自 Scotese PaleoAtlas (下載 https://www.earthbyte.org/webdav/ftp/earthbyte/Scotese_PaleoAtlas_v3.zip)，提取 .rot 文件並計算位置
};

// 時間軸控制
const timeline = document.getElementById('timeline');
const yearDisplay = document.getElementById('yearDisplay');
timeline.addEventListener('input', (e) => {
    const ma = parseInt(e.target.value);
    yearDisplay.textContent = ma === 0 ? '現在' : `${ma} 百萬年前`;
    updateEarth(ma);
});

let currentRotation = new THREE.Euler();
function updateEarth(ma) {
    // 查找最近的 key
    let keys = Object.keys(plateData).map(Number).sort((a, b) => a - b);
    let key = keys.find(k => k >= ma) || keys[keys.length - 1];
    const targetRotation = plateData[key].rotation;

    // 簡單插值動畫 (過渡效果)
    gsap.to(currentRotation, {
        x: targetRotation.x,
        y: targetRotation.y,
        z: targetRotation.z,
        duration: 1,
        onUpdate: () => {
            earth.rotation.set(currentRotation.x, currentRotation.y, currentRotation.z);
        }
    });
}

// 為了動畫過渡，添加 GSAP (CDN 在 HTML 中添加 <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js"></script> 如果需要；否則移除 gsap 並直接設定)

// 動畫循環
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// 調整視窗大小
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 初始化
updateEarth(0);
