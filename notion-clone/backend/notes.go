package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// getNotes gets all notes for the current user
func getNotes(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Get the notes
	notes, err := GetNotesByUserID(userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get notes"})
		return
	}

	// Return the notes
	c.JSON(http.StatusOK, gin.H{"notes": notes})
}

// createNote creates a new note
func createNote(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Parse the request body
	var body struct {
		Title    string `json:"title" binding:"required"`
		Content  string `json:"content"`
		Category string `json:"category"`
		IsPublic bool   `json:"is_public"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create the note
	note, err := CreateNote(body.Title, body.Content, userID.(int64), body.Category, body.IsPublic)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create note"})
		return
	}

	// Return the note
	c.JSON(http.StatusCreated, gin.H{"note": note})
}

// getNoteById gets a note by ID
func getNoteById(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Get the note ID from the URL
	noteID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	// Get the note
	note, err := GetNoteByID(noteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get note"})
		return
	}
	if note == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	// Check if the user is the owner of the note or a collaborator
	if note.UserID != userID.(int64) {
		// Check if the user is a collaborator
		var isCollaborator bool
		err := db.QueryRow("SELECT 1 FROM collaborators WHERE note_id = ? AND user_id = ?", noteID, userID).Scan(&isCollaborator)
		if err != nil || !isCollaborator {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to access this note"})
			return
		}
	}

	// Return the note
	c.JSON(http.StatusOK, gin.H{"note": note})
}

// updateNote updates a note
func updateNote(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Get the note ID from the URL
	noteID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	// Get the note
	note, err := GetNoteByID(noteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get note"})
		return
	}
	if note == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	// Check if the user is the owner of the note or has write permission
	if note.UserID != userID.(int64) {
		// Check if the user is a collaborator with write permission
		var permission string
		err := db.QueryRow("SELECT permission FROM collaborators WHERE note_id = ? AND user_id = ?", noteID, userID).Scan(&permission)
		if err != nil || (permission != "write" && permission != "admin") {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this note"})
			return
		}
	}

	// Parse the request body
	var body struct {
		Title    string `json:"title" binding:"required"`
		Content  string `json:"content"`
		Category string `json:"category"`
		IsPublic bool   `json:"is_public"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the note
	updatedNote, err := UpdateNote(noteID, body.Title, body.Content, body.Category, body.IsPublic)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update note"})
		return
	}

	// Return the updated note
	c.JSON(http.StatusOK, gin.H{"note": updatedNote})
}

// deleteNote deletes a note
func deleteNote(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Get the note ID from the URL
	noteID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}

	// Get the note
	note, err := GetNoteByID(noteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get note"})
		return
	}
	if note == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
		return
	}

	// Check if the user is the owner of the note
	if note.UserID != userID.(int64) {
		// Check if the user is a collaborator with admin permission
		var permission string
		err := db.QueryRow("SELECT permission FROM collaborators WHERE note_id = ? AND user_id = ?", noteID, userID).Scan(&permission)
		if err != nil || permission != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to delete this note"})
			return
		}
	}

	// Delete the note
	if err := DeleteNote(noteID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note"})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{"message": "Note deleted successfully"})
} 