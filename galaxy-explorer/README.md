# Galaxy Explorer

A 3D interactive galaxy simulator built with Three.js that allows you to fly through a procedurally generated galaxy.

## Features

- Procedurally generated spiral galaxy with thousands of stars
- First-person flight controls (WASD + mouse)
- Beautiful star rendering with custom shaders
- Responsive design that works on all screen sizes

## How to Use

1. Open `index.html` in a web browser (Chrome or Firefox recommended for best performance)
2. Click on the screen to enable mouse controls
3. Use the following controls to navigate:
   - W: Move forward
   - S: Move backward
   - A: Move left
   - D: Move right
   - Mouse: Look around
   - Shift: Boost speed

## Technical Details

The galaxy is created using:
- Procedural generation of star positions in a spiral pattern
- Custom shader material for realistic star rendering
- Color gradients from the core to the outer edges
- Additive blending for bright, vibrant stars
- Particle systems for efficient rendering of thousands of stars

## Requirements

- A modern web browser with WebGL support
- No server required, can be run locally 