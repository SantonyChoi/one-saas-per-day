// Global variables
let scene, camera, renderer;
let ball, floor;
let ballVelocity = { x: 0, y: 0, z: 0 };
const gravity = 0.01;
const damping = 0.8; // Energy loss on bounce
const initialPosition = { x: 0, y: 5, z: 0 };
let debugMode = true; // Set to true to show debug information

// Mouse tracking variables
let mouse = new THREE.Vector2();
let prevMouse = new THREE.Vector2();
let mouseVelocity = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let isMouseMoving = false;
let lastMouseMoveTime = 0;
const mouseVelocityUpdateInterval = 10; // Reduced from 20ms to 10ms for more responsive updates
let mousePointer;
let mouseTrail = []; // Store recent mouse positions for trail effect

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

    // Add a wireframe to the ball for better visual depth
    const ballWireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(ballGeometry),
        new THREE.LineBasicMaterial({ 
            color: 0x4fa8e2, 
            transparent: true, 
            opacity: 0.3 
        })
    );
    ball.add(ballWireframe);

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

    // Add debug info display
    if (debugMode) {
        createDebugInfo();
    }
    
    // Add keyboard event listener for toggling debug mode
    window.addEventListener('keydown', onKeyDown);
}

// Create a visual representation of the mouse pointer in 3D space
function createMousePointer() {
    const pointerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const pointerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff5555, 
        transparent: true,
        opacity: 0.7,
        emissive: 0xff2222,
        emissiveIntensity: 0.5
    });
    mousePointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
    mousePointer.position.set(0, 0, 5);
    
    // Add trails to show movement
    const trailGeometry = new THREE.RingGeometry(0.1, 0.4, 16);
    const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff3333, 
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.rotation.x = Math.PI / 2;
    mousePointer.add(trail);
    
    scene.add(mousePointer);
}

// Handle keyboard input
function onKeyDown(event) {
    // Toggle debug mode with 'D' key
    if (event.key === 'd' || event.key === 'D') {
        debugMode = !debugMode;
        const debugElement = document.getElementById('debug-info');
        if (debugElement) {
            debugElement.style.display = debugMode ? 'block' : 'none';
        }
    }
    
    // Reset ball with 'R' key
    if (event.key === 'r' || event.key === 'R') {
        resetBall();
    }
}

// Create debug information display
function createDebugInfo() {
    const debugElement = document.createElement('div');
    debugElement.id = 'debug-info';
    debugElement.style.position = 'absolute';
    debugElement.style.top = '50px';
    debugElement.style.left = '10px';
    debugElement.style.color = 'white';
    debugElement.style.fontFamily = 'monospace';
    debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    debugElement.style.padding = '10px';
    debugElement.style.borderRadius = '5px';
    debugElement.style.width = '250px';
    debugElement.innerHTML = 'Debug Info Loading...';
    document.body.appendChild(debugElement);
}

// Update debug information
function updateDebugInfo() {
    if (!debugMode) return;
    
    const debugElement = document.getElementById('debug-info');
    if (!debugElement) return;
    
    const distance = ball.position.distanceTo(mousePointer.position);
    const speed = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y);
    
    debugElement.innerHTML = `
        <b>Ball Position:</b> X: ${ball.position.x.toFixed(2)}, Y: ${ball.position.y.toFixed(2)}, Z: ${ball.position.z.toFixed(2)}<br>
        <b>Ball Velocity:</b> X: ${ballVelocity.x.toFixed(2)}, Y: ${ballVelocity.y.toFixed(2)}, Z: ${ballVelocity.z.toFixed(2)}<br>
        <b>Mouse Velocity:</b> ${speed.toFixed(2)}<br>
        <b>Distance to Ball:</b> ${distance.toFixed(2)}<br>
        <b>Is Mouse Moving:</b> ${isMouseMoving}<br>
        <hr>
        <i>Press 'D' to toggle debug mode</i><br>
        <i>Press 'R' to reset ball</i>
    `;
}

// Update the mouse pointer position based on raycasting
function updateMousePointer() {
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersection with the scene
    const pointerDistance = 5;
    const pointerPosition = new THREE.Vector3();
    raycaster.ray.at(pointerDistance, pointerPosition);
    
    // Check if mouse position has changed significantly
    if (mousePointer.position.distanceTo(pointerPosition) > 0.01) {
        // Store previous position for trail
        if (isMouseMoving) {
            mouseTrail.push(mousePointer.position.clone());
            if (mouseTrail.length > 5) {
                mouseTrail.shift();
            }
        }
    }
    
    // Update mouse pointer position
    mousePointer.position.copy(pointerPosition);
    
    // Update mouse trail
    if (mouseTrail.length > 0 && mousePointer.children.length > 1) {
        // Remove old trail meshes
        for (let i = mousePointer.children.length - 1; i > 0; i--) {
            if (mousePointer.children[i].userData.isTrail) {
                mousePointer.remove(mousePointer.children[i]);
            }
        }
        
        // Add new trail meshes
        mouseTrail.forEach((position, index) => {
            const opacity = 0.2 * (index + 1) / mouseTrail.length;
            const trailMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff3333, 
                transparent: true,
                opacity: opacity,
                side: THREE.DoubleSide
            });
            
            const trailMesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                trailMaterial
            );
            trailMesh.position.copy(position);
            trailMesh.userData.isTrail = true;
            mousePointer.add(trailMesh);
        });
    }
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
        }, 300); // Increased from 100ms to 300ms
    }
}

// Check collision between the mouse pointer and the ball
function checkMouseCollision() {
    const ballRadius = 1;
    const mouseRadius = 0.3; // Increased from 0.2 to 0.3
    const distance = ball.position.distanceTo(mousePointer.position);
    
    // Debug collision detection
    if (distance < ballRadius + mouseRadius + 0.5) {
        mousePointer.material.color.set(0xffff00);
    } else {
        mousePointer.material.color.set(0xff5555);
    }
    
    // Check for collision
    if (distance < ballRadius + mouseRadius) {
        // Calculate mouse velocity magnitude (consider adding a minimum velocity)
        const speed = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y);
        
        // Lower the threshold for applying force
        if (speed > 0.1) { // Reduced from 0.3 to 0.1
            // Direction from mouse to ball
            const direction = new THREE.Vector3()
                .subVectors(ball.position, mousePointer.position)
                .normalize();
            
            // Apply force based on mouse speed - increased force multiplier
            const force = 0.3 * speed; // Increased from 0.1 to 0.3
            ballVelocity.x += direction.x * force;
            ballVelocity.y += direction.y * force;
            ballVelocity.z += direction.z * force;
            
            // Add some randomness to make it more interesting
            ballVelocity.x += (Math.random() - 0.5) * 0.05;
            ballVelocity.z += (Math.random() - 0.5) * 0.05;
            
            // More obvious visual feedback - change ball color briefly
            const originalColor = ball.material.color.getHex();
            ball.material.color.set(0xff3300);
            ball.material.emissive = new THREE.Color(0xff0000);
            ball.material.emissiveIntensity = 0.5;
            
            setTimeout(() => {
                ball.material.color.set(originalColor);
                ball.material.emissive = new THREE.Color(0x000000);
                ball.material.emissiveIntensity = 0;
            }, 200);
            
            // Log collision for debugging
            console.log("Ball hit! Speed:", speed, "Force:", force);
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
    
    // Update debug info
    updateDebugInfo();
    
    // Render scene
    renderer.render(scene, camera);
}

// Start the app
init();
animate(); 