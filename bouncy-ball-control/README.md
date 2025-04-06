# Three.js Bouncy Ball Control

An interactive 3D simulation of a bouncing ball created with Three.js, where you can control the ball by hitting it with your mouse cursor.

## Features

- 3D ball that bounces with realistic physics (gravity, damping, air resistance)
- Interactive control - hit the ball with your mouse cursor
- The force of the hit depends on your mouse speed
- Visual feedback when hitting the ball (color change)
- 3D mouse pointer visualization for better user experience
- Shadow casting for improved visual effects
- The ball resets automatically after it stops moving

## How it Works

- Move your mouse quickly through the ball to hit it
- The faster your mouse moves, the more force is applied to the ball
- The ball will bounce off the walls and floor with realistic physics
- The ball automatically resets to its starting position after it stops moving

## How to Run

1. Clone or download this repository
2. Open the `index.html` file in a modern web browser
   - You can use a local server for better performance:
     - `npm install -g http-server` 
     - Run `http-server` in the project directory
     - Open `http://localhost:8080` in your browser

## Technologies Used

- Three.js for 3D rendering
- Vanilla JavaScript for animation, physics, and interaction
- HTML5 and CSS3 for structure and styling

## Project Structure

- `index.html` - Main HTML file
- `js/app.js` - JavaScript code for the 3D scene, animation, and interaction
- No build tools or dependencies required - just open and run! 