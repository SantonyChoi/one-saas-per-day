class_name ProceduralSoundGenerator
extends Node

# This script handles generation of procedural audio for our meditation app
# It's an improved version with better memory management and optimization

# Sound generation parameters (customizable through exports)
@export_group("Sound Parameters")
@export var rain_amplitude: float = 0.3
@export var ocean_amplitude: float = 0.4
@export var birds_amplitude: float = 0.2
@export var bell_amplitude: float = 0.7

@export_group("Performance Settings")
@export var buffer_size: int = 2048  # Increased for better stability
@export var optimization_level: int = 1  # 0=quality, 1=balanced, 2=performance

# References to audio players (will be set by sound manager)
var ambient_player: AudioStreamPlayer
var bell_player: AudioStreamPlayer

# Sound generator variables
var ambient_playback: AudioStreamGeneratorPlayback
var bell_playback: AudioStreamGeneratorPlayback
var ambient_phase: float = 0.0
var bird_chirp_timer: float = 0.0
var wave_phase: float = 0.0

# Pre-allocated buffers for optimization
var ambient_buffer: PackedVector2Array
var bell_buffer: PackedVector2Array

# Sound types
enum SoundType { RAIN, OCEAN, BIRDS, BELL }
var current_sound_type: SoundType = SoundType.RAIN

# Generation state tracking
var is_generating: bool = false
var playback_error_reported: bool = false

func _ready() -> void:
	# Pre-allocate buffers for optimization
	ambient_buffer = PackedVector2Array()
	ambient_buffer.resize(buffer_size)
	
	bell_buffer = PackedVector2Array()
	bell_buffer.resize(buffer_size)

# Setup the sound generator with audio player references
func setup(ambient_audio_player: AudioStreamPlayer, bell_audio_player: AudioStreamPlayer) -> void:
	ambient_player = ambient_audio_player
	bell_player = bell_audio_player
	
	# Connect additional signals
	if ambient_player.get_signal_connection_list("finished").is_empty():
		ambient_player.finished.connect(_on_ambient_player_finished)
	
	if bell_player.get_signal_connection_list("finished").is_empty():
		bell_player.finished.connect(_on_bell_player_finished)

func _process(_delta: float) -> void:
	# Generate ambient sound if needed
	if ambient_player and ambient_player.playing and not ambient_player.stream_paused:
		if ambient_player.stream is AudioStreamGenerator:
			_ensure_ambient_playback()
			_fill_ambient_buffer()
	
	# Generate bell sound if needed
	if bell_player and bell_player.playing and not bell_player.stream_paused:
		if bell_player.stream is AudioStreamGenerator:
			_ensure_bell_playback()
			_fill_bell_buffer()

# Ensures we have a valid playback object
func _ensure_ambient_playback() -> void:
	if not ambient_playback:
		if ambient_player.get_stream_playback():
			ambient_playback = ambient_player.get_stream_playback()
		else:
			if not playback_error_reported:
				print("Warning: Unable to get ambient stream playback. Sound may not work correctly.")
				playback_error_reported = true
			return

func _ensure_bell_playback() -> void:
	if not bell_playback:
		if bell_player.get_stream_playback():
			bell_playback = bell_player.get_stream_playback()
		else:
			if not playback_error_reported:
				print("Warning: Unable to get bell stream playback. Sound may not work correctly.")
				playback_error_reported = true
			return

# Set the type of sound to generate
func set_sound_type(type: String) -> void:
	var previous_type = current_sound_type
	
	match type:
		"rain": current_sound_type = SoundType.RAIN
		"ocean": current_sound_type = SoundType.OCEAN
		"birds": current_sound_type = SoundType.BIRDS
		"none": 
			current_sound_type = SoundType.RAIN  # Default to rain but with zero amplitude
			_clear_ambient_buffer()
			return  # Early return for none
		_: current_sound_type = SoundType.RAIN
	
	# If changing sound types, reset phase variables for smooth transition
	if previous_type != current_sound_type:
		ambient_phase = 0.0
		if current_sound_type == SoundType.BIRDS:
			bird_chirp_timer = 0.5  # Start first chirp soon
		elif current_sound_type == SoundType.OCEAN:
			wave_phase = 0.0  # Reset wave phase

# Fill the ambient sound buffer
func _fill_ambient_buffer() -> void:
	if not ambient_playback:
		return
		
	var frames_available = ambient_playback.get_frames_available()
	
	# Performance optimization - only process if enough frames needed
	if frames_available < buffer_size / 4:
		return
	
	while frames_available > 0:
		var frames_to_fill = min(frames_available, buffer_size)
		
		# Generate the sound based on current type
		match current_sound_type:
			SoundType.RAIN: 
				_generate_rain(frames_to_fill)
			SoundType.OCEAN:
				_generate_ocean(frames_to_fill)
			SoundType.BIRDS:
				_generate_birds(frames_to_fill)
			_:
				_generate_white_noise(frames_to_fill, 0.05)  # Lower amplitude default
		
		if ambient_player.playing and not ambient_player.stream_paused:
			# Only push the buffer if still playing
			ambient_playback.push_buffer(ambient_buffer.slice(0, frames_to_fill))
		
		frames_available -= frames_to_fill

# Fill the bell sound buffer
func _fill_bell_buffer() -> void:
	if not bell_playback:
		return
		
	var frames_available = bell_playback.get_frames_available()
	
	# Performance optimization - only process if enough frames needed
	if frames_available < buffer_size / 4:
		return
	
	while frames_available > 0:
		var frames_to_fill = min(frames_available, buffer_size)
		_generate_bell(frames_to_fill)
		
		if bell_player.playing and not bell_player.stream_paused:
			# Only push the buffer if still playing
			bell_playback.push_buffer(bell_buffer.slice(0, frames_to_fill))
		
		frames_available -= frames_to_fill

# Clear ambient buffer (fills with silence)
func _clear_ambient_buffer() -> void:
	for i in range(ambient_buffer.size()):
		ambient_buffer[i] = Vector2.ZERO

# Clear bell buffer (fills with silence)
func _clear_bell_buffer() -> void:
	for i in range(bell_buffer.size()):
		bell_buffer[i] = Vector2.ZERO

# Reset ambient generator state
func reset_ambient_generator() -> void:
	# Stop any in-progress generation
	if ambient_playback:
		# First clear buffer to prevent glitches
		_clear_ambient_buffer()
		if ambient_player and ambient_player.playing and not ambient_player.stream_paused:
			# Push silence to the buffer before nullifying the playback
			ambient_playback.push_buffer(ambient_buffer.slice(0, buffer_size/4))
	
	# Reset state
	ambient_playback = null
	ambient_phase = 0.0
	wave_phase = 0.0
	bird_chirp_timer = 0.0

# Reset bell generator state
func reset_bell_generator() -> void:
	# Stop any in-progress generation
	if bell_playback:
		# First clear buffer to prevent glitches
		_clear_bell_buffer()
		if bell_player and bell_player.playing and not bell_player.stream_paused:
			# Push silence to the buffer before nullifying the playback
			bell_playback.push_buffer(bell_buffer.slice(0, buffer_size/4))
	
	# Reset state
	bell_playback = null

# Improved rain sound generator with better filtering
func _generate_rain(frames: int) -> void:
	# Static white noise with filter for rain-like effect
	for i in range(frames):
		var noise = randf_range(-1.0, 1.0) * rain_amplitude
		
		# Simple lowpass filter to make it sound more like rain
		# Different filter coefficients for varying drop sizes
		ambient_phase = lerp(ambient_phase, noise, 0.1)
		
		# Added stereo variation for more natural sound
		var left_channel = ambient_phase + randf_range(-0.05, 0.05) * rain_amplitude
		var right_channel = ambient_phase + randf_range(-0.05, 0.05) * rain_amplitude
		
		ambient_buffer[i] = Vector2(left_channel, right_channel)

# Ocean sound with improved wave simulation
func _generate_ocean(frames: int) -> void:
	# Advance wave phase (slower modulation for waves)
	wave_phase += 0.00005
	
	# Multiple overlapping wave frequencies for richer sound
	var wave_amp_slow = sin(wave_phase * 0.5) * 0.3 + 0.7
	var wave_amp_med = sin(wave_phase * 1.3) * 0.15 + 0.85
	
	for i in range(frames):
		var combined_wave = wave_amp_slow * wave_amp_med
		var noise = randf_range(-1.0, 1.0) * ocean_amplitude * combined_wave
		
		# Smoother filter for ocean sound
		ambient_phase = lerp(ambient_phase, noise, 0.03)
		
		# Slight stereo widening
		var stereo_offset = sin(wave_phase * 2.0 + i * 0.001) * 0.1
		var left = ambient_phase * (1.0 - stereo_offset)
		var right = ambient_phase * (1.0 + stereo_offset)
		
		ambient_buffer[i] = Vector2(left, right)

# Enhanced bird sound generator with more natural chirps
func _generate_birds(frames: int) -> void:
	# Generate background forest ambience (subtle noise)
	_generate_white_noise(frames, 0.05)
	
	# Decrease chirp timer based on frames processed
	bird_chirp_timer -= float(frames) / 44100.0
	
	# Time to add a chirp
	if bird_chirp_timer <= 0:
		# Randomize next chirp timing
		bird_chirp_timer = randf_range(0.5, 3.0)
		
		# Generate a chirp pattern
		var chirp_count = randi() % 3 + 1  # 1-3 chirps in a sequence
		var chirp_spacing = randf_range(0.05, 0.15)
		
		# Create multiple chirps as a pattern
		for c in range(chirp_count):
			_add_bird_chirp(frames, c * chirp_spacing * 44100)

# Add an individual bird chirp to the existing buffer
func _add_bird_chirp(frames: int, offset: float) -> void:
	var chirp_length = int(randf_range(0.05, 0.2) * 44100)
	var chirp_freq = randf_range(2000, 4000)
	var chirp_start_idx = min(int(offset), frames - 1)
	
	# Guard against out-of-bounds issues
	if chirp_start_idx >= frames - 10:
		return
	
	# Number of samples to process
	var samples_to_process = min(chirp_length, frames - chirp_start_idx)
	
	# Randomize stereo position
	var pan = randf_range(-0.8, 0.8)  # -1.0 to 1.0 panning
	
	for i in range(samples_to_process):
		var t = float(i) / 44100.0
		
		# Frequency modulation for more natural sound
		var freq_mod = 1.0 + sin(t * 100) * 0.1
		
		# Simple envelope for the chirp
		var envelope = exp(-t * 20.0) * birds_amplitude
		
		# Generate the chirp tone with frequency modulation
		var chirp = sin(t * chirp_freq * freq_mod * TAU) * envelope
		
		# Apply stereo positioning
		var left_gain = (1.0 - pan) / 2.0 + 0.5
		var right_gain = (1.0 + pan) / 2.0 + 0.5
		
		# Add to existing buffer (don't replace existing ambient sound)
		var current = ambient_buffer[chirp_start_idx + i]
		ambient_buffer[chirp_start_idx + i] = Vector2(
			current.x + chirp * left_gain, 
			current.y + chirp * right_gain
		)

# Bell sound with improved harmonics
func _generate_bell(frames: int) -> void:
	# Bell parameters
	var base_freq = 320.0  # Lower frequency (E4) for a more pleasant bell
	var decay = 5.0        # Faster decay rate to prevent lingering
	
	for i in range(frames):
		var t = float(i) / 44100.0
		
		# Use exponential envelope with delay to avoid clicking
		var envelope = exp(-t * decay) * bell_amplitude
		if t < 0.002:  # Gentle attack to prevent clicks
			envelope *= t / 0.002
		
		# Main tone with decay
		var main_tone = sin(t * base_freq * TAU) * envelope
		
		# More harmonious partials for a softer bell sound
		var harmonic1 = sin(t * base_freq * 2.0 * TAU) * exp(-t * decay * 1.8) * bell_amplitude * 0.4
		var harmonic2 = sin(t * base_freq * 3.0 * TAU) * exp(-t * decay * 2.2) * bell_amplitude * 0.2
		var harmonic3 = sin(t * base_freq * 5.0 * TAU) * exp(-t * decay * 2.5) * bell_amplitude * 0.1
		
		# Remove the detuned sound which can cause harshness
		# var detuned = sin(t * base_freq * 1.003 * TAU) * exp(-t * decay * 1.1) * bell_amplitude * 0.3
		
		# Combine all partials
		var value = main_tone + harmonic1 + harmonic2 + harmonic3
		
		# Apply a slight stereo widening
		var stereo_width = 0.05  # Reduce stereo width for more focused sound
		bell_buffer[i] = Vector2(
			value * (1.0 - stereo_width), 
			value * (1.0 + stereo_width)
		)

# Basic white noise generator (used as a building block for other sounds)
func _generate_white_noise(frames: int, amplitude: float) -> void:
	for i in range(frames):
		var noise = randf_range(-1.0, 1.0) * amplitude
		var noise2 = randf_range(-1.0, 1.0) * amplitude  # Different random value for right channel
		ambient_buffer[i] = Vector2(noise, noise2)  # True stereo noise

# Clean up on audio player finished
func _on_ambient_player_finished() -> void:
	ambient_playback = null

# Clean up on bell player finished
func _on_bell_player_finished() -> void:
	bell_playback = null 