class_name MeditationSession
extends Node

# Signals
signal session_started()
signal session_ended()
signal session_paused()
signal session_resumed()
signal time_updated(minutes: int, seconds: int)

# Session state enum
enum SessionState { IDLE, RUNNING, PAUSED }

# Session parameters
var session_duration_seconds: int = 0
var remaining_seconds: int = 0
var current_state: SessionState = SessionState.IDLE

# Timers
var session_timer: Timer
var update_timer: Timer

func _ready() -> void:
	# Create and configure session timer (one-shot)
	session_timer = Timer.new()
	session_timer.one_shot = true
	session_timer.timeout.connect(_on_session_timer_timeout)
	add_child(session_timer)
	
	# Create and configure update timer (1-second intervals)
	update_timer = Timer.new()
	update_timer.wait_time = 1.0
	update_timer.timeout.connect(_on_update_timer_timeout)
	add_child(update_timer)

# Start a new meditation session
func start_session(duration_minutes: int) -> void:
	# Don't start if a session is already running
	if current_state != SessionState.IDLE:
		return
	
	# Calculate duration in seconds
	session_duration_seconds = duration_minutes * 60
	remaining_seconds = session_duration_seconds
	
	# Update timers
	session_timer.wait_time = session_duration_seconds
	session_timer.start()
	update_timer.start()
	
	# Update state
	current_state = SessionState.RUNNING
	
	# Emit initial time update
	_update_time_display()
	
	# Emit started signal
	session_started.emit()

# End the current session
func end_session() -> void:
	# Only end if a session is active
	if current_state == SessionState.IDLE:
		return
	
	# Stop timers
	session_timer.stop()
	update_timer.stop()
	
	# Reset state
	current_state = SessionState.IDLE
	remaining_seconds = 0
	
	# Emit ended signal
	session_ended.emit()

# Pause the current session
func pause_session() -> void:
	# Only pause if running
	if current_state != SessionState.RUNNING:
		return
	
	# Pause timers
	session_timer.paused = true
	update_timer.paused = true
	
	# Update state
	current_state = SessionState.PAUSED
	
	# Emit paused signal
	session_paused.emit()

# Resume a paused session
func resume_session() -> void:
	# Only resume if paused
	if current_state != SessionState.PAUSED:
		return
	
	# Resume timers
	session_timer.paused = false
	update_timer.paused = false
	
	# Update state
	current_state = SessionState.RUNNING
	
	# Emit resumed signal
	session_resumed.emit()

# Toggle between pause and resume
func toggle_pause() -> void:
	if current_state == SessionState.RUNNING:
		pause_session()
	elif current_state == SessionState.PAUSED:
		resume_session()

# Get the current session state
func get_state() -> SessionState:
	return current_state

# Get remaining time as formatted string (MM:SS)
func get_time_string() -> String:
	var minutes = int(remaining_seconds / 60)
	var seconds = int(remaining_seconds % 60)
	return "%02d:%02d" % [minutes, seconds]

# Handle session timer timeout
func _on_session_timer_timeout() -> void:
	_update_time_display()
	end_session()

# Handle update timer timeout
func _on_update_timer_timeout() -> void:
	# Decrease remaining time
	if remaining_seconds > 0:
		remaining_seconds -= 1
	
	# Update time display
	_update_time_display()

# Update time display and emit signal
func _update_time_display() -> void:
	var minutes = int(remaining_seconds / 60)
	var seconds = int(remaining_seconds % 60)
	time_updated.emit(minutes, seconds) 
