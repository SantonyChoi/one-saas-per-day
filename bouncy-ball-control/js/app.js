// Global variables
let scene, camera, renderer;
let ball, floor;
let ballVelocity = { x: 0, y: 0, z: 0 };
const gravity = 0.01;
const damping = 0.8; // Energy loss on bounce
const initialPosition = { x: 0, y: 5, z: 0 };

// Mouse tracking variables
let mouse = new THREE.Vector2();
let prevMouse = new THREE.Vector2();
let mouseVelocity = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let isMouseMoving = false;
let lastMouseMoveTime = 0;
const mouseVelocityUpdateInterval = 20; // ms between updates
let mousePointer;

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
    ball.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
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

    // Create visual mouse pointer for better feedback
    createMousePointer();

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    
    // Initialize mouse position
    prevMouse.x = mouse.x;
    prevMouse.y = mouse.y;
}

// Create a visual representation of the mouse pointer in 3D space
function createMousePointer() {
    const pointerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const pointerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff5555, 
        transparent: true,
        opacity: 0.7,
        emissive: 0xff2222,
        emissiveIntensity: 0.5
    });
    mousePointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
    mousePointer.position.set(0, 0, 5);
    scene.add(mousePointer);
}

// Update the mouse pointer position based on raycasting
function updateMousePointer() {
    raycaster.setFromCamera(mouse, camera);
    
    // Find the point 5 units away from the camera in the mouse direction
    const pointerDistance = 5;
    const pointerPosition = new THREE.Vector3();
    raycaster.ray.at(pointerDistance, pointerPosition);
    mousePointer.position.copy(pointerPosition);
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

// Handle mouse movement
function onMouseMove(event) {
    // Calculate normalized mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    // Track mouse velocity
    const now = Date.now();
    if (now - lastMouseMoveTime > mouseVelocityUpdateInterval) {
        // Calculate mouse velocity
        mouseVelocity.x = (mouse.x - prevMouse.x) * 100;
        mouseVelocity.y = (mouse.y - prevMouse.y) * 100;
        
        // Update previous mouse position
        prevMouse.x = mouse.x;
        prevMouse.y = mouse.y;
        
        // Update timestamp
        lastMouseMoveTime = now;
        
        // Flag that mouse is moving
        isMouseMoving = true;
        
        // Reset flag after short delay to detect when mouse stops
        setTimeout(() => {
            isMouseMoving = false;
        }, 100);
    }
}

// Check collision between the mouse pointer and the ball
function checkMouseCollision() {
    if (!isMouseMoving) return;
    
    const ballRadius = 1;
    const mouseRadius = 0.2;
    const distance = ball.position.distanceTo(mousePointer.position);
    
    // Check for collision
    if (distance < ballRadius + mouseRadius) {
        // Calculate mouse velocity magnitude
        const speed = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y);
        
        // Only apply force if mouse is moving with enough speed
        if (speed > 0.3) {
            // Direction from mouse to ball
            const direction = new THREE.Vector3()
                .subVectors(ball.position, mousePointer.position)
                .normalize();
            
            // Apply force based on mouse speed
            const force = 0.1 * speed;
            ballVelocity.x += direction.x * force;
            ballVelocity.y += direction.y * force;
            ballVelocity.z += direction.z * force;
            
            // Visual feedback - change ball color briefly
            const originalColor = ball.material.color.getHex();
            ball.material.color.set(0xff9500);
            setTimeout(() => {
                ball.material.color.set(originalColor);
            }, 100);
        }
    }
}

// Update the ball's position using physics
function updateBall() {
    // Apply gravity to Y velocity
    ballVelocity.y -= gravity;
    
    // Update position
    ball.position.x += ballVelocity.x;
    ball.position.y += ballVelocity.y;
    ball.position.z += ballVelocity.z;
    
    // Check for collision with floor
    if (ball.position.y <= -0.5) { // Floor position + ball radius
        ball.position.y = -0.5; // Place ball on floor
        
        // Reverse Y velocity and apply damping
        if (Math.abs(ballVelocity.y) > 0.05) {
            ballVelocity.y = -ballVelocity.y * damping;
            // Reduce X and Z velocity due to friction with floor
            ballVelocity.x *= damping;
            ballVelocity.z *= damping;
        } else {
            // Stop y bouncing if velocity is very low
            ballVelocity.y = 0;
        }
    }
    
    // Check for collision with walls
    // Left and right walls
    if (ball.position.x <= -6.5 || ball.position.x >= 6.5) {
        if (ball.position.x <= -6.5) ball.position.x = -6.5;
        if (ball.position.x >= 6.5) ball.position.x = 6.5;
        ballVelocity.x = -ballVelocity.x * damping;
    }
    
    // Back wall
    if (ball.position.z <= -6.5) {
        ball.position.z = -6.5;
        ballVelocity.z = -ballVelocity.z * damping;
    }
    
    // Front boundary (invisible)
    if (ball.position.z >= 6.5) {
        ball.position.z = 6.5;
        ballVelocity.z = -ballVelocity.z * damping;
    }
    
    // Apply air resistance
    ballVelocity.x *= 0.99;
    ballVelocity.z *= 0.99;
    
    // Reset if ball is almost stopped
    const totalVelocity = Math.abs(ballVelocity.x) + Math.abs(ballVelocity.y) + Math.abs(ballVelocity.z);
    if (totalVelocity < 0.05 && ball.position.y <= -0.4) {
        // Reset after a delay if ball is nearly stopped
        setTimeout(() => {
            resetBall();
        }, 2000);
    }
}

// Reset the ball to initial position
function resetBall() {
    ball.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
    ballVelocity = { x: 0, y: 0, z: 0 };
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update mouse pointer
    updateMousePointer();
    
    // Check for collision with ball
    checkMouseCollision();
    
    // Rotate the ball based on velocity
    ball.rotation.x += ballVelocity.z * 0.1;
    ball.rotation.z -= ballVelocity.x * 0.1;
    
    // Update ball physics
    updateBall();
    
    // Render scene
    renderer.render(scene, camera);
}

// Start the app
init();
animate(); 