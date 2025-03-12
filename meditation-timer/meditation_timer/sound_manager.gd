class_name SoundManager
extends Node

signal sound_changed(type: String)

enum SoundType { NONE, RAIN, OCEAN, BIRDS }

var current_sound: SoundType = SoundType.NONE
var audio_generators: Dictionary = {}

@onready var ambient_player: AudioStreamPlayer = $AmbientPlayer
@onready var bell_player: AudioStreamPlayer = $BellPlayer
@onready var sound_generator: Node = $SoundGenerator

# Audio streams
var rain_stream: AudioStream
var ocean_stream: AudioStream 
var birds_stream: AudioStream
var bell_stream: AudioStream

func _ready() -> void:
	# Load audio streams
	rain_stream = preload("res://sounds/rain.tres")
	ocean_stream = preload("res://sounds/ocean.tres")
	birds_stream = preload("res://sounds/birds.tres")
	bell_stream = preload("res://sounds/bell.tres")
	
	# Setup bell player
	bell_player.stream = bell_stream
	
	# Connect signals
	ambient_player.finished.connect(_on_ambient_player_finished)
	bell_player.finished.connect(_on_bell_player_finished)

func set_sound(type: SoundType) -> void:
	# Stop current sound if playing
	if ambient_player.playing:
		ambient_player.stop()
	
	current_sound = type
	
	# Set the appropriate stream based on the sound type
	match type:
		SoundType.RAIN:
			ambient_player.stream = rain_stream
			ambient_player.play()
		SoundType.OCEAN:
			ambient_player.stream = ocean_stream
			ambient_player.play()
		SoundType.BIRDS:
			ambient_player.stream = birds_stream
			ambient_player.play()
		SoundType.NONE:
			pass # No sound selected
	
	emit_signal("sound_changed", get_sound_name(type))

func get_sound_name(type: SoundType) -> String:
	match type:
		SoundType.RAIN: return "rain"
		SoundType.OCEAN: return "ocean"
		SoundType.BIRDS: return "birds"
		_: return "none"

func get_current_sound_type() -> SoundType:
	return current_sound

func play_bell() -> void:
	bell_player.play()

func pause_ambient() -> void:
	if ambient_player.playing:
		ambient_player.stream_paused = true

func resume_ambient() -> void:
	if current_sound != SoundType.NONE and ambient_player.stream_paused:
		ambient_player.stream_paused = false

func stop_ambient() -> void:
	ambient_player.stop()

func _on_ambient_player_finished() -> void:
	# If the sound finished playing, restart it (for looping ambient sounds)
	if current_sound != SoundType.NONE:
		ambient_player.play()

func _on_bell_player_finished() -> void:
	# Bell finished playing - no action needed
	pass 