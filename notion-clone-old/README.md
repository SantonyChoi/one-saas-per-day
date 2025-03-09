# Notion Clone

A collaborative note-taking application similar to Notion, built with Next.js, Golang, and SQLite.

## Features

- User authentication (signup, login, logout)
- Create, read, update, and delete notes
- Markdown support for note content
- Real-time collaboration on notes
- Share notes with other users
- Search and filter notes by title, content, or category
- Responsive design for desktop and mobile

## Tech Stack

### Frontend
- Next.js (React framework)
- TypeScript
- Tailwind CSS (for styling)
- Socket.IO Client (for real-time collaboration)
- React Markdown (for rendering markdown)

### Backend
- Golang
- Gin (Web framework)
- SQLite (database)
- Socket.IO (for real-time collaboration)
- JWT (for authentication)

## Getting Started

### Prerequisites

- Node.js (v18 or higher) for frontend
- Go (v1.21 or higher) for backend
- npm (v8 or higher)
- Docker and Docker Compose (optional, for containerized setup)

### Installation

#### Option 1: Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/notion-clone.git
   cd notion-clone
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   cd frontend && npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../backend && go mod download
   ```

4. Create a `.env` file in the `backend` directory:
   ```
   PORT=4000
   JWT_SECRET=your_jwt_secret_key_change_in_production
   COOKIE_SECRET=your_cookie_secret_key_change_in_production
   NODE_ENV=development
   ```

5. Start the development servers:
   
   For frontend:
   ```bash
   npm run dev:frontend
   ```
   
   For backend:
   ```bash
   cd backend && go run *.go
   ```

6. Open your browser and navigate to `http://localhost:3000`.

#### Option 2: Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/notion-clone.git
   cd notion-clone
   ```

2. Create a `.env` file based on the `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Start the application using Docker Compose:
   ```bash
   docker compose up
   ```

   This will build and start both the frontend and backend containers.

4. Open your browser and navigate to `http://localhost:3000`.

### Troubleshooting Docker Setup

If you encounter issues with Docker Compose, try the following:

1. Make sure Docker and Docker Compose are installed and running:
   ```bash
   docker --version
   docker compose version
   ```

2. If you need to rebuild the containers:
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up
   ```

### Production Deployment

1. Create a `.env` file with production settings:
   ```
   JWT_SECRET=your_secure_jwt_secret
   COOKIE_SECRET=your_secure_cookie_secret
   ```

2. Start the application in production mode:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

3. Access the application at `http://localhost:3000`.

## Project Structure

```
notion-clone/
├── backend/                # Golang backend server
│   ├── main.go             # Main entry point
│   ├── db.go               # Database setup
│   ├── models.go           # Data models
│   ├── auth.go             # Authentication handlers
│   ├── notes.go            # Note handlers
│   ├── collaborators.go    # Collaborator handlers
│   ├── socket.go           # Socket.IO handlers
│   ├── .env                # Environment variables
│   ├── Dockerfile          # Development Docker configuration
│   ├── Dockerfile.prod     # Production Docker configuration
│   └── go.mod              # Go dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # React components
│   │   ├── lib/            # Utility functions
│   │   └── types/          # TypeScript types
│   ├── Dockerfile          # Development Docker configuration
│   ├── Dockerfile.prod     # Production Docker configuration
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── docker-compose.yml      # Development Docker Compose configuration
├── docker-compose.prod.yml # Production Docker Compose configuration
├── .env.example            # Example environment variables
├── package.json            # Root dependencies and scripts
└── README.md               # Project documentation
```

## Implementation Details

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes on both frontend and backend

### Notes
- Markdown support for rich text formatting
- Real-time collaboration using Socket.IO
- Categories for organization
- Public/private note settings

### Collaboration
- Real-time updates using WebSockets
- Permission levels (read, write, admin)
- Active user tracking

## License

This project is licensed under the ISC License.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Gin](https://gin-gonic.com/)
- [Socket.IO](https://socket.io/)
- [SQLite](https://www.sqlite.org/)
- [Tailwind CSS](https://tailwindcss.com/) 
