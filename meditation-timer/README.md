# Minimalist Meditation Timer

A simple and elegant meditation timer built with Godot 4.4, designed with minimalism and focus in mind. Perfect for those looking to integrate mindful breathing practices into their daily routine without distractions.

## Features

- **Customizable Timer Durations**: Choose from 5, 10, 15, or 30-minute meditation sessions
- **Natural Breathing Guide Animation**: Visual breathing guidance with a smooth, pulsating circle that expands and contracts
- **Ambient Sounds**: Select from various calming background sounds (rain, ocean, birds) or meditate in silence
- **Dark Mode Interface**: Gentle on the eyes with a dark color scheme and minimal UI elements
- **Session Controls**: Pause, resume, or stop your meditation session at any time
- **Completion Notification**: Soft visual and audio cue when your session completes
- **Accessibility Features**: Keyboard navigation and screen reader support

## How to Use

1. Select your preferred meditation duration (5, 10, 15, or 30 minutes)
2. Choose a background sound (Rain, Ocean, Birds) or select None for silence
3. Start your session and follow the breathing guidance
4. Use the Pause button if you need to temporarily interrupt your session
5. Use the Stop button to end your session early
6. When the timer completes, you'll receive a gentle bell notification

## Technical Details

- **Built with Godot 4.4**: Using the latest features for performance and aesthetics
- **Procedural Audio Generation**: Creates ambient sounds without requiring external audio files
- **Modular Architecture**: Clean separation of concerns in the codebase
- **Lightweight and Efficient**: Optimized for smooth performance on all platforms
- **Cross-platform Compatibility**: Works on any platform supported by Godot

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **UI Controller**: Handles user interactions and visual feedback
- **Meditation Session**: Manages the timer and session state
- **Sound Manager**: Controls audio playback and selection
- **Breathing Guide**: Dedicated animation system for breathing guidance
- **Sound Generator**: Procedurally generates all audio in the application

## Building the Project

This project is built with Godot 4.4. To run or modify it:

1. Download and install [Godot 4.4](https://godotengine.org/download/)
2. Clone or download this repository
3. Open the project in Godot
4. Run the project or export it to your platform of choice

## License

This project is available under the MIT License. Feel free to use, modify, and distribute it as you see fit.

## Credits

Created as a minimalist meditation aid focused on simplicity and function. The procedural audio generation creates ambient sounds without requiring external audio files. 