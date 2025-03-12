class_name MainUIController
extends Control

# Core components
@onready var session_manager = $SessionManager
@onready var sound_manager = $SoundManager
@onready var breathing_guide = $BreathingGuide

# UI containers
@onready var setup_container: Control = $MarginContainer/VBoxContainer/SetupContainer
@onready var meditation_container: Control = $MarginContainer/VBoxContainer/MeditationContainer
@onready var time_label: Label = $MarginContainer/VBoxContainer/MeditationContainer/TimerContainer/RemainingTimeLabel
@onready var flash_overlay: ColorRect = $FlashOverlay

# Duration buttons
@onready var duration_buttons: Dictionary = {
	5: $MarginContainer/VBoxContainer/SetupContainer/DurationButtons/FiveMinButton,
	10: $MarginContainer/VBoxContainer/SetupContainer/DurationButtons/TenMinButton,
	15: $MarginContainer/VBoxContainer/SetupContainer/DurationButtons/FifteenMinButton,
	30: $MarginContainer/VBoxContainer/SetupContainer/DurationButtons/ThirtyMinButton
}

# Sound buttons
@onready var sound_buttons: Dictionary = {
	"rain": $MarginContainer/VBoxContainer/SetupContainer/SoundOptions/RainButton,
	"ocean": $MarginContainer/VBoxContainer/SetupContainer/SoundOptions/OceanButton,
	"birds": $MarginContainer/VBoxContainer/SetupContainer/SoundOptions/BirdsButton,
	"none": $MarginContainer/VBoxContainer/SetupContainer/SoundOptions/NoneButton
}

# Session controls
@onready var pause_button: Button = $MarginContainer/VBoxContainer/MeditationContainer/ButtonsContainer/PauseButton
@onready var stop_button: Button = $MarginContainer/VBoxContainer/MeditationContainer/ButtonsContainer/StopButton

# Sound type enum (matching with SoundManager)
enum SoundType { NONE, RAIN, OCEAN, BIRDS }

# Visual feedback tween
var feedback_tween: Tween

func _ready() -> void:
	# Connect to session manager signals
	session_manager.session_started.connect(_on_session_started)
	session_manager.session_paused.connect(_on_session_paused)
	session_manager.session_resumed.connect(_on_session_resumed)
	session_manager.session_ended.connect(_on_session_ended)
	session_manager.time_updated.connect(_on_time_updated)
	
	# Connect to sound manager signals
	sound_manager.sound_changed.connect(_on_sound_changed)
	
	# Connect duration button signals
	for duration in duration_buttons:
		duration_buttons[duration].pressed.connect(func(): _on_duration_selected(duration))
	
	# Connect sound button signals
	for sound_type in sound_buttons:
		sound_buttons[sound_type].pressed.connect(func(): _on_sound_selected(sound_type))
	
	# Connect session control buttons
	pause_button.pressed.connect(_on_pause_button_pressed)
	stop_button.pressed.connect(_on_stop_button_pressed)
	
	# Initialize UI state
	setup_container.visible = true
	meditation_container.visible = false
	
	# Set initial sound selection
	_on_sound_selected("none")
	sound_buttons["none"].button_pressed = true
	
	# Initialize accessibility features
	_setup_accessibility()

func _on_duration_selected(minutes: int) -> void:
	session_manager.start_session(minutes)

func _on_sound_selected(sound_type: String) -> void:
	# Reset all sound button states
	for btn_type in sound_buttons:
		sound_buttons[btn_type].button_pressed = false
	
	# Set the selected button state
	sound_buttons[sound_type].button_pressed = true
	
	# Update sound in sound manager
	match sound_type:
		"rain": sound_manager.set_sound(SoundType.RAIN)
		"ocean": sound_manager.set_sound(SoundType.OCEAN)
		"birds": sound_manager.set_sound(SoundType.BIRDS)
		"none": sound_manager.set_sound(SoundType.NONE)

func _on_pause_button_pressed() -> void:
	if session_manager.is_session_paused():
		session_manager.resume_session()
	else:
		session_manager.pause_session()

func _on_stop_button_pressed() -> void:
	session_manager.end_session()

func _on_session_started(_duration: int) -> void:
	# Update UI state
	setup_container.visible = false
	meditation_container.visible = true
	
	# Start breathing animation
	breathing_guide.start_animation()
	
	# Add subtle transition effect
	_create_transition_effect()

func _on_session_paused() -> void:
	pause_button.text = "Resume"
	
	# Pause breathing animation
	breathing_guide.pause_animation()
	
	# Pause ambient sound
	sound_manager.pause_ambient()

func _on_session_resumed() -> void:
	pause_button.text = "Pause"
	
	# Resume breathing animation
	breathing_guide.resume_animation()
	
	# Resume ambient sound
	sound_manager.resume_ambient()

func _on_session_ended() -> void:
	# Stop breathing animation
	breathing_guide.stop_animation()
	
	# Stop ambient sound
	sound_manager.stop_ambient()
	
	# Play completion sound
	sound_manager.play_bell()
	
	# Show completion animation
	_show_completion_effect()
	
	# Return to setup screen with delay
	await get_tree().create_timer(1.5).timeout
	setup_container.visible = true
	meditation_container.visible = false

func _on_time_updated(time_left: float) -> void:
	# Update the timer display
	var minutes := int(time_left) / 60
	var seconds := int(time_left) % 60
	time_label.text = "%02d:%02d" % [minutes, seconds]

func _on_sound_changed(type: String) -> void:
	# Visual feedback for sound change
	_show_sound_change_feedback(type)

func _show_completion_effect() -> void:
	# Show flash effect
	flash_overlay.visible = true
	flash_overlay.modulate.a = 0.0
	
	if feedback_tween and feedback_tween.is_valid():
		feedback_tween.kill()
	
	feedback_tween = create_tween()
	feedback_tween.tween_property(flash_overlay, "modulate:a", 0.5, 0.5)
	feedback_tween.tween_property(flash_overlay, "modulate:a", 0.0, 0.5)
	feedback_tween.tween_callback(func(): flash_overlay.visible = false)

func _show_sound_change_feedback(sound_type: String) -> void:
	# Subtle visual feedback when sound changes
	var button = sound_buttons.get(sound_type)
	if button:
		var original_scale = button.scale
		
		var feedback = create_tween()
		feedback.tween_property(button, "scale", original_scale * 1.1, 0.1)
		feedback.tween_property(button, "scale", original_scale, 0.1)

func _create_transition_effect() -> void:
	# Subtle fade transition between screens
	var target_opacity = meditation_container.modulate.a
	meditation_container.modulate.a = 0
	
	var transition = create_tween()
	transition.tween_property(meditation_container, "modulate:a", target_opacity, 0.3)

func _setup_accessibility() -> void:
	# Set up proper focus order for keyboard navigation
	for duration in duration_buttons.keys():
		duration_buttons[duration].focus_mode = Control.FOCUS_ALL
	
	for sound_type in sound_buttons:
		sound_buttons[sound_type].focus_mode = Control.FOCUS_ALL
	
	pause_button.focus_mode = Control.FOCUS_ALL
	stop_button.focus_mode = Control.FOCUS_ALL
	
	# Add tooltips for screen readers
	for duration in duration_buttons.keys():
		duration_buttons[duration].tooltip_text = "Start a %d minute meditation session" % duration
	
	for sound_type in sound_buttons:
		sound_buttons[sound_type].tooltip_text = "Select %s background sound" % sound_type
	
	pause_button.tooltip_text = "Pause or resume the current meditation session"
	stop_button.tooltip_text = "Stop the current meditation session"
	
	# Set initial focus
	duration_buttons[5].grab_focus() 
