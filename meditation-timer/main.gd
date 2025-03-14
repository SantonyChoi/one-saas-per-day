extends Control

# Audio streams
@onready var rain_sound = preload("res://sounds/rain.tres")
@onready var ocean_sound = preload("res://sounds/ocean.tres")
@onready var birds_sound = preload("res://sounds/birds.tres")
@onready var bell_sound = preload("res://sounds/bell.tres")

# Node references
@onready var timer = $Timer
@onready var countdown_timer = $CountdownTimer
@onready var audio_player = $AudioPlayer
@onready var bell_player = $BellPlayer
@onready var breathing_circle = $MarginContainer/VBoxContainer/MeditationContainer/BreathingGuideContainer/BreathingCircle
@onready var remaining_time_label = $MarginContainer/VBoxContainer/MeditationContainer/TimerContainer/RemainingTimeLabel
@onready var setup_container = $MarginContainer/VBoxContainer/SetupContainer
@onready var meditation_container = $MarginContainer/VBoxContainer/MeditationContainer
@onready var pause_button = $MarginContainer/VBoxContainer/MeditationContainer/ButtonsContainer/PauseButton
@onready var flash_overlay = $FlashOverlay

# UI elements for sound selection
@onready var rain_button = $MarginContainer/VBoxContainer/SetupContainer/SoundOptions/RainButton
@onready var ocean_button = $MarginContainer/VBoxContainer/SetupContainer/SoundOptions/OceanButton
@onready var birds_button = $MarginContainer/VBoxContainer/SetupContainer/SoundOptions/BirdsButton
@onready var none_button = $MarginContainer/VBoxContainer/SetupContainer/SoundOptions/NoneButton

# Duration buttons
@onready var five_min_button = $MarginContainer/VBoxContainer/SetupContainer/DurationButtons/FiveMinButton
@onready var ten_min_button = $MarginContainer/VBoxContainer/SetupContainer/DurationButtons/TenMinButton
@onready var fifteen_min_button = $MarginContainer/VBoxContainer/SetupContainer/DurationButtons/FifteenMinButton
@onready var thirty_min_button = $MarginContainer/VBoxContainer/SetupContainer/DurationButtons/ThirtyMinButton

# Session state variables
var session_active = false
var session_paused = false
var current_audio
var current_duration = 0
var breathing_tween

func _ready():
	# Connect duration button signals
	five_min_button.pressed.connect(func(): start_session(5))
	ten_min_button.pressed.connect(func(): start_session(10))
	fifteen_min_button.pressed.connect(func(): start_session(15))
	thirty_min_button.pressed.connect(func(): start_session(30))
	
	# Connect sound button signals
	rain_button.pressed.connect(func(): set_sound_selection("rain"))
	ocean_button.pressed.connect(func(): set_sound_selection("ocean"))
	birds_button.pressed.connect(func(): set_sound_selection("birds"))
	none_button.pressed.connect(func(): set_sound_selection("none"))
	
	# Connect timer signals
	timer.timeout.connect(_on_timer_timeout)
	countdown_timer.timeout.connect(_on_countdown_timer_timeout)
	
	# Connect control buttons
	pause_button.pressed.connect(_on_pause_button_pressed)
	$MarginContainer/VBoxContainer/MeditationContainer/ButtonsContainer/StopButton.pressed.connect(_on_stop_button_pressed)
	
	# Setup countdown timer (for updating the UI)
	countdown_timer.wait_time = 1.0
	
	# Initialize UI
	setup_container.visible = true
	meditation_container.visible = false

# Handle sound button selections
func set_sound_selection(sound_type):
	# Reset all buttons
	rain_button.button_pressed = false
	ocean_button.button_pressed = false
	birds_button.button_pressed = false
	none_button.button_pressed = false
	
	# Set the selected button and current audio
	match sound_type:
		"rain":
			rain_button.button_pressed = true
			current_audio = rain_sound
		"ocean":
			ocean_button.button_pressed = true
			current_audio = ocean_sound
		"birds":
			birds_button.button_pressed = true
			current_audio = birds_sound
		"none":
			none_button.button_pressed = true
			current_audio = null
	
	# If a session is active, update the playing sound
	if session_active and not session_paused and current_audio != null:
		audio_player.stop()
		audio_player.stream = current_audio
		audio_player.play()
	elif session_active and current_audio == null:
		audio_player.stop()

# Start a meditation session with the specified duration in minutes
func start_session(duration_minutes):
	current_duration = duration_minutes
	
	# Setup the timer
	timer.wait_time = duration_minutes * 60
	timer.start()
	
	# Update UI
	setup_container.visible = false
	meditation_container.visible = true
	
	# Format and display the initial time
	remaining_time_label.text = format_time(timer.wait_time)
	
	# Start the countdown timer for UI updates
	countdown_timer.start()
	
	# Start the breathing animation
	start_breathing_animation()
	
	# Play the selected sound if any
	if current_audio != null:
		audio_player.stream = current_audio
		audio_player.play()
	
	# Set session state
	session_active = true
	session_paused = false

# Format seconds into MM:SS display
func format_time(seconds_left):
	var minutes = floor(seconds_left / 60)
	var seconds = int(seconds_left) % 60
	return "%02d:%02d" % [minutes, seconds]

# Start the breathing guide animation
func start_breathing_animation():
	# Stop any existing animation
	if breathing_tween != null and breathing_tween.is_valid():
		breathing_tween.kill()
	
	# Create a new tween for the breathing animation
	breathing_tween = create_tween()
	breathing_tween.set_loops()
	
	# Inhale (expand) - 4 seconds
	breathing_tween.tween_property(breathing_circle, "scale", Vector2(1.4, 1.4), 4.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	# Exhale (contract) - 4 seconds
	breathing_tween.tween_property(breathing_circle, "scale", Vector2(0.8, 0.8), 4.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

# Pause the current session
func pause_session():
	# Pause the timers
	timer.paused = true
	countdown_timer.paused = true
	
	# Pause the breathing animation
	if breathing_tween != null and breathing_tween.is_valid():
		breathing_tween.pause()
	
	# Pause the audio
	if audio_player.playing:
		audio_player.stream_paused = true
	
	# Update UI
	pause_button.text = "Resume"
	
	# Update state
	session_paused = true

# Resume the current session
func resume_session():
	# Resume the timers
	timer.paused = false
	countdown_timer.paused = false
	
	# Resume the breathing animation
	if breathing_tween != null and breathing_tween.is_valid():
		breathing_tween.play()
	
	# Resume the audio if we have audio selected
	if current_audio != null:
		audio_player.stream_paused = false
	
	# Update UI
	pause_button.text = "Pause"
	
	# Update state
	session_paused = false

# End the current session
func end_session():
	# Stop timers
	timer.stop()
	countdown_timer.stop()
	
	# Stop animations
	if breathing_tween != null and breathing_tween.is_valid():
		breathing_tween.kill()
	
	# Stop audio
	audio_player.stop()
	
	# Play the completion bell sound
	bell_player.play()
	
	# Show completion flash effect
	flash_overlay.visible = true
	flash_overlay.modulate.a = 0.0
	
	var flash_tween = create_tween()
	flash_tween.tween_property(flash_overlay, "modulate:a", 0.5, 0.5)
	flash_tween.tween_property(flash_overlay, "modulate:a", 0.0, 0.5)
	flash_tween.tween_callback(func(): flash_overlay.visible = false)
	
	# Update UI
	await get_tree().create_timer(1.5).timeout
	setup_container.visible = true
	meditation_container.visible = false
	
	# Reset state
	session_active = false
	session_paused = false

# Handle pause button click
func _on_pause_button_pressed():
	if session_paused:
		resume_session()
	else:
		pause_session()

# Handle stop button click
func _on_stop_button_pressed():
	end_session()

# Handle main timer timeout (meditation session complete)
func _on_timer_timeout():
	end_session()

# Handle countdown timer timeout (update UI time display)
func _on_countdown_timer_timeout():
	if session_active and not session_paused:
		remaining_time_label.text = format_time(timer.time_left) 
