package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Initialize database
	initDB()

	// Set up Gin router
	router := gin.Default()

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	if os.Getenv("NODE_ENV") == "production" {
		corsConfig.AllowOrigins = []string{"https://your-production-domain.com"}
	} else {
		corsConfig.AllowOrigins = []string{"http://localhost:3000"}
	}
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	router.Use(cors.New(corsConfig))

	// Initialize Socket.IO server
	server := socketio.NewServer(nil)
	initializeSocketIO(server)

	// Handle Socket.IO
	go func() {
		if err := server.Serve(); err != nil {
			log.Fatalf("Socket.IO server error: %v", err)
		}
	}()
	router.GET("/socket.io/*any", gin.WrapH(server))
	router.POST("/socket.io/*any", gin.WrapH(server))

	// API routes
	api := router.Group("/api")
	{
		// Test route
		api.GET("/test", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Backend server is running!"})
		})

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", registerUser)
			auth.POST("/login", loginUser)
			auth.GET("/me", authMiddleware(), getCurrentUser)
			auth.POST("/logout", logoutUser)
		}

		// Notes routes
		notes := api.Group("/notes")
		{
			notes.GET("", authMiddleware(), getNotes)
			notes.POST("", authMiddleware(), createNote)
			notes.GET("/:id", authMiddleware(), getNoteById)
			notes.PUT("/:id", authMiddleware(), updateNote)
			notes.DELETE("/:id", authMiddleware(), deleteNote)
		}

		// Collaborators routes
		collaborators := api.Group("/collaborators")
		{
			collaborators.GET("/note/:noteId", authMiddleware(), getCollaborators)
			collaborators.POST("/note/:noteId", authMiddleware(), addCollaborator)
			collaborators.PUT("/note/:noteId/user/:userId", authMiddleware(), updateCollaboratorPermission)
			collaborators.DELETE("/note/:noteId/user/:userId", authMiddleware(), removeCollaborator)
			collaborators.GET("/shared-with-me", authMiddleware(), getSharedNotes)
		}
	}

	// Serve static files in production
	if os.Getenv("NODE_ENV") == "production" {
		frontendDir := filepath.Join("..", "frontend", "out")
		router.Static("/", frontendDir)
		router.NoRoute(func(c *gin.Context) {
			c.File(filepath.Join(frontendDir, "index.html"))
		})
	}

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	
	fmt.Printf("Server running on port %s\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 