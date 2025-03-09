import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['DATABASE_URL'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/notion_clone')

# Enable CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Basic "Hello World" endpoint
@app.route('/')
def hello_world():
    return jsonify({
        "message": "Hello World from Notion Clone API!",
        "status": "success"
    })

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "notion-clone-backend"
    })

# Initialize database with retry logic
def initialize_database():
    from models import init_db
    max_retries = 5
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to initialize database (attempt {attempt + 1}/{max_retries})...")
            init_db()
            logger.info("Database initialized successfully!")
            return True
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
    
    logger.error("Failed to initialize database after multiple attempts")
    return False

# Import routes after app initialization to avoid circular imports
from routes import register_routes
register_routes(app)

# Import socket handlers
from socket_handlers import register_socket_handlers
register_socket_handlers(socketio)

# Initialize database on startup
with app.app_context():
    initialize_database()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True) 