// This script generates pixel art assets for the Dino Runner game
// Run with Node.js: node generate-assets.js

const fs = require('fs');
const path = require('path');

// Make sure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// Function to create a canvas and context
function createCanvas(width, height) {
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  // Clear canvas with transparent background
  ctx.clearRect(0, 0, width, height);
  return { canvas, ctx };
}

// Function to save canvas as PNG
function saveCanvasAsPNG(canvas, filename) {
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(assetsDir, filename), buffer);
  console.log(`Created ${filename}`);
}

// Function to draw a pixel at (x, y) with color
function drawPixel(ctx, x, y, color, pixelSize = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

// Function to draw a rectangle of pixels
function drawRect(ctx, x, y, width, height, color, pixelSize = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x * pixelSize, y * pixelSize, width * pixelSize, height * pixelSize);
}

// Generate dino sprites
function generateDinoSprites() {
  const dinoColor = '#535353';
  const eyeColor = '#FFFFFF';
  
  // Stationary dino
  let { canvas, ctx } = createCanvas(44, 47);
  // Body
  drawRect(ctx, 5, 14, 22, 18, dinoColor);
  // Head
  drawRect(ctx, 27, 6, 10, 22, dinoColor);
  // Eye
  drawRect(ctx, 33, 10, 2, 2, eyeColor);
  // Leg
  drawRect(ctx, 7, 32, 4, 15, dinoColor);
  drawRect(ctx, 19, 32, 4, 15, dinoColor);
  // Arm
  drawRect(ctx, 20, 24, 6, 4, dinoColor);
  saveCanvasAsPNG(canvas, 'dino-stationary.png');
  
  // Running dino - frame 1
  ({ canvas, ctx } = createCanvas(44, 47));
  // Body
  drawRect(ctx, 5, 14, 22, 18, dinoColor);
  // Head
  drawRect(ctx, 27, 6, 10, 22, dinoColor);
  // Eye
  drawRect(ctx, 33, 10, 2, 2, eyeColor);
  // Leg - running position 1
  drawRect(ctx, 7, 32, 4, 15, dinoColor);
  drawRect(ctx, 19, 32, 4, 8, dinoColor);
  // Arm
  drawRect(ctx, 20, 24, 6, 4, dinoColor);
  saveCanvasAsPNG(canvas, 'dino-run1.png');
  
  // Running dino - frame 2
  ({ canvas, ctx } = createCanvas(44, 47));
  // Body
  drawRect(ctx, 5, 14, 22, 18, dinoColor);
  // Head
  drawRect(ctx, 27, 6, 10, 22, dinoColor);
  // Eye
  drawRect(ctx, 33, 10, 2, 2, eyeColor);
  // Leg - running position 2
  drawRect(ctx, 7, 32, 4, 8, dinoColor);
  drawRect(ctx, 19, 32, 4, 15, dinoColor);
  // Arm
  drawRect(ctx, 20, 24, 6, 4, dinoColor);
  saveCanvasAsPNG(canvas, 'dino-run2.png');
  
  // Jumping dino
  ({ canvas, ctx } = createCanvas(44, 47));
  // Body
  drawRect(ctx, 5, 14, 22, 18, dinoColor);
  // Head
  drawRect(ctx, 27, 6, 10, 22, dinoColor);
  // Eye
  drawRect(ctx, 33, 10, 2, 2, eyeColor);
  // Leg - tucked up for jump
  drawRect(ctx, 7, 32, 4, 8, dinoColor);
  drawRect(ctx, 19, 32, 4, 8, dinoColor);
  // Arm
  drawRect(ctx, 20, 24, 6, 4, dinoColor);
  saveCanvasAsPNG(canvas, 'dino-jump.png');
  
  // Dead dino
  ({ canvas, ctx } = createCanvas(44, 47));
  // Body
  drawRect(ctx, 5, 14, 22, 18, dinoColor);
  // Head
  drawRect(ctx, 27, 6, 10, 22, dinoColor);
  // Eye - X shape for dead
  drawRect(ctx, 32, 9, 1, 1, eyeColor);
  drawRect(ctx, 34, 9, 1, 1, eyeColor);
  drawRect(ctx, 33, 10, 1, 1, eyeColor);
  drawRect(ctx, 32, 11, 1, 1, eyeColor);
  drawRect(ctx, 34, 11, 1, 1, eyeColor);
  // Leg
  drawRect(ctx, 7, 32, 4, 15, dinoColor);
  drawRect(ctx, 19, 32, 4, 15, dinoColor);
  // Arm
  drawRect(ctx, 20, 24, 6, 4, dinoColor);
  saveCanvasAsPNG(canvas, 'dino-dead.png');
}

// Generate cactus obstacles
function generateCactusSprites() {
  const cactusColor = '#535353';
  
  // Small cactus
  let { canvas, ctx } = createCanvas(17, 35);
  // Main stem
  drawRect(ctx, 7, 0, 3, 35, cactusColor);
  // Left branch
  drawRect(ctx, 0, 10, 7, 3, cactusColor);
  drawRect(ctx, 0, 10, 3, 15, cactusColor);
  // Right branch
  drawRect(ctx, 10, 20, 7, 3, cactusColor);
  drawRect(ctx, 14, 20, 3, 15, cactusColor);
  saveCanvasAsPNG(canvas, 'cactus-small.png');
  
  // Large cactus
  ({ canvas, ctx } = createCanvas(25, 50));
  // Main stem
  drawRect(ctx, 11, 0, 3, 50, cactusColor);
  // Left branch
  drawRect(ctx, 0, 15, 11, 3, cactusColor);
  drawRect(ctx, 0, 15, 3, 20, cactusColor);
  // Right branch
  drawRect(ctx, 14, 25, 11, 3, cactusColor);
  drawRect(ctx, 22, 25, 3, 20, cactusColor);
  saveCanvasAsPNG(canvas, 'cactus-large.png');
  
  // Group of cacti
  ({ canvas, ctx } = createCanvas(73, 47));
  // First cactus (small)
  drawRect(ctx, 7, 12, 3, 35, cactusColor);
  drawRect(ctx, 0, 22, 7, 3, cactusColor);
  drawRect(ctx, 0, 22, 3, 15, cactusColor);
  drawRect(ctx, 10, 32, 7, 3, cactusColor);
  drawRect(ctx, 14, 32, 3, 15, cactusColor);
  
  // Second cactus (large)
  drawRect(ctx, 35, 0, 3, 47, cactusColor);
  drawRect(ctx, 24, 15, 11, 3, cactusColor);
  drawRect(ctx, 24, 15, 3, 20, cactusColor);
  drawRect(ctx, 38, 25, 11, 3, cactusColor);
  drawRect(ctx, 46, 25, 3, 20, cactusColor);
  
  // Third cactus (small)
  drawRect(ctx, 63, 12, 3, 35, cactusColor);
  drawRect(ctx, 56, 22, 7, 3, cactusColor);
  drawRect(ctx, 56, 22, 3, 15, cactusColor);
  drawRect(ctx, 66, 32, 7, 3, cactusColor);
  drawRect(ctx, 70, 32, 3, 15, cactusColor);
  
  saveCanvasAsPNG(canvas, 'cactus-group.png');
}

// Generate bird obstacle
function generateBirdSprites() {
  const birdColor = '#535353';
  
  // Bird with wings down
  let { canvas, ctx } = createCanvas(46, 40);
  // Body
  drawRect(ctx, 15, 20, 16, 8, birdColor);
  // Head
  drawRect(ctx, 31, 18, 8, 6, birdColor);
  drawRect(ctx, 39, 20, 4, 2, birdColor);
  // Eye
  drawRect(ctx, 35, 19, 1, 1, '#FFFFFF');
  // Wings down
  drawRect(ctx, 15, 28, 16, 2, birdColor);
  saveCanvasAsPNG(canvas, 'bird.png');
  
  // Bird with wings up
  ({ canvas, ctx } = createCanvas(46, 40));
  // Body
  drawRect(ctx, 15, 20, 16, 8, birdColor);
  // Head
  drawRect(ctx, 31, 18, 8, 6, birdColor);
  drawRect(ctx, 39, 20, 4, 2, birdColor);
  // Eye
  drawRect(ctx, 35, 19, 1, 1, '#FFFFFF');
  // Wings up
  drawRect(ctx, 15, 14, 16, 2, birdColor);
  saveCanvasAsPNG(canvas, 'bird-up.png');
}

// Generate ground
function generateGround() {
  const { canvas, ctx } = createCanvas(600, 20);
  const groundColor = '#535353';
  
  // Draw a line for the ground
  ctx.fillStyle = groundColor;
  ctx.fillRect(0, 0, 600, 1);
  
  // Draw some random bumps
  for (let i = 0; i < 600; i += Math.floor(Math.random() * 10) + 5) {
    const height = Math.floor(Math.random() * 3) + 1;
    ctx.fillRect(i, 0, 1, height);
  }
  
  saveCanvasAsPNG(canvas, 'ground.png');
}

// Generate cloud
function generateCloud() {
  const { canvas, ctx } = createCanvas(70, 40);
  const cloudColor = '#FFFFFF';
  
  // Draw cloud shape
  ctx.fillStyle = cloudColor;
  ctx.beginPath();
  ctx.arc(20, 25, 15, 0, Math.PI * 2);
  ctx.arc(40, 20, 20, 0, Math.PI * 2);
  ctx.arc(55, 25, 15, 0, Math.PI * 2);
  ctx.fill();
  
  saveCanvasAsPNG(canvas, 'cloud.png');
}

// Generate moon
function generateMoon() {
  const { canvas, ctx } = createCanvas(40, 40);
  
  // Draw moon
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(20, 20, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw craters
  ctx.fillStyle = '#EEEEEE';
  ctx.beginPath();
  ctx.arc(15, 15, 3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(25, 20, 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(18, 25, 4, 0, Math.PI * 2);
  ctx.fill();
  
  saveCanvasAsPNG(canvas, 'moon.png');
}

// Generate star
function generateStar() {
  const { canvas, ctx } = createCanvas(10, 10);
  
  // Draw star
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(4, 0, 2, 10);
  ctx.fillRect(0, 4, 10, 2);
  
  saveCanvasAsPNG(canvas, 'star.png');
}

// Generate sound effects
function generateSoundEffects() {
  // We'll create placeholder files for sounds
  // In a real project, you'd use a sound generation library or record actual sounds
  
  // Create empty audio files
  const sounds = ['jump.mp3', 'hit.mp3', 'point.mp3'];
  
  sounds.forEach(sound => {
    // Create an empty file
    fs.writeFileSync(path.join(assetsDir, sound), '');
    console.log(`Created placeholder for ${sound}`);
  });
  
  console.log('Note: These are placeholder sound files. Replace with real audio files.');
}

// Generate all assets
function generateAllAssets() {
  console.log('Generating game assets...');
  
  generateDinoSprites();
  generateCactusSprites();
  generateBirdSprites();
  generateGround();
  generateCloud();
  generateMoon();
  generateStar();
  generateSoundEffects();
  
  console.log('Asset generation complete!');
  console.log('Note: This script requires the "canvas" npm package to run.');
  console.log('Install it with: npm install canvas');
}

// Run the generator
generateAllAssets(); 