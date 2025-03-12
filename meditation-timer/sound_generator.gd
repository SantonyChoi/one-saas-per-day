extends Node

# This script handles generation of procedural audio for our meditation app

# The audio generator nodes
@onready var audio_player = $"../AudioPlayer"
@onready var bell_player = $"../BellPlayer"

# Sound generation parameters
var rain_amplitude = 0.3
var ocean_amplitude = 0.4
var birds_amplitude = 0.2
var bell_amplitude = 0.7

# Fill buffer size
const BUFFER_SIZE = 1024

# Sound generator variables
var playback_generator
var bell_generator
var phase = 0.0
var bird_chirp_timer = 0.0
var wave_phase = 0.0

func _ready():
	# Connect to the parent audio player's ready signal
	audio_player.finished.connect(_on_audio_player_finished)
	
	# Setup Bell player
	bell_player.finished.connect(_on_bell_player_finished)

func _process(delta):
	# Only generate sound if we have an active audio player with a generator stream
	if audio_player.playing and audio_player.stream is AudioStreamGenerator:
		# Get the stream playback object
		if not playback_generator:
			playback_generator = audio_player.get_stream_playback()
		
		# Fill the buffer
		_fill_buffer(playback_generator, audio_player.stream.resource_path)
	
	# Handle bell generation when playing
	if bell_player.playing and bell_player.stream is AudioStreamGenerator:
		# Get the bell stream playback object
		if not bell_generator:
			bell_generator = bell_player.get_stream_playback()
		
		# Fill the bell buffer
		_fill_bell_buffer(bell_generator)

func _fill_buffer(playback, stream_path):
	# Determine which type of sound to generate based on the current stream path
	var buffer_left = playback.get_frames_available()
	
	while buffer_left > 0:
		var frames_to_fill = min(buffer_left, BUFFER_SIZE)
		var sample
		
		# Generate the specific sound type
		if "rain" in stream_path:
			sample = _generate_rain(frames_to_fill)
		elif "ocean" in stream_path:
			sample = _generate_ocean(frames_to_fill)
		elif "birds" in stream_path:
			sample = _generate_birds(frames_to_fill)
		else:
			# Default white noise if we can't determine the type
			sample = _generate_white_noise(frames_to_fill, 0.1)
		
		# Push the generated audio to the playback buffer
		playback.push_buffer(sample)
		buffer_left -= frames_to_fill

func _fill_bell_buffer(playback):
	var buffer_left = playback.get_frames_available()
	
	while buffer_left > 0:
		var frames_to_fill = min(buffer_left, BUFFER_SIZE)
		var sample = _generate_bell(frames_to_fill)
		
		playback.push_buffer(sample)
		buffer_left -= frames_to_fill

# Generate rain sound (filtered white noise)
func _generate_rain(frames):
	var sample = PackedVector2Array()
	sample.resize(frames)
	
	for i in range(frames):
		var noise = randf_range(-1.0, 1.0) * rain_amplitude
		
		# Simple lowpass filter to make it sound more like rain
		phase = lerp(phase, noise, 0.1)
		
		sample[i] = Vector2(phase, phase)
	
	return sample

# Generate ocean sound (filtered noise with slow modulation)
func _generate_ocean(frames):
	var sample = PackedVector2Array()
	sample.resize(frames)
	
	# Advance wave phase (slower modulation for waves)
	wave_phase += 0.00005
	var wave_amplitude = sin(wave_phase) * 0.3 + 0.7
	
	for i in range(frames):
		var noise = randf_range(-1.0, 1.0) * ocean_amplitude * wave_amplitude
		
		# Smooth filter for ocean sound
		phase = lerp(phase, noise, 0.03)
		
		sample[i] = Vector2(phase, phase)
	
	return sample

# Generate bird sounds (chirps and background ambience)
func _generate_birds(frames):
	var sample = PackedVector2Array()
	sample.resize(frames)
	
	# Basic background ambience
	var background = _generate_white_noise(frames, 0.05)
	
	# Occasionally add bird chirps
	bird_chirp_timer -= float(frames) / 44100.0
	
	if bird_chirp_timer <= 0:
		# Random time until next chirp
		bird_chirp_timer = randf_range(0.5, 3.0)
		
		# Generate a chirp
		var chirp_length = int(randf_range(0.05, 0.2) * 44100)
		var chirp_freq = randf_range(2000, 4000)
		var chirp_start_idx = randi() % max(1, frames - chirp_length)
		
		for i in range(min(chirp_length, frames - chirp_start_idx)):
			var t = float(i) / 44100.0
			var chirp = sin(t * chirp_freq * TAU) * exp(-t * 20.0) * birds_amplitude
			
			background[chirp_start_idx + i] += Vector2(chirp, chirp)
	
	return background

# Generate a bell sound (decaying sine wave)
func _generate_bell(frames):
	var sample = PackedVector2Array()
	sample.resize(frames)
	
	# Bell parameters
	var freq = 440.0  # Base frequency
	var decay = 2.0   # Decay rate
	
	for i in range(frames):
		var t = float(i) / 44100.0
		
		# Main tone with decay
		var main_tone = sin(t * freq * TAU) * exp(-t * decay) * bell_amplitude
		
		# Add harmonics
		var harmonic1 = sin(t * freq * 2.0 * TAU) * exp(-t * decay * 1.5) * bell_amplitude * 0.5
		var harmonic2 = sin(t * freq * 3.0 * TAU) * exp(-t * decay * 2.0) * bell_amplitude * 0.25
		
		var value = main_tone + harmonic1 + harmonic2
		sample[i] = Vector2(value, value)
	
	return sample

# Simple white noise generator
func _generate_white_noise(frames, amplitude):
	var sample = PackedVector2Array()
	sample.resize(frames)
	
	for i in range(frames):
		var noise = randf_range(-1.0, 1.0) * amplitude
		sample[i] = Vector2(noise, noise)
	
	return sample

# Handler for when audio player finishes playing
func _on_audio_player_finished():
	playback_generator = null

# Handler for when bell player finishes playing
func _on_bell_player_finished():
	bell_generator = null 
