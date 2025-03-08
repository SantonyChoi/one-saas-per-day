package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// getCollaborators gets all collaborators for a note
func getCollaborators(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Get the note ID from the URL
	noteID, err := strconv.ParseInt(c.Param("noteId"), 10, 64)
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

	// Get the collaborators
	collaborators, err := GetCollaboratorsByNoteID(noteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get collaborators"})
		return
	}

	// Return the collaborators
	c.JSON(http.StatusOK, gin.H{"collaborators": collaborators})
}

// addCollaborator adds a collaborator to a note
func addCollaborator(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Get the note ID from the URL
	noteID, err := strconv.ParseInt(c.Param("noteId"), 10, 64)
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

	// Check if the user is the owner of the note or has admin permission
	if note.UserID != userID.(int64) {
		// Check if the user is a collaborator with admin permission
		var permission string
		err := db.QueryRow("SELECT permission FROM collaborators WHERE note_id = ? AND user_id = ?", noteID, userID).Scan(&permission)
		if err != nil || permission != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to add collaborators to this note"})
			return
		}
	}

	// Parse the request body
	var body struct {
		Email      string `json:"email" binding:"required,email"`
		Permission string `json:"permission" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate the permission
	if body.Permission != "read" && body.Permission != "write" && body.Permission != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission. Must be 'read', 'write', or 'admin'"})
		return
	}

	// Find the user by email
	user, err := FindUserByEmail(body.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if the user is trying to add themselves
	if user.ID == userID.(int64) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot add yourself as a collaborator"})
		return
	}

	// Add the collaborator
	collaborator, err := AddCollaborator(noteID, user.ID, body.Permission)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Return the collaborator
	c.JSON(http.StatusCreated, gin.H{"collaborator": collaborator})
}

// updateCollaboratorPermission updates a collaborator's permission
func updateCollaboratorPermission(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Get the note ID and user ID from the URL
	noteID, err := strconv.ParseInt(c.Param("noteId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}
	collaboratorUserID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
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

	// Check if the user is the owner of the note or has admin permission
	if note.UserID != userID.(int64) {
		// Check if the user is a collaborator with admin permission
		var permission string
		err := db.QueryRow("SELECT permission FROM collaborators WHERE note_id = ? AND user_id = ?", noteID, userID).Scan(&permission)
		if err != nil || permission != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update collaborators for this note"})
			return
		}
	}

	// Parse the request body
	var body struct {
		Permission string `json:"permission" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate the permission
	if body.Permission != "read" && body.Permission != "write" && body.Permission != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission. Must be 'read', 'write', or 'admin'"})
		return
	}

	// Update the collaborator's permission
	if err := UpdateCollaboratorPermission(noteID, collaboratorUserID, body.Permission); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update collaborator permission"})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{"message": "Collaborator permission updated successfully"})
}

// removeCollaborator removes a collaborator from a note
func removeCollaborator(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Get the note ID and user ID from the URL
	noteID, err := strconv.ParseInt(c.Param("noteId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note ID"})
		return
	}
	collaboratorUserID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
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

	// Check if the user is the owner of the note or has admin permission
	if note.UserID != userID.(int64) {
		// Check if the user is a collaborator with admin permission
		var permission string
		err := db.QueryRow("SELECT permission FROM collaborators WHERE note_id = ? AND user_id = ?", noteID, userID).Scan(&permission)
		if err != nil || permission != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to remove collaborators from this note"})
			return
		}
	}

	// Remove the collaborator
	if err := RemoveCollaborator(noteID, collaboratorUserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove collaborator"})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{"message": "Collaborator removed successfully"})
}

// getSharedNotes gets all notes shared with the current user
func getSharedNotes(c *gin.Context) {
	// Get the user ID from the context
	userID, _ := c.Get("userID")

	// Get the shared notes
	sharedNotes, err := GetSharedNotes(userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get shared notes"})
		return
	}

	// Return the shared notes
	c.JSON(http.StatusOK, gin.H{"notes": sharedNotes})
} 