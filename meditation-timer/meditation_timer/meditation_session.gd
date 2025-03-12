class_name MeditationSession
extends Node

signal session_started(duration_minutes: int)
signal session_paused
signal session_resumed
signal session_ended
signal time_updated(time_left: float)

enum SessionState { IDLE, RUNNING, PAUSED }

var state: SessionState = SessionState.IDLE
var duration_minutes: int = 5
var time_remaining: float = 0.0

@onready var timer: Timer = $SessionTimer
@onready var update_timer: Timer = $UpdateTimer

func _ready() -> void:
	timer.one_shot = true
	timer.timeout.connect(_on_timer_timeout)
	
	update_timer.wait_time = 0.1  # Update 10 times per second for smoother time display
	update_timer.timeout.connect(_on_update_timer_timeout)

func start_session(minutes: int) -> void:
	if state != SessionState.IDLE:
		end_session()  # End existing session if one is in progress
	
	duration_minutes = minutes
	time_remaining = minutes * 60.0
	
	timer.wait_time = time_remaining
	timer.start()
	update_timer.start()
	
	state = SessionState.RUNNING
	emit_signal("session_started", duration_minutes)
	emit_signal("time_updated", time_remaining)

func pause_session() -> void:
	if state != SessionState.RUNNING:
		return
		
	timer.paused = true
	update_timer.paused = true
	state = SessionState.PAUSED
	emit_signal("session_paused")

func resume_session() -> void:
	if state != SessionState.PAUSED:
		return
		
	timer.paused = false
	update_timer.paused = false
	state = SessionState.RUNNING
	emit_signal("session_resumed")

func end_session() -> void:
	timer.stop()
	update_timer.stop()
	
	# Only emit signal if we were in an active session
	if state != SessionState.IDLE:
		emit_signal("session_ended")
	
	state = SessionState.IDLE
	time_remaining = 0.0

func get_formatted_time() -> String:
	var minutes := int(time_remaining) / 60
	var seconds := int(time_remaining) % 60
	return "%02d:%02d" % [minutes, seconds]

func is_session_active() -> bool:
	return state != SessionState.IDLE

func is_session_paused() -> bool:
	return state == SessionState.PAUSED

func _on_timer_timeout() -> void:
	end_session()

func _on_update_timer_timeout() -> void:
	if state == SessionState.RUNNING:
		time_remaining = timer.time_left
		emit_signal("time_updated", time_remaining) 