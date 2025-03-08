package main

import (
	"database/sql"
	"errors"
	"time"
)

// User represents a user in the system
type User struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` // Password is not included in JSON responses
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Note represents a note in the system
type Note struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	UserID    int64     `json:"user_id"`
	Category  string    `json:"category"`
	IsPublic  bool      `json:"is_public"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Collaborator represents a user with access to a note
type Collaborator struct {
	ID         int64     `json:"id"`
	NoteID     int64     `json:"note_id"`
	UserID     int64     `json:"user_id"`
	Permission string    `json:"permission"` // 'read', 'write', 'admin'
	CreatedAt  time.Time `json:"created_at"`
	User       *User     `json:"user,omitempty"`
	Note       *Note     `json:"note,omitempty"`
}

// SharedNote represents a note shared with a user
type SharedNote struct {
	Note       Note   `json:"note"`
	Permission string `json:"permission"`
}

// FindUserByEmail finds a user by email
func FindUserByEmail(email string) (*User, error) {
	var user User
	row := db.QueryRow("SELECT id, email, password, name, created_at, updated_at FROM users WHERE email = ?", email)
	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// FindUserByID finds a user by ID
func FindUserByID(id int64) (*User, error) {
	var user User
	row := db.QueryRow("SELECT id, email, password, name, created_at, updated_at FROM users WHERE id = ?", id)
	err := row.Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// CreateUser creates a new user
func CreateUser(email, password, name string) (*User, error) {
	// Check if user already exists
	existingUser, err := FindUserByEmail(email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Insert new user
	result, err := db.Exec(
		"INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
		email, password, name,
	)
	if err != nil {
		return nil, err
	}

	// Get the ID of the new user
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	// Return the new user
	return FindUserByID(id)
}

// GetNotesByUserID gets all notes for a user
func GetNotesByUserID(userID int64) ([]Note, error) {
	rows, err := db.Query(
		"SELECT id, title, content, user_id, category, is_public, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC",
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []Note
	for rows.Next() {
		var note Note
		if err := rows.Scan(
			&note.ID, &note.Title, &note.Content, &note.UserID,
			&note.Category, &note.IsPublic, &note.CreatedAt, &note.UpdatedAt,
		); err != nil {
			return nil, err
		}
		notes = append(notes, note)
	}

	return notes, nil
}

// GetNoteByID gets a note by ID
func GetNoteByID(id int64) (*Note, error) {
	var note Note
	row := db.QueryRow(
		"SELECT id, title, content, user_id, category, is_public, created_at, updated_at FROM notes WHERE id = ?",
		id,
	)
	err := row.Scan(
		&note.ID, &note.Title, &note.Content, &note.UserID,
		&note.Category, &note.IsPublic, &note.CreatedAt, &note.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &note, nil
}

// CreateNote creates a new note
func CreateNote(title, content string, userID int64, category string, isPublic bool) (*Note, error) {
	result, err := db.Exec(
		"INSERT INTO notes (title, content, user_id, category, is_public) VALUES (?, ?, ?, ?, ?)",
		title, content, userID, category, isPublic,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return GetNoteByID(id)
}

// UpdateNote updates a note
func UpdateNote(id int64, title, content, category string, isPublic bool) (*Note, error) {
	_, err := db.Exec(
		"UPDATE notes SET title = ?, content = ?, category = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		title, content, category, isPublic, id,
	)
	if err != nil {
		return nil, err
	}

	return GetNoteByID(id)
}

// DeleteNote deletes a note
func DeleteNote(id int64) error {
	_, err := db.Exec("DELETE FROM notes WHERE id = ?", id)
	return err
}

// GetCollaboratorsByNoteID gets all collaborators for a note
func GetCollaboratorsByNoteID(noteID int64) ([]Collaborator, error) {
	rows, err := db.Query(`
		SELECT c.id, c.note_id, c.user_id, c.permission, c.created_at,
			   u.id, u.email, u.name, u.created_at, u.updated_at
		FROM collaborators c
		JOIN users u ON c.user_id = u.id
		WHERE c.note_id = ?
	`, noteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var collaborators []Collaborator
	for rows.Next() {
		var c Collaborator
		var u User
		var password string
		if err := rows.Scan(
			&c.ID, &c.NoteID, &c.UserID, &c.Permission, &c.CreatedAt,
			&u.ID, &u.Email, &u.Name, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		u.Password = password
		c.User = &u
		collaborators = append(collaborators, c)
	}

	return collaborators, nil
}

// AddCollaborator adds a collaborator to a note
func AddCollaborator(noteID, userID int64, permission string) (*Collaborator, error) {
	// Check if the collaborator already exists
	var exists bool
	err := db.QueryRow("SELECT 1 FROM collaborators WHERE note_id = ? AND user_id = ?", noteID, userID).Scan(&exists)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if exists {
		return nil, errors.New("collaborator already exists")
	}

	// Insert the collaborator
	result, err := db.Exec(
		"INSERT INTO collaborators (note_id, user_id, permission) VALUES (?, ?, ?)",
		noteID, userID, permission,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	// Get the collaborator
	var c Collaborator
	row := db.QueryRow(
		"SELECT id, note_id, user_id, permission, created_at FROM collaborators WHERE id = ?",
		id,
	)
	err = row.Scan(&c.ID, &c.NoteID, &c.UserID, &c.Permission, &c.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Get the user
	user, err := FindUserByID(userID)
	if err != nil {
		return nil, err
	}
	c.User = user

	return &c, nil
}

// UpdateCollaboratorPermission updates a collaborator's permission
func UpdateCollaboratorPermission(noteID, userID int64, permission string) error {
	_, err := db.Exec(
		"UPDATE collaborators SET permission = ? WHERE note_id = ? AND user_id = ?",
		permission, noteID, userID,
	)
	return err
}

// RemoveCollaborator removes a collaborator from a note
func RemoveCollaborator(noteID, userID int64) error {
	_, err := db.Exec(
		"DELETE FROM collaborators WHERE note_id = ? AND user_id = ?",
		noteID, userID,
	)
	return err
}

// GetSharedNotes gets all notes shared with a user
func GetSharedNotes(userID int64) ([]SharedNote, error) {
	rows, err := db.Query(`
		SELECT n.id, n.title, n.content, n.user_id, n.category, n.is_public, n.created_at, n.updated_at, c.permission
		FROM notes n
		JOIN collaborators c ON n.id = c.note_id
		WHERE c.user_id = ?
		ORDER BY n.updated_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sharedNotes []SharedNote
	for rows.Next() {
		var note Note
		var permission string
		if err := rows.Scan(
			&note.ID, &note.Title, &note.Content, &note.UserID,
			&note.Category, &note.IsPublic, &note.CreatedAt, &note.UpdatedAt,
			&permission,
		); err != nil {
			return nil, err
		}
		sharedNotes = append(sharedNotes, SharedNote{Note: note, Permission: permission})
	}

	return sharedNotes, nil
} 