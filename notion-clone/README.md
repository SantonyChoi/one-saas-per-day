# Minimalist Notion Clone

A lightweight, block-based collaborative note-taking application inspired by Notion, built with SvelteKit, Flask, and PostgreSQL.

## Features

- Block-based editing (paragraphs, headings, lists, etc.)
- Real-time collaboration using WebSockets and CRDT (Yjs)
- Docker Compose setup for easy local development and deployment
- No authentication required - open editing for all

## Tech Stack

### Frontend
- SvelteKit (lightweight JavaScript framework)
- Tailwind CSS (for minimal styling)
- Yjs (CRDT for real-time collaboration)
- WebSocket client

### Backend
- Python Flask (lightweight web framework)
- Flask-SocketIO (for WebSocket support)
- PostgreSQL (for block storage with JSON support)

### Infrastructure
- Docker & Docker Compose (containerization)

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/notion-clone.git
   cd notion-clone
   ```

2. Start the application using Docker Compose:
   ```bash
   docker compose up
   ```

3. Open your browser and navigate to `http://localhost:3000`.

## Project Structure

```
notion-clone/
├── frontend/                # SvelteKit frontend
│   ├── src/                 # Source code
│   │   ├── routes/          # SvelteKit routes
│   │   ├── lib/             # Utility functions and shared code
│   │   └── components/      # Svelte components
│   ├── static/              # Static assets
│   ├── Dockerfile           # Docker configuration
│   └── package.json         # Frontend dependencies
├── backend/                 # Flask backend
│   ├── app.py               # Main application entry point
│   ├── models.py            # Database models
│   ├── routes.py            # API routes
│   ├── socket_handlers.py   # WebSocket handlers
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
└── README.md                # Project documentation
```

## Implementation Details

### Block-Based Editing
- Each document consists of ordered blocks
- Blocks can be paragraphs, headings, lists, etc.
- Blocks are stored in PostgreSQL with JSON content

### Real-Time Collaboration
- Changes are synchronized in real-time using WebSockets
- Conflict resolution using Yjs CRDT library
- Multiple users can edit the same document simultaneously

## Database Schema

```sql
CREATE TABLE blocks (
    id UUID PRIMARY KEY,
    page_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pages (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## License

This project is open source and available under the MIT License. 