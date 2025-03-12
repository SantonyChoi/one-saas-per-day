class_name BreathingGuide
extends Node

signal animation_started
signal animation_paused
signal animation_resumed
signal animation_stopped

# Animation parameters (customizable)
@export var inhale_duration: float = 4.0
@export var exhale_duration: float = 4.0
@export var hold_duration: float = 1.0  # Optional hold after inhale/exhale
@export var min_scale: float = 0.8
@export var max_scale: float = 1.4
@export var smoothness: float = 0.4  # Higher value = smoother transitions

var breathing_tween: Tween
var is_animating: bool = false
var is_paused: bool = false

@onready var breathing_circle: Control = $"../BreathingCircle"

func start_animation() -> void:
	# Stop any existing animation first
	stop_animation()
	
	# Reset circle state
	if breathing_circle:
		breathing_circle.scale = Vector2.ONE
	
	# Create and configure the breathing animation tween
	breathing_tween = create_tween()
	breathing_tween.set_loops()  # Infinite looping
	
	if breathing_circle:
		# Inhale (expand)
		breathing_tween.tween_property(
			breathing_circle, "scale", 
			Vector2(max_scale, max_scale), 
			inhale_duration
		).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		
		# Optional hold at full inhale
		if hold_duration > 0:
			breathing_tween.tween_interval(hold_duration)
		
		# Exhale (contract)
		breathing_tween.tween_property(
			breathing_circle, "scale", 
			Vector2(min_scale, min_scale), 
			exhale_duration
		).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		
		# Optional hold at full exhale
		if hold_duration > 0:
			breathing_tween.tween_interval(hold_duration)
	
	is_animating = true
	is_paused = false
	emit_signal("animation_started")

func pause_animation() -> void:
	if is_animating and not is_paused and breathing_tween and breathing_tween.is_valid():
		breathing_tween.pause()
		is_paused = true
		emit_signal("animation_paused")

func resume_animation() -> void:
	if is_animating and is_paused and breathing_tween and breathing_tween.is_valid():
		breathing_tween.play()
		is_paused = false
		emit_signal("animation_resumed")

func stop_animation() -> void:
	if breathing_tween and breathing_tween.is_valid():
		breathing_tween.kill()
		
	if is_animating:
		emit_signal("animation_stopped")
		
	is_animating = false
	is_paused = false
	
	# Reset circle scale if it exists
	if breathing_circle:
		var reset_tween = create_tween()
		reset_tween.tween_property(breathing_circle, "scale", Vector2.ONE, 0.3)

func is_animation_active() -> bool:
	return is_animating

func is_animation_paused() -> bool:
	return is_paused 