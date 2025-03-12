class_name BreathingGuide
extends Control

# Animation parameters
@export var breath_in_duration: float = 4.0
@export var hold_duration: float = 1.0
@export var breath_out_duration: float = 4.0
@export var rest_duration: float = 1.0
@export var min_scale: float = 1.0
@export var max_scale: float = 2.5

# Animation states
enum BreathState { IN, HOLD, OUT, REST }
var current_state: BreathState = BreathState.REST

# Animation variables
var animation_time: float = 0.0
var is_animating: bool = false
var is_paused: bool = false

# UI components
@onready var breath_circle: ColorRect = $BreathCircle
@onready var breath_label: Label = $BreathLabel

# Original size and position for scaling
var original_size: Vector2
var original_position: Vector2

func _ready() -> void:
	# Store original circle size and position
	original_size = breath_circle.size
	original_position = breath_circle.position
	
	# Initial state
	set_state(BreathState.REST)
	
	# Set the circle to its smallest size initially
	set_circle_scale(min_scale)

func _process(delta: float) -> void:
	if not is_animating or is_paused:
		return
	
	# Update animation time
	animation_time += delta
	
	# Process animation based on current state
	match current_state:
		BreathState.IN:
			_process_breath_in()
		BreathState.HOLD:
			_process_breath_hold()
		BreathState.OUT:
			_process_breath_out()
		BreathState.REST:
			_process_breath_rest()

# Process breathing in animation
func _process_breath_in() -> void:
	if animation_time >= breath_in_duration:
		# Transition to hold state
		set_state(BreathState.HOLD)
		return
	
	# Calculate progress (0.0 to 1.0)
	var progress = animation_time / breath_in_duration
	
	# Ease-in-out for smoother animation
	progress = ease_in_out(progress)
	
	# Scale the circle from min to max
	var current_scale = lerp(min_scale, max_scale, progress)
	set_circle_scale(current_scale)

# Process breath hold animation
func _process_breath_hold() -> void:
	if animation_time >= hold_duration:
		# Transition to breath out state
		set_state(BreathState.OUT)
		return
	
	# Keep circle at max scale during hold
	set_circle_scale(max_scale)

# Process breathing out animation
func _process_breath_out() -> void:
	if animation_time >= breath_out_duration:
		# Transition to rest state
		set_state(BreathState.REST)
		return
	
	# Calculate progress (0.0 to 1.0)
	var progress = animation_time / breath_out_duration
	
	# Ease-in-out for smoother animation
	progress = ease_in_out(progress)
	
	# Scale the circle from max to min
	var current_scale = lerp(max_scale, min_scale, progress)
	set_circle_scale(current_scale)

# Process rest animation
func _process_breath_rest() -> void:
	if animation_time >= rest_duration:
		# Transition back to breath in state
		set_state(BreathState.IN)
		return
	
	# Keep circle at min scale during rest
	set_circle_scale(min_scale)

# Set the breathing animation state
func set_state(state: BreathState) -> void:
	current_state = state
	animation_time = 0.0
	
	# Update label text based on state
	match state:
		BreathState.IN:
			breath_label.text = "Breathe In"
		BreathState.HOLD:
			breath_label.text = "Hold"
		BreathState.OUT:
			breath_label.text = "Breathe Out"
		BreathState.REST:
			breath_label.text = "Rest"

# Set the scale of the circle while maintaining center position
func set_circle_scale(scale_factor: float) -> void:
	if not breath_circle:
		return
	
	# Calculate new size
	var new_size = original_size * scale_factor
	
	# Calculate new position to keep centered
	var new_position = original_position - (new_size - original_size) / 2
	
	# Apply new size and position
	breath_circle.size = new_size
	breath_circle.position = new_position

# Helper function for easing in and out
func ease_in_out(t: float) -> float:
	# Simple ease in-out function
	if t < 0.5:
		return 2.0 * t * t
	else:
		return -1.0 + (4.0 - 2.0 * t) * t

# Start the breathing animation
func start_animation() -> void:
	is_animating = true
	is_paused = false
	set_state(BreathState.IN)

# Pause the breathing animation
func pause_animation() -> void:
	is_paused = true

# Resume the breathing animation
func resume_animation() -> void:
	is_paused = false

# Stop the breathing animation
func stop_animation() -> void:
	is_animating = false
	is_paused = false
	set_state(BreathState.REST)
	set_circle_scale(min_scale) 