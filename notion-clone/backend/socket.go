package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	socketio "github.com/googollee/go-socket.io"
	"github.com/golang-jwt/jwt/v5"
)

// NoteUpdate represents an update to a note
type NoteUpdate struct {
	NoteID  int64  `json:"noteId"`
	Content string `json:"content"`
	Title   string `json:"title"`
	UserID  int64  `json:"userId"`
}

// initializeSocketIO initializes the Socket.IO server
func initializeSocketIO(server *socketio.Server) {
	// Configure server options
	server.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		log.Println("Client connected:", s.ID())
		return nil
	})

	// Handle disconnections
	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		log.Println("Client disconnected:", s.ID(), reason)
	})

	// Handle errors
	server.OnError("/", func(s socketio.Conn, e error) {
		log.Println("Socket.IO error:", e)
	})

	// Handle joining a note room
	server.OnEvent("/", "join-note", func(s socketio.Conn, noteID string) {
		log.Printf("Client %s joined note room: %s", s.ID(), noteID)
		s.Join(fmt.Sprintf("note:%s", noteID))
		s.Emit("joined-note", noteID)
	})

	// Handle leaving a note room
	server.OnEvent("/", "leave-note", func(s socketio.Conn, noteID string) {
		log.Printf("Client %s left note room: %s", s.ID(), noteID)
		s.Leave(fmt.Sprintf("note:%s", noteID))
	})

	// Handle note updates
	server.OnEvent("/", "note-update", func(s socketio.Conn, data string) {
		var update NoteUpdate
		if err := json.Unmarshal([]byte(data), &update); err != nil {
			log.Println("Error parsing note update:", err)
			return
		}

		// Validate the user's permission to update the note
		userID := getUserIDFromSocket(s)
		if userID == 0 {
			log.Println("Unauthorized note update attempt")
			return
		}

		// Check if the user is the owner or has write permission
		noteID := update.NoteID
		note, err := GetNoteByID(noteID)
		if err != nil || note == nil {
			log.Println("Note not found for update:", noteID)
			return
		}

		hasPermission := false
		if note.UserID == userID {
			hasPermission = true
		} else {
			// Check if the user is a collaborator with write permission
			var permission string
			err := db.QueryRow("SELECT permission FROM collaborators WHERE note_id = ? AND user_id = ?", noteID, userID).Scan(&permission)
			if err == nil && (permission == "write" || permission == "admin") {
				hasPermission = true
			}
		}

		if !hasPermission {
			log.Println("User does not have permission to update note:", noteID)
			return
		}

		// Update the note in the database
		_, err = db.Exec(
			"UPDATE notes SET content = ?, title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			update.Content, update.Title, noteID,
		)
		if err != nil {
			log.Println("Error updating note in database:", err)
			return
		}

		// Broadcast the update to all clients in the note room
		room := fmt.Sprintf("note:%d", noteID)
		server.BroadcastToRoom("/", room, "note-updated", data)
	})

	// Handle authentication
	server.OnEvent("/", "authenticate", func(s socketio.Conn, token string) {
		// Extract the token
		parts := strings.Split(token, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Println("Invalid token format")
			s.Emit("auth-error", "Invalid token format")
			return
		}

		tokenString := parts[1]
		userID, err := validateToken(tokenString)
		if err != nil {
			log.Println("Invalid token:", err)
			s.Emit("auth-error", "Invalid token")
			return
		}

		// Store the user ID in the socket context
		s.SetContext(fmt.Sprintf("user:%d", userID))
		s.Emit("authenticated", userID)
		log.Printf("Client %s authenticated as user %d", s.ID(), userID)
	})
}

// getUserIDFromSocket extracts the user ID from the socket context
func getUserIDFromSocket(s socketio.Conn) int64 {
	ctx := s.Context()
	if ctx == nil {
		return 0
	}

	contextStr, ok := ctx.(string)
	if !ok || !strings.HasPrefix(contextStr, "user:") {
		return 0
	}

	userIDStr := strings.TrimPrefix(contextStr, "user:")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		return 0
	}

	return userID
}

// validateToken validates a JWT token and returns the user ID
func validateToken(tokenString string) (int64, error) {
	// Get the JWT secret from environment variables
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your_jwt_secret_key_change_in_production"
	}

	// Parse the token
	claims := &JWTClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	// Check for errors
	if err != nil {
		return 0, err
	}

	// Check if the token is valid
	if !token.Valid {
		return 0, fmt.Errorf("invalid token")
	}

	return claims.UserID, nil
} 