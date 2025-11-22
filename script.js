<script>
  console.log('Starting Real Earth Upgrade...');

  // ... (Keep all your existing code up to the fragment shader definition) ...

  // Updated Fragment Shader (now with texture support)
  const fsSource = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;  // New: UV for textures
    uniform sampler2D uTexture;  // Texture sampler
    uniform float uTimeAge;      // For era blending
    uniform vec3 uLightDir;
    uniform bool uUseTexture;    // Toggle texture vs procedural
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(uLightDir);
      float diff = max(dot(normal, lightDir), 0.0);
      vec3 ambient = vec3(0.2, 0.3, 0.4);
      vec3 color;
      if (uUseTexture) {
        vec4 texColor = texture2D(uTexture, vUv);
        color = texColor.rgb * (ambient + diff);
      } else {
        // Fallback procedural (your current green-blue)
        vec3 diffuse = vec3(0.4, 0.6, 0.3) * diff;
        color = ambient + diffuse;
      }
      // Era shift: Tint for ancient eras if no texture
      float ageFactor = uTimeAge / 540.0;
      if (!uUseTexture) {
        color = mix(color, vec3(0.6, 0.4, 0.2), ageFactor * 0.7);
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ... (Keep shader compile, program setup) ...

  // Updated Sphere Geometry (add UV coords)
  function createSphere(radius, latitudeBands, longitudeBands) {
    const positions = [];
    const normals = [];
    const uvs = [];      // New: UV array
    const indices = [];
    for (let lat = 0; lat <= latitudeBands; lat++) {
      const theta = lat * Math.PI / latitudeBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let long = 0; long <= longitudeBands; long++) {
        const phi = long * 2 * Math.PI / longitudeBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const x = radius * cosPhi * sinTheta;
        const y = radius * cosTheta;
        const z = radius * sinPhi * sinTheta;
        positions.push(x, y, z);
        normals.push(x / radius, y / radius, z / radius);
        // Equirectangular UVs (for map wrapping)
        uvs.push(0.5 * (1.0 + phi / (2.0 * Math.PI)), 0.5 * (1.0 - theta / Math.PI));  // u=longitude, v=latitude flipped
      }
    }
    // ... (Keep indices loop) ...
    return { positions, normals, uvs, indices };
  }

  const sphereData = createSphere(2, 32, 64);

  // ... (Keep buffers for position/normal/index) ...

  // New: UV Buffer
  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereData.uvs), gl.STATIC_DRAW);

  // New: Texture setup
  const textureLocation = gl.getUniformLocation(program, 'uTexture');
  const useTextureLocation = gl.getUniformLocation(program, 'uUseTexture');
  let currentTexture = null;

  function loadTexture(url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      currentTexture = texture;
      console.log(`Loaded texture: ${url}`);
    };
    image.onerror = () => {
      console.warn(`Failed to load ${url} - using procedural`);
      currentTexture = null;
    };
    image.src = url;
    return texture;
  }

  // ... (Keep locations, matrices) ...

  // New: UV Attribute
  const uvLocation = gl.getAttribLocation(program, 'aUv');
  gl.enableVertexAttribArray(uvLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

  // Era textures map (add more as you upload)
  const eraTextures = {
    0: 'textures/earth_modern.jpg',      // Modern
    66: 'textures/cretaceous.jpg',       // Cretaceous
    100: 'textures/100ma.jpg',
    150: 'textures/jurassic.jpg',        // Jurassic
    200: 'textures/triassic.jpg',
    250: 'textures/pangaea.jpg',         // Pangaea
    340: 'textures/devonian.jpg',
    540: 'textures/cambrian.jpg'         // Cambrian
  };

  // Updated Timeline (load/switch textures)
  timeline.addEventListener('input', (e) => {
    currentAge = parseInt(e.target.value);
    yearEl.textContent = currentAge === 0 ? '現在 (0 Ma)' : `${currentAge} 百萬年前`;
    
    // Find nearest era
    const ages = Object.keys(eraTextures).map(Number).sort((a,b) => a-b);
    let nearestAge = 0;
    for (let i = ages.length - 1; i >= 0; i--) {
      if (currentAge >= ages[i]) {
        nearestAge = ages[i];
        break;
      }
    }
    const texUrl = eraTextures[nearestAge];
    loadTexture(texUrl);  // Load new texture
  });

  // Updated Render (bind texture)
  function render() {
    // ... (Keep clear, enable attrs) ...
    
    // Bind texture if available
    gl.activeTexture(gl.TEXTURE0);
    if (currentTexture) {
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);
      gl.uniform1i(textureLocation, 0);
      gl.uniform1i(useTextureLocation, 1);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.uniform1i(useTextureLocation, 0);
    }

    // ... (Keep uniforms, drawElements) ...
  }

  // Initial load modern texture
  loadTexture(eraTextures[0]);

  // ... (Keep animate, resize) ...

  // Hide loading, etc.
  document.getElementById('loading').style.display = 'none';
  document.getElementById('ui').style.display = 'block';
  animate();
  console.log('Real Earth upgraded! Slide for Pangaea magic.');
</script>
