// Game constants
const GROUND_HEIGHT = 20;
const GRAVITY = 0.6;
const JUMP_FORCE = 12;
const INITIAL_GAME_SPEED = 5;
const MAX_GAME_SPEED = 12;
const ACCELERATION = 0.001;
const CLOUD_FREQUENCY = 0.5; // % chance per frame
const NIGHT_MODE_SCORE = 500; // Score at which night mode starts

// Game variables
let canvas, ctx;
let gameSpeed = INITIAL_GAME_SPEED;
let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = 0;
let frameCount = 0;
let spawnTimer = 0;
let isNightMode = false;
let lastObstacleScore = 0;

// Game objects
let dino = null;
let ground = null;
let obstacles = [];
let clouds = [];

// Assets
const sprites = {};
const sounds = {};
let assetsLoaded = 0;
let totalAssets = 0;
let assetLoadingTimeout = null;

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// Asset loading
function loadAssets() {
  const imagesToLoad = [
    { name: 'dino-run1', src: 'assets/dino-run1.png' },
    { name: 'dino-run2', src: 'assets/dino-run2.png' },
    { name: 'dino-jump', src: 'assets/dino-jump.png' },
    { name: 'dino-dead', src: 'assets/dino-dead.png' },
    { name: 'dino-stationary', src: 'assets/dino-stationary.png' },
    { name: 'ground', src: 'assets/ground.png' },
    { name: 'cloud', src: 'assets/cloud.png' },
    { name: 'cactus-small', src: 'assets/cactus-small.png' },
    { name: 'cactus-large', src: 'assets/cactus-large.png' },
    { name: 'cactus-group', src: 'assets/cactus-group.png' },
    { name: 'bird', src: 'assets/bird.png' },
    { name: 'bird-up', src: 'assets/bird-up.png' },
    { name: 'moon', src: 'assets/moon.png' },
    { name: 'star', src: 'assets/star.png' }
  ];

  const soundsToLoad = [
    { name: 'jump', src: 'assets/jump.mp3' },
    { name: 'hit', src: 'assets/hit.mp3' },
    { name: 'point', src: 'assets/point.mp3' }
  ];

  totalAssets = imagesToLoad.length + soundsToLoad.length;

  // Set a timeout to force initialization after 2 seconds
  // This ensures the game starts even if assets don't load properly
  assetLoadingTimeout = setTimeout(() => {
    console.log('Asset loading timeout - forcing initialization');
    initGame();
  }, 2000);

  // Load images
  imagesToLoad.forEach(img => {
    sprites[img.name] = new Image();
    sprites[img.name].onload = () => assetLoaded();
    sprites[img.name].onerror = () => {
      console.log(`Error loading image: ${img.src}`);
      assetLoaded();
    };
    sprites[img.name].src = img.src;
  });

  // Load sounds
  soundsToLoad.forEach(sound => {
    sounds[sound.name] = new Audio();
    sounds[sound.name].oncanplaythrough = () => assetLoaded();
    sounds[sound.name].onerror = () => {
      console.log(`Error loading sound: ${sound.src}`);
      assetLoaded();
    };
    sounds[sound.name].src = sound.src;
  });
}

function assetLoaded() {
  assetsLoaded++;
  if (assetsLoaded >= totalAssets) {
    // Clear the timeout if all assets loaded naturally
    if (assetLoadingTimeout) {
      clearTimeout(assetLoadingTimeout);
      assetLoadingTimeout = null;
    }
    initGame();
  }
}

// Game initialization
function initGame() {
  // Ensure we only initialize once
  if (canvas) return;
  
  canvas = document.getElementById('gameCanvas');
  canvas.width = 600;
  canvas.height = 150;
  ctx = canvas.getContext('2d');

  // Load high score from localStorage
  highScore = localStorage.getItem('dinoHighScore') || 0;
  highScoreElement.textContent = 'HI ' + highScore;

  // Initialize game objects
  dino = {
    x: 50,
    y: canvas.height - GROUND_HEIGHT - 40,
    width: 44,
    height: 47,
    vy: 0,
    jumpForce: JUMP_FORCE,
    onGround: true,
    frame: 0,
    frameCount: 0,
    frameDelay: 5,
    state: 'stationary' // stationary, running, jumping, dead
  };

  ground = {
    x: 0,
    y: canvas.height - GROUND_HEIGHT,
    width: canvas.width,
    height: GROUND_HEIGHT,
    segments: [
      { x: 0, width: canvas.width * 2 },
      { x: canvas.width * 2, width: canvas.width * 2 }
    ]
  };

  // Add event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('touchstart', handleTouchStart);
  restartButton.addEventListener('click', restartGame);
  
  // Show start screen
  startScreen.classList.remove('hidden');
  gameScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');

  // For debugging
  console.log('Game initialized - press SPACE to start!');

  // Start animation loop
  requestAnimationFrame(gameLoop);
}

// Event handlers
function handleKeyDown(e) {
  console.log('Key pressed:', e.code);
  if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameOver) {
    if (!gameStarted) {
      startGame();
    } else if (dino.onGround) {
      jump();
    }
  }
}

function handleTouchStart() {
  console.log('Touch event detected');
  if (!gameOver) {
    if (!gameStarted) {
      startGame();
    } else if (dino.onGround) {
      jump();
    }
  }
}

function startGame() {
  console.log('Game started!');
  gameStarted = true;
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  gameOverScreen.classList.add('hidden');
  dino.state = 'running';
}

function jump() {
  console.log('Jump!');
  dino.vy = -dino.jumpForce;
  dino.onGround = false;
  dino.state = 'jumping';
  playSound('jump');
}

function restartGame() {
  gameOver = false;
  gameStarted = true;
  score = 0;
  frameCount = 0;
  spawnTimer = 0;
  gameSpeed = INITIAL_GAME_SPEED;
  obstacles = [];
  clouds = [];
  isNightMode = false;
  lastObstacleScore = 0;
  
  dino.y = canvas.height - GROUND_HEIGHT - 40;
  dino.vy = 0;
  dino.onGround = true;
  dino.state = 'running';
  
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  gameOverScreen.classList.add('hidden');
  
  scoreElement.textContent = '0';
}

// Game update functions
function update() {
  if (!gameStarted || gameOver) return;
  
  frameCount++;
  
  // Update score
  if (frameCount % 5 === 0) {
    score++;
    scoreElement.textContent = score;
    
    // Play point sound every 100 points
    if (score % 100 === 0) {
      playSound('point');
    }
    
    // Check for night mode
    if (score % NIGHT_MODE_SCORE === 0) {
      isNightMode = !isNightMode;
    }
  }
  
  // Increase game speed over time
  if (gameSpeed < MAX_GAME_SPEED) {
    gameSpeed += ACCELERATION;
  }
  
  updateDino();
  updateGround();
  updateObstacles();
  updateClouds();
  checkCollisions();
}

function updateDino() {
  // Update dino animation
  dino.frameCount++;
  if (dino.frameCount >= dino.frameDelay) {
    dino.frameCount = 0;
    dino.frame = dino.frame === 0 ? 1 : 0;
  }
  
  // Apply gravity if jumping
  if (!dino.onGround) {
    dino.vy += GRAVITY;
    dino.y += dino.vy;
    
    // Check if landed
    if (dino.y >= canvas.height - GROUND_HEIGHT - dino.height) {
      dino.y = canvas.height - GROUND_HEIGHT - dino.height;
      dino.onGround = true;
      dino.vy = 0;
      dino.state = 'running';
    }
  }
}

function updateGround() {
  // Move ground segments
  ground.segments.forEach(segment => {
    segment.x -= gameSpeed;
    
    // Reset segment position when it moves off screen
    if (segment.x + segment.width < 0) {
      segment.x = Math.max(...ground.segments.map(s => s.x + s.width));
    }
  });
}

function updateObstacles() {
  // Move existing obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= gameSpeed;
    
    // Remove obstacles that are off screen
    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
    }
  }
  
  // Spawn new obstacles
  spawnTimer++;
  const minSpawnTime = 50 - (gameSpeed * 2);
  const spawnTime = Math.max(minSpawnTime, 40);
  
  if (spawnTimer >= spawnTime && score - lastObstacleScore > 10) {
    spawnObstacle();
    spawnTimer = 0;
    lastObstacleScore = score;
  }
}

function spawnObstacle() {
  const obstacleTypes = [
    { type: 'cactus-small', width: 17, height: 35, y: canvas.height - GROUND_HEIGHT - 35 },
    { type: 'cactus-large', width: 25, height: 50, y: canvas.height - GROUND_HEIGHT - 50 },
    { type: 'cactus-group', width: 73, height: 47, y: canvas.height - GROUND_HEIGHT - 47 }
  ];
  
  // Add bird obstacle at higher scores
  if (score > 300) {
    obstacleTypes.push({ 
      type: 'bird', 
      width: 46, 
      height: 40, 
      y: canvas.height - GROUND_HEIGHT - 40 - Math.random() * 50,
      frame: 0,
      frameCount: 0 
    });
  }
  
  const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  
  obstacles.push({
    x: canvas.width,
    y: obstacleType.y,
    width: obstacleType.width,
    height: obstacleType.height,
    type: obstacleType.type,
    frame: obstacleType.frame || 0,
    frameCount: obstacleType.frameCount || 0
  });
}

function updateClouds() {
  // Move existing clouds
  for (let i = clouds.length - 1; i >= 0; i--) {
    clouds[i].x -= clouds[i].speed;
    
    // Remove clouds that are off screen
    if (clouds[i].x + clouds[i].width < 0) {
      clouds.splice(i, 1);
    }
  }
  
  // Spawn new clouds
  if (Math.random() < CLOUD_FREQUENCY / 100) {
    clouds.push({
      x: canvas.width,
      y: 20 + Math.random() * 40,
      width: 70,
      height: 40,
      speed: gameSpeed * 0.5
    });
  }
}

function checkCollisions() {
  // Check for collisions with obstacles
  for (let obstacle of obstacles) {
    // Adjust collision box to be smaller than the visual size
    const dinoHitbox = {
      x: dino.x + 5,
      y: dino.y + 5,
      width: dino.width - 10,
      height: dino.height - 10
    };
    
    const obstacleHitbox = {
      x: obstacle.x + 5,
      y: obstacle.y + 5,
      width: obstacle.width - 10,
      height: obstacle.height - 10
    };
    
    if (
      dinoHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
      dinoHitbox.x + dinoHitbox.width > obstacleHitbox.x &&
      dinoHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
      dinoHitbox.y + dinoHitbox.height > obstacleHitbox.y
    ) {
      gameOver = true;
      dino.state = 'dead';
      playSound('hit');
      
      // Update high score
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
        highScoreElement.textContent = 'HI ' + highScore;
      }
      
      // Show game over screen
      finalScoreElement.textContent = score;
      gameOverScreen.classList.remove('hidden');
    }
  }
}

// Rendering functions
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set background color based on day/night mode
  if (isNightMode) {
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    renderStars();
    renderMoon();
  } else {
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  renderClouds();
  renderGround();
  renderObstacles();
  renderDino();
}

function renderDino() {
  let spriteKey;
  
  switch (dino.state) {
    case 'stationary':
      spriteKey = 'dino-stationary';
      break;
    case 'running':
      spriteKey = dino.frame === 0 ? 'dino-run1' : 'dino-run2';
      break;
    case 'jumping':
      spriteKey = 'dino-jump';
      break;
    case 'dead':
      spriteKey = 'dino-dead';
      break;
  }
  
  if (sprites[spriteKey] && sprites[spriteKey].width > 0) {
    ctx.drawImage(sprites[spriteKey], dino.x, dino.y, dino.width, dino.height);
  } else {
    // Fallback if sprite not loaded
    ctx.fillStyle = '#535353';
    
    // Draw a simple dinosaur shape
    // Body
    ctx.fillRect(dino.x + 5, dino.y + 14, 22, 18);
    // Head
    ctx.fillRect(dino.x + 27, dino.y + 6, 10, 22);
    // Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(dino.x + 33, dino.y + 10, 2, 2);
    
    // Different legs based on state
    ctx.fillStyle = '#535353';
    if (dino.state === 'running' && dino.frame === 0) {
      // Running pose 1
      ctx.fillRect(dino.x + 7, dino.y + 32, 4, 15);
      ctx.fillRect(dino.x + 19, dino.y + 32, 4, 8);
    } else if (dino.state === 'running' && dino.frame === 1) {
      // Running pose 2
      ctx.fillRect(dino.x + 7, dino.y + 32, 4, 8);
      ctx.fillRect(dino.x + 19, dino.y + 32, 4, 15);
    } else if (dino.state === 'jumping') {
      // Jumping pose
      ctx.fillRect(dino.x + 7, dino.y + 32, 4, 8);
      ctx.fillRect(dino.x + 19, dino.y + 32, 4, 8);
    } else {
      // Standing or dead pose
      ctx.fillRect(dino.x + 7, dino.y + 32, 4, 15);
      ctx.fillRect(dino.x + 19, dino.y + 32, 4, 15);
    }
    
    // Special eye for dead state
    if (dino.state === 'dead') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(dino.x + 32, dino.y + 9, 1, 1);
      ctx.fillRect(dino.x + 34, dino.y + 9, 1, 1);
      ctx.fillRect(dino.x + 33, dino.y + 10, 1, 1);
      ctx.fillRect(dino.x + 32, dino.y + 11, 1, 1);
      ctx.fillRect(dino.x + 34, dino.y + 11, 1, 1);
    }
  }
}

function renderGround() {
  ground.segments.forEach(segment => {
    if (sprites.ground && sprites.ground.width > 0) {
      // Draw repeating ground pattern
      const pattern = ctx.createPattern(sprites.ground, 'repeat-x');
      ctx.fillStyle = pattern;
      ctx.fillRect(segment.x, ground.y, segment.width, ground.height);
    } else {
      // Fallback if sprite not loaded
      ctx.fillStyle = '#535353';
      // Draw a line for the ground
      ctx.fillRect(segment.x, ground.y, segment.width, 1);
      
      // Draw some random bumps for texture
      for (let i = 0; i < segment.width; i += 5) {
        const height = 1 + Math.floor(Math.random() * 2);
        if (Math.random() > 0.7) {
          ctx.fillRect(segment.x + i, ground.y, 1, height);
        }
      }
    }
  });
}

function renderObstacles() {
  obstacles.forEach(obstacle => {
    let spriteKey = obstacle.type;
    
    // Handle bird animation
    if (obstacle.type === 'bird') {
      obstacle.frameCount++;
      if (obstacle.frameCount > 15) {
        obstacle.frameCount = 0;
        obstacle.frame = obstacle.frame === 0 ? 1 : 0;
      }
      spriteKey = obstacle.frame === 0 ? 'bird' : 'bird-up';
    }
    
    if (sprites[spriteKey] && sprites[spriteKey].width > 0) {
      ctx.drawImage(sprites[spriteKey], obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
      // Fallback if sprite not loaded
      ctx.fillStyle = '#535353';
      
      if (obstacle.type.includes('cactus')) {
        // Draw a simple cactus
        const centerX = obstacle.x + obstacle.width / 2;
        // Main stem
        ctx.fillRect(centerX - 1, obstacle.y, 3, obstacle.height);
        
        // Add branches for larger cacti
        if (obstacle.type === 'cactus-group' || obstacle.type === 'cactus-large') {
          // Left branch
          ctx.fillRect(obstacle.x, obstacle.y + obstacle.height / 3, 
                      centerX - obstacle.x, 3);
          // Right branch
          ctx.fillRect(centerX + 2, obstacle.y + obstacle.height / 2, 
                      (obstacle.x + obstacle.width) - (centerX + 2), 3);
        }
      } else if (obstacle.type === 'bird' || obstacle.type === 'bird-up') {
        // Draw a simple bird
        // Body
        ctx.fillRect(obstacle.x + 15, obstacle.y + 20, 16, 8);
        // Head
        ctx.fillRect(obstacle.x + 31, obstacle.y + 18, 8, 6);
        // Beak
        ctx.fillRect(obstacle.x + 39, obstacle.y + 20, 4, 2);
        // Wings
        if (obstacle.type === 'bird-up' || obstacle.frame === 1) {
          ctx.fillRect(obstacle.x + 15, obstacle.y + 14, 16, 2);
        } else {
          ctx.fillRect(obstacle.x + 15, obstacle.y + 28, 16, 2);
        }
      }
    }
  });
}

function renderClouds() {
  clouds.forEach(cloud => {
    if (sprites.cloud && sprites.cloud.width > 0) {
      ctx.drawImage(sprites.cloud, cloud.x, cloud.y, cloud.width, cloud.height);
    } else {
      // Fallback if sprite not loaded
      ctx.fillStyle = '#ffffff';
      // Draw a simple cloud shape
      ctx.beginPath();
      ctx.arc(cloud.x + 20, cloud.y + 25, 15, 0, Math.PI * 2);
      ctx.arc(cloud.x + 40, cloud.y + 20, 20, 0, Math.PI * 2);
      ctx.arc(cloud.x + 55, cloud.y + 25, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function renderMoon() {
  if (sprites.moon && sprites.moon.width > 0) {
    ctx.drawImage(sprites.moon, canvas.width - 80, 20, 40, 40);
  } else {
    // Fallback if sprite not loaded
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 40, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw some craters
    ctx.fillStyle = '#eeeeee';
    ctx.beginPath();
    ctx.arc(canvas.width - 65, 35, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(canvas.width - 55, 40, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderStars() {
  if (sprites.star && sprites.star.width > 0) {
    // Draw some random stars
    for (let i = 0; i < 10; i++) {
      const x = (Math.sin(frameCount * 0.001 + i) + 1) * canvas.width / 2;
      const y = (Math.cos(frameCount * 0.001 + i * 2) + 1) * 50;
      const size = 3 + Math.sin(frameCount * 0.01 + i) * 2;
      ctx.drawImage(sprites.star, x, y, size, size);
    }
  } else {
    // Fallback if sprite not loaded
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 20; i++) {
      const x = (Math.sin(frameCount * 0.001 + i) + 1) * canvas.width / 2;
      const y = (Math.cos(frameCount * 0.001 + i * 2) + 1) * 50;
      const size = 2 + Math.sin(frameCount * 0.01 + i);
      
      // Draw simple plus-shaped stars
      ctx.fillRect(x, y - size/2, 1, size);
      ctx.fillRect(x - size/2, y, size, 1);
    }
  }
}

// Sound functions
function playSound(name) {
  if (sounds[name]) {
    const sound = sounds[name].cloneNode();
    sound.volume = 0.5;
    sound.play();
  }
}

// Game loop
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Start loading assets
window.addEventListener('load', function() {
  console.log('Window loaded - starting asset loading');
  loadAssets();
  
  // Add a direct event listener to the document body as a failsafe
  document.body.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      console.log('Failsafe key handler triggered');
      if (!gameStarted && !gameOver) {
        startGame();
      } else if (gameStarted && !gameOver && dino && dino.onGround) {
        jump();
      }
    }
  });
}); 