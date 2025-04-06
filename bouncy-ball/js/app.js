// Global variables
let scene, camera, renderer;
let ball, floor;
let ballVelocity = 0;
const gravity = 0.01;
const damping = 0.8; // Energy loss on bounce
const initialY = 5;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    // Create ball
    const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
    const ballMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3498db,
        specular: 0xffffff,
        shininess: 100
    });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.y = initialY; // Start from some height
    ball.castShadow = true;
    scene.add(ball);

    // Create floor
    const floorGeometry = new THREE.BoxGeometry(15, 0.5, 15);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x2ecc71 });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add walls
    addWalls();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create walls around the scene
function addWalls() {
    const wallMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xe74c3c, 
        transparent: true,
        opacity: 0.5
    });
    
    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(15, 10, 0.5),
        wallMaterial
    );
    backWall.position.set(0, 3, -7.5);
    backWall.receiveShadow = true;
    scene.add(backWall);
    
    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 10, 15),
        wallMaterial
    );
    leftWall.position.set(-7.5, 3, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 10, 15),
        wallMaterial
    );
    rightWall.position.set(7.5, 3, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update the ball's position using physics
function updateBall() {
    // Apply gravity to velocity
    ballVelocity -= gravity;
    
    // Update position
    ball.position.y += ballVelocity;
    
    // Check for collision with floor
    if (ball.position.y <= -0.5) { // Floor position + ball radius
        ball.position.y = -0.5; // Place ball on floor
        
        // Reverse velocity and apply damping
        if (Math.abs(ballVelocity) > 0.05) {
            ballVelocity = -ballVelocity * damping;
        } else {
            // Stop bouncing if velocity is very low
            ballVelocity = 0;
            // After a brief pause, reset the ball
            setTimeout(() => {
                ball.position.y = initialY;
                ballVelocity = 0;
            }, 1000);
        }
    }
    
    // Simple left-right movement to make it more interesting
    ball.position.x = 2 * Math.sin(Date.now() * 0.001);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate the ball
    ball.rotation.x += 0.01;
    ball.rotation.z += 0.01;
    
    // Update ball physics
    updateBall();
    
    // Render scene
    renderer.render(scene, camera);
}

// Start the app
init();
animate(); 