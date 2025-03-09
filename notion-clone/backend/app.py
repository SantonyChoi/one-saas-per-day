import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

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

# Import routes after app initialization to avoid circular imports
from routes import register_routes
register_routes(app)

# Import socket handlers
from socket_handlers import register_socket_handlers
register_socket_handlers(socketio)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True) 