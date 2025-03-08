# Notion Clone

A collaborative note-taking application similar to Notion, built with Next.js, Express.js, and SQLite.

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

### Backend
- Express.js (Node.js framework)
- TypeScript
- SQLite (database)
- Socket.IO (for real-time collaboration)
- JWT (for authentication)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/notion-clone.git
   cd notion-clone
   ```

2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Create a `.env` file in the `backend` directory:
   ```
   PORT=4000
   JWT_SECRET=your_jwt_secret_key_change_in_production
   COOKIE_SECRET=your_cookie_secret_key_change_in_production
   NODE_ENV=development
   ```

### Development

1. Start the development server:
   ```bash
   npm run dev
   ```

   This will start both the frontend and backend servers concurrently.

2. Open your browser and navigate to `http://localhost:3000`.

### Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t notion-clone .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 4000:4000 -d notion-clone
   ```

3. Access the application at `http://localhost:4000`.

## Project Structure

```
notion-clone/
├── backend/                # Backend server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── db/             # Database setup
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── socket/         # Socket.IO handlers
│   │   └── index.ts        # Server entry point
│   ├── .env                # Environment variables
│   ├── package.json        # Backend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # React components
│   │   ├── lib/            # Utility functions
│   │   └── types/          # TypeScript types
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── Dockerfile              # Docker configuration
├── package.json            # Root dependencies and scripts
└── README.md               # Project documentation
```

## License

This project is licensed under the ISC License.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [SQLite](https://www.sqlite.org/)
- [Tailwind CSS](https://tailwindcss.com/) 
