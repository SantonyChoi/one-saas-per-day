# Notion Clone Backend (Golang)

This is the backend for the Notion Clone application, written in Golang. It provides a RESTful API for managing notes, users, and collaborators, as well as real-time collaboration using Socket.IO.

## Features

- User authentication (register, login, logout)
- Note management (create, read, update, delete)
- Collaboration (share notes with other users)
- Real-time collaboration using Socket.IO

## Tech Stack

- Golang
- Gin (Web framework)
- SQLite (Database)
- Socket.IO (Real-time communication)
- JWT (Authentication)

## Project Structure

- `main.go` - Entry point for the application
- `db.go` - Database setup and initialization
- `models.go` - Data models and database operations
- `auth.go` - Authentication middleware and handlers
- `notes.go` - Note handlers
- `collaborators.go` - Collaborator handlers
- `socket.go` - Socket.IO implementation for real-time collaboration

## Getting Started

### Prerequisites

- Go 1.21 or higher
- SQLite

### Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
go mod download
```

4. Create a `.env` file with the following content:

```
PORT=4000
JWT_SECRET=your_jwt_secret_key_change_in_production
COOKIE_SECRET=your_cookie_secret_key_change_in_production
NODE_ENV=development
```

5. Run the application:

```bash
go run *.go
```

### Docker

You can also run the application using Docker:

```bash
docker build -t notion-clone-backend .
docker run -p 4000:4000 notion-clone-backend
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Notes

- `GET /api/notes` - Get all notes for the current user
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Get a note by ID
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

### Collaborators

- `GET /api/collaborators/note/:noteId` - Get all collaborators for a note
- `POST /api/collaborators/note/:noteId` - Add a collaborator to a note
- `PUT /api/collaborators/note/:noteId/user/:userId` - Update a collaborator's permission
- `DELETE /api/collaborators/note/:noteId/user/:userId` - Remove a collaborator from a note
- `GET /api/collaborators/shared-with-me` - Get all notes shared with the current user

## Socket.IO Events

### Client to Server

- `authenticate` - Authenticate the socket connection
- `join-note` - Join a note room
- `leave-note` - Leave a note room
- `note-update` - Update a note

### Server to Client

- `authenticated` - Socket connection authenticated
- `auth-error` - Authentication error
- `joined-note` - Joined a note room
- `note-updated` - Note updated 