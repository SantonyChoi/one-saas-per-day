class_name SoundManager
extends Node

signal sound_changed(sound_name: String)
signal bell_played()

# Sound Types enum
enum SoundType { NONE, RAIN, OCEAN, BIRDS }

# Current ambient sound type
var current_sound_type: SoundType = SoundType.NONE
var current_sound_name: String = "none"

# References to audio components
@onready var ambient_player: AudioStreamPlayer = $AmbientPlayer
@onready var bell_player: AudioStreamPlayer = $BellPlayer
@onready var sound_generator: ProceduralSoundGenerator = $ProceduralSoundGenerator

# Audio configuration
@export var sample_rate: int = 44100
@export var buffer_length_seconds: float = 1.0

# Buffer size calculated from sample rate
var buffer_size: int

# Ready state flags
var _ready_complete: bool = false
var _streams_initialized: bool = false

func _ready() -> void:
	buffer_size = int(sample_rate * buffer_length_seconds)
	
	# Initialize audio streams
	initialize_audio_streams()
	
	# Configure sound generator
	sound_generator.setup(ambient_player, bell_player)
	
	# Connect signals
	if ambient_player.get_signal_connection_list("finished").is_empty():
		ambient_player.finished.connect(_on_ambient_player_finished)
	
	if bell_player.get_signal_connection_list("finished").is_empty():
		bell_player.finished.connect(_on_bell_player_finished)
	
	_ready_complete = true

# Initialize audio streams for procedural generation
func initialize_audio_streams() -> void:
	# Create and configure ambient stream
	var ambient_stream = AudioStreamGenerator.new()
	ambient_stream.mix_rate = sample_rate
	ambient_stream.buffer_length = buffer_length_seconds
	ambient_player.stream = ambient_stream
	
	# Create and configure bell stream
	var bell_stream = AudioStreamGenerator.new()
	bell_stream.mix_rate = sample_rate
	bell_stream.buffer_length = buffer_length_seconds * 0.25  # Shorter buffer for bell for less latency
	bell_player.stream = bell_stream
	
	# Set reasonable default volumes
	ambient_player.volume_db = -3.0
	bell_player.volume_db = -6.0
	
	_streams_initialized = true

# Set the ambient sound type
func set_sound(sound_name: String) -> void:
	# If setting same sound, just make sure it's playing
	if sound_name == current_sound_name and sound_name != "none":
		if not ambient_player.playing:
			ambient_player.play()
		return
	
	# Stop current sound if playing and it's different
	if ambient_player.playing and sound_name != current_sound_name:
		stop_ambient()
		# Wait one frame to ensure clean stop
		await get_tree().process_frame
	
	# Update sound type
	current_sound_name = sound_name
	
	# Update sound generator with new type
	sound_generator.set_sound_type(sound_name)
	
	# Emit signal for UI updates
	sound_changed.emit(sound_name)
	
	# Start the new sound if not "none"
	if sound_name != "none":
		if not ambient_player.playing:
			# Ensure streams are initialized in case this is called before _ready
			if not _streams_initialized:
				initialize_audio_streams()
			
			# Start playing
			ambient_player.play()
	
	# Set enum value for internal tracking
	match sound_name:
		"rain": current_sound_type = SoundType.RAIN
		"ocean": current_sound_type = SoundType.OCEAN
		"birds": current_sound_type = SoundType.BIRDS
		"none": current_sound_type = SoundType.NONE

# Play the bell sound
func play_bell() -> void:
	# First ensure any lingering bell sounds are completely stopped
	if bell_player.playing:
		bell_player.stop()
		sound_generator.reset_bell_generator()
		# Wait for audio system to catch up
		await get_tree().process_frame
		await get_tree().process_frame  # Wait two frames to be extra safe
	
	# Ensure the stream is properly initialized
	if not _streams_initialized:
		initialize_audio_streams()
	
	# Set bell volume to a reasonable level to avoid harshness
	bell_player.volume_db = -6.0
	
	# Play the bell
	bell_player.play()
	bell_played.emit()
	
	# Set a safety timer to ensure bell stops after maximum duration
	var bell_timer = get_tree().create_timer(3.0)
	bell_timer.timeout.connect(func(): 
		if bell_player.playing:
			bell_player.stop()
			sound_generator.reset_bell_generator()
	)

# Stop the ambient sound
func stop_ambient() -> void:
	if ambient_player.playing:
		# First pause to avoid glitches
		ambient_player.stream_paused = true
		await get_tree().process_frame
		
		# Then stop completely
		ambient_player.stop()
		
		# Reset sound generator state to prevent artifacts
		sound_generator.reset_ambient_generator()
		current_sound_name = "none"
		current_sound_type = SoundType.NONE
		sound_changed.emit("none")

# Pause the ambient sound
func pause_ambient() -> void:
	if ambient_player.playing:
		ambient_player.stream_paused = true

# Resume the ambient sound
func resume_ambient() -> void:
	if ambient_player.playing:
		ambient_player.stream_paused = false

# Handle ambient player finished
func _on_ambient_player_finished() -> void:
	# Reset sound generator state
	sound_generator.reset_ambient_generator()
	
	# Update state
	current_sound_name = "none"
	current_sound_type = SoundType.NONE
	sound_changed.emit("none")

# Handle bell player finished
func _on_bell_player_finished() -> void:
	# Double-check that bell is properly stopped
	if bell_player.playing:
		bell_player.stop()
	
	# Reset sound generator state
	sound_generator.reset_bell_generator()
	
	# Ensure the ambient sound can continue cleanly
	if current_sound_name != "none" and not ambient_player.playing:
		# Re-initialize stream if needed
		if not ambient_player.stream:
			initialize_audio_streams()
		
		# Restart ambient sound
		ambient_player.play() 
