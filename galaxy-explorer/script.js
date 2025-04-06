// Galaxy Explorer - A 3D galaxy simulation with flight controls

// Initialize Three.js scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('container').appendChild(renderer.domElement);

// Movement and rotation variables
const movement = {
    forward: false,
    backward: false,
    left: false,
    right: false, 
    speed: 1.0
};
let rotationX = 0;
let rotationY = 0;
const mouseSensitivity = 0.002;

// Create stars for the galaxy
function createGalaxy() {
    // Parameters
    const params = {
        count: 20000,         // Number of stars
        size: 0.015,          // Star size
        radius: 1000,         // Galaxy radius
        branches: 5,          // Number of spiral arms
        spin: 1,              // How much the arms spin
        randomness: 0.2,      // Random spread 
        randomnessPower: 3,   // Controls distribution
        insideColor: 0x3388ff,// Core color
        outsideColor: 0xff5500 // Edge color
    };
  
    // Create star geometry
    const positions = new Float32Array(params.count * 3);
    const colors = new Float32Array(params.count * 3);
    const scales = new Float32Array(params.count);
    
    const insideColor = new THREE.Color(params.insideColor);
    const outsideColor = new THREE.Color(params.outsideColor);
    
    // Generate galaxy
    for (let i = 0; i < params.count; i++) {
        const i3 = i * 3;
        
        // Position
        const radius = Math.random() * params.radius;
        const spinAngle = radius * params.spin;
        const branchAngle = (i % params.branches) / params.branches * Math.PI * 2;
        
        // Randomness
        const randomX = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;
        const randomY = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;
        const randomZ = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;
        
        positions[i3    ] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;
        
        // Color
        const mixColor = new THREE.Color();
        mixColor.copy(insideColor).lerp(outsideColor, radius / params.radius);
        
        colors[i3    ] = mixColor.r;
        colors[i3 + 1] = mixColor.g;
        colors[i3 + 2] = mixColor.b;

        // Scale (size variation based on distance from center)
        scales[i] = Math.random() * params.size;
    }
    
    // Create star material and geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    
    // Custom star shader material
    const material = new THREE.ShaderMaterial({
        vertexShader: `
            attribute float aScale;
            varying vec3 vColor;
            
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = aScale * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            
            void main() {
                float strength = distance(gl_PointCoord, vec2(0.5));
                strength = 1.0 - strength;
                strength = pow(strength, 3.0);
                
                vec3 color = vColor * strength;
                gl_FragColor = vec4(color, 1.0);
            }
        `,
        transparent: true,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    // Create particle system and add to scene
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    
    // Create a central bright core
    const coreGeometry = new THREE.SphereGeometry(5, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({ 
        color: params.insideColor,
        transparent: true,
        opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);
    
    // Add a soft glow to the core
    const coreLight = new THREE.PointLight(params.insideColor, 2, 100);
    scene.add(coreLight);
    
    return { points, core };
}

// Add some distant background stars
function createBackgroundStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: false
    });
    
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Create a galaxy and background stars
const galaxy = createGalaxy();
createBackgroundStars();

// Set initial camera position
camera.position.set(100, 50, 100);
camera.lookAt(0, 0, 0);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handle keyboard controls
window.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w': movement.forward = true; break;
        case 's': movement.backward = true; break;
        case 'a': movement.left = true; break;
        case 'd': movement.right = true; break;
        case 'shift': movement.speed = 3.0; break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w': movement.forward = false; break;
        case 's': movement.backward = false; break;
        case 'a': movement.left = false; break;
        case 'd': movement.right = false; break;
        case 'shift': movement.speed = 1.0; break;
    }
});

// Handle mouse controls for looking around
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
        rotationY -= e.movementX * mouseSensitivity;
        rotationX -= e.movementY * mouseSensitivity;
        
        // Limit vertical rotation to prevent flipping
        rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));
    }
});

// Click to enable mouse controls
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

// Animation and movement control
function animate() {
    requestAnimationFrame(animate);
    
    // Calculate movement direction based on camera orientation
    const moveSpeed = 0.5 * movement.speed;
    
    // Create direction vectors
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    
    // Apply movement
    if (movement.forward) camera.position.addScaledVector(forward, moveSpeed);
    if (movement.backward) camera.position.addScaledVector(forward, -moveSpeed);
    if (movement.left) camera.position.addScaledVector(right, -moveSpeed);
    if (movement.right) camera.position.addScaledVector(right, moveSpeed);
    
    // Apply rotation based on mouse movement
    camera.rotation.order = 'YXZ'; // Set rotation order
    camera.rotation.y = rotationY;
    camera.rotation.x = rotationX;
    
    // Rotate galaxy core slightly for a more dynamic experience
    galaxy.core.rotation.y += 0.001;
    
    renderer.render(scene, camera);
}

animate(); 