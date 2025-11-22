// Three.js 設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 地球球體
const geometry = new THREE.SphereGeometry(5, 32, 32);
const material = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load('https://threejsfundamentals.org/threejs/resources/images/equirectangularmaps/tears_of_steel_bridge_2k.jpg'), // 替換為真實地球紋理
    wireframe: false
});
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// 光源
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10, 10, 10);
scene.add(light);

camera.position.z = 10;

// 簡單板塊數據 (示例：大陸位置偏移)
const plateData = {
    0: { rotation: new THREE.Euler(0, 0, 0) }, // 現在
    100: { rotation: new THREE.Euler(0, Math.PI / 4, 0) }, // 1億年前
    200: { rotation: new THREE.Euler(0, Math.PI / 2, 0) }, // 2億年前 (Pangaea 附近)
    // 添加更多數據...
};

// 時間軸控制
const timeline = document.getElementById('timeline');
const yearDisplay = document.getElementById('yearDisplay');
timeline.addEventListener('input', (e) => {
    const ma = parseInt(e.target.value); // 百萬年前
    yearDisplay.textContent = ma === 0 ? '現在' : `${ma} 百萬年前`;
    updateEarth(ma);
});

function updateEarth(ma) {
    // 插值或查找數據
    const key = Math.min(...Object.keys(plateData).filter(k => k >= ma));
    earth.rotation.copy(plateData[key] || plateData[0].rotation);
    // 在真實實現中，使用 GPlates 數據計算真實位置
}

// 旋轉控制
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const delta = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };
        earth.rotation.y += delta.x * 0.01;
        earth.rotation.x += delta.y * 0.01;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
});

document.addEventListener('mouseup', () => { isDragging = false; });

// 動畫循環
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// 調整視窗大小
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
