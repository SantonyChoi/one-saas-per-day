class_name MeditationUIController
extends Control

# Sound types (must match with SoundManager's SoundType)
enum SoundType { NONE, RAIN, OCEAN, BIRDS }

# Duration in minutes options
@export var duration_options: Array[int] = [1, 5, 10, 15, 20, 30, 45, 60]

# Internal state
var current_duration_index: int = 1  # Default to 5 minutes (index 1)
var current_sound_type: SoundType = SoundType.NONE
var current_sound_name: String = "none"

# Child node references
@onready var meditation_session: MeditationSession = $"../MeditationSession"
@onready var sound_manager: SoundManager = $"../SoundManager"
@onready var breathing_guide: BreathingGuide = $BreathingGuide

# UI Element References
@onready var start_button: Button = $StartButton
@onready var stop_button: Button = $StopButton
@onready var duration_label: Label = $DurationLabel
@onready var duration_slider: HSlider = $DurationSlider
@onready var time_display: Label = $TimeDisplay
@onready var sound_buttons: Array = [
	$SoundButtons/NoneButton,
	$SoundButtons/RainButton,
	$SoundButtons/OceanButton,
	$SoundButtons/BirdsButton
]

func _ready() -> void:
	# Configure duration slider
	duration_slider.min_value = 0
	duration_slider.max_value = duration_options.size() - 1
	duration_slider.step = 1.0
	duration_slider.value = current_duration_index
	
	# Initialize duration label
	_update_duration_label()
	
	# Connect slider value changed signal
	duration_slider.value_changed.connect(_on_duration_changed)
	
	# Connect to session signals
	meditation_session.session_started.connect(_on_session_started)
	meditation_session.session_ended.connect(_on_session_ended)
	meditation_session.time_updated.connect(_on_time_updated)
	meditation_session.session_paused.connect(_on_session_paused)
	meditation_session.session_resumed.connect(_on_session_resumed)
	
	# Connect button signals
	start_button.pressed.connect(_on_start_button_pressed)
	stop_button.pressed.connect(_on_stop_button_pressed)
	
	for i in range(sound_buttons.size()):
		sound_buttons[i].pressed.connect(_on_sound_button_pressed.bind(i))
	
	# Connect to sound manager signals
	sound_manager.sound_changed.connect(_on_sound_changed)
	
	# Initial UI state
	stop_button.hide()
	
	# Set default sound to None
	_set_sound(SoundType.NONE)

# Convert sound type enum to name
func sound_type_to_name(type: SoundType) -> String:
	match type:
		SoundType.RAIN: return "rain"
		SoundType.OCEAN: return "ocean" 
		SoundType.BIRDS: return "birds"
		_: return "none"

# Convert name to sound type enum
func name_to_sound_type(name: String) -> SoundType:
	match name:
		"rain": return SoundType.RAIN
		"ocean": return SoundType.OCEAN
		"birds": return SoundType.BIRDS
		_: return SoundType.NONE

# Update the duration label based on selected duration
func _update_duration_label() -> void:
	var duration_minutes = duration_options[current_duration_index]
	duration_label.text = "%d minutes" % duration_minutes

# Handle duration slider changes
func _on_duration_changed(value: float) -> void:
	current_duration_index = int(value)
	_update_duration_label()

# Update time display
func _on_time_updated(minutes: int, seconds: int) -> void:
	time_display.text = "%02d:%02d" % [minutes, seconds]

# Update UI when session starts
func _on_session_started() -> void:
	start_button.hide()
	stop_button.show()
	duration_slider.editable = false
	
	# Start breathing animation
	breathing_guide.start_animation()
	
	# Disable sound buttons during session
	for button in sound_buttons:
		button.disabled = true

# Update UI when session ends
func _on_session_ended() -> void:
	start_button.show()
	stop_button.hide()
	duration_slider.editable = true
	
	# Stop breathing animation
	breathing_guide.stop_animation()
	
	# Re-enable sound buttons
	for button in sound_buttons:
		button.disabled = false

# Handle session pause
func _on_session_paused() -> void:
	breathing_guide.pause_animation()
	
	# Pause ambient sound if playing
	sound_manager.pause_ambient()

# Handle session resume
func _on_session_resumed() -> void:
	breathing_guide.resume_animation()
	
	# Resume ambient sound if paused
	sound_manager.resume_ambient()

# Start button handler
func _on_start_button_pressed() -> void:
	var duration_minutes = duration_options[current_duration_index]
	meditation_session.start_session(duration_minutes)
	sound_manager.play_bell()  # Play bell on session start

# Stop button handler
func _on_stop_button_pressed() -> void:
	meditation_session.end_session()
	sound_manager.play_bell()  # Play bell on session end

# Sound button handler
func _on_sound_button_pressed(index: int) -> void:
	_set_sound(index)

# Set the current sound
func _set_sound(sound_type_or_index) -> void:
	var sound_type: SoundType
	
	# Handle both index and enum type
	if sound_type_or_index is int:
		sound_type = sound_type_or_index
	else:
		sound_type = sound_type_or_index
	
	# Don't do anything if sound hasn't changed
	if sound_type == current_sound_type:
		return
	
	# Update current sound type
	current_sound_type = sound_type
	current_sound_name = sound_type_to_name(sound_type)
	
	# Update sound manager
	sound_manager.set_sound(current_sound_name)
	
	# Update UI button states
	for i in range(sound_buttons.size()):
		sound_buttons[i].button_pressed = (i == sound_type)

# Handle sound changed signal from sound manager
func _on_sound_changed(sound_name: String) -> void:
	var type = name_to_sound_type(sound_name)
	
	# Only update UI if sound actually changed
	if type != current_sound_type:
		current_sound_type = type
		current_sound_name = sound_name
		
		# Update UI button states
		for i in range(sound_buttons.size()):
			sound_buttons[i].button_pressed = (i == type) 