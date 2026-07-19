// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3.5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Textures
const textureLoader = new THREE.TextureLoader();
const colorMap = textureLoader.load('https://raw.githubusercontent.com/bobbyroe/vertex-earth/main/src/04_rainbow1k.jpg');
const elevMap = textureLoader.load('https://raw.githubusercontent.com/bobbyroe/vertex-earth/main/src/01_earthbump1k.jpg');
const alphaMap = textureLoader.load('https://raw.githubusercontent.com/bobbyroe/vertex-earth/main/src/02_earthspec1k.jpg');

const globeGroup = new THREE.Group();
scene.add(globeGroup);

// Wireframe base
const geo = new THREE.IcosahedronGeometry(1, 10);
const mat = new THREE.MeshBasicMaterial({
    color: 0x202020,
    wireframe: true
});
const wireframeMesh = new THREE.Mesh(geo, mat);
globeGroup.add(wireframeMesh);

// High-detail points
const detail = 120;
const pointsGeo = new THREE.IcosahedronGeometry(1, detail);

// Vertex Shader
const vertexShader = `
    uniform float size;
    uniform sampler2D elevTexture;
    varying vec2 vUv;
    varying float vVisible;
    void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
       
        float elv = texture2D(elevTexture, vUv).r;
       
        vec3 vNormal = normalMatrix * normal;
        vVisible = step(0.0, dot(-normalize(mvPosition.xyz), normalize(vNormal)));
       
        mvPosition.z += 0.35 * elv;
       
        gl_PointSize = size;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

// Fragment Shader
const fragmentShader = `
    uniform sampler2D colorTexture;
    uniform sampler2D alphaTexture;
    varying vec2 vUv;
    varying float vVisible;
    void main() {
        if (floor(vVisible + 0.1) == 0.0) discard;
       
        float alpha = 1.0 - texture2D(alphaTexture, vUv).r;
        vec3 color = texture2D(colorTexture, vUv).rgb;
       
        gl_FragColor = vec4(color, alpha);
    }
`;

// Uniforms & Shader Material
const uniforms = {
    size: { type: "f", value: 4.0 },
    colorTexture: { type: "t", value: colorMap },
    elevTexture: { type: "t", value: elevMap },
    alphaTexture: { type: "t", value: alphaMap }
};

const pointsMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true
});

const points = new THREE.Points(pointsGeo, pointsMat);
globeGroup.add(points);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 3);
scene.add(hemiLight);

// Starfield
function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02,
        sizeAttenuation: true
    });
   
    const vertices = [];
    for (let i = 0; i < 4500; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        vertices.push(x, y, z);
    }
   
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const starPoints = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starPoints);
    return starPoints;
}
createStarfield();

// Animation
function animate() {
    requestAnimationFrame(animate);
    globeGroup.rotation.y += 0.002;
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
