from flask import request
from flask_socketio import emit, join_room, leave_room
from models import get_db, Block, Page
import json
import logging
import uuid
from y_py import YDoc, YMap, YArray

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store active documents (page_id -> YDoc)
active_docs = {}

# 필요한 함수 직접 구현
def encode_state_vector(doc):
    """
    Encode the state vector of a YDoc.
    """
    return doc.encode_state_vector()

def encode_update_from_state_vector(doc, state_vector):
    """
    Encode an update from a YDoc based on a state vector.
    """
    return doc.encode_state_as_update(state_vector)

def register_socket_handlers(socketio):
    @socketio.on('connect')
    def handle_connect():
        logger.info(f"Client connected: {request.sid}")
        emit('connection_established', {'status': 'connected'})

    @socketio.on('disconnect')
    def handle_disconnect():
        logger.info(f"Client disconnected: {request.sid}")

    @socketio.on('join_page')
    def handle_join_page(data):
        """
        Handle a client joining a page for collaborative editing
        """
        page_id = data.get('page_id')
        if not page_id:
            emit('error', {'message': 'Page ID is required'})
            return

        # Join the room for this page
        join_room(page_id)
        logger.info(f"Client {request.sid} joined page {page_id}")

        # Initialize YDoc for this page if it doesn't exist
        if page_id not in active_docs:
            active_docs[page_id] = YDoc()
            
            # Initialize the blocks array in the YDoc
            blocks_array = active_docs[page_id].get_array('blocks')
            
            # Load blocks from database
            db = get_db()
            blocks = db.query(Block).filter(Block.page_id == page_id).order_by(Block.position).all()
            
            # Add blocks to YDoc
            for block in blocks:
                block_map = YMap()
                block_map.set('id', str(block.id))
                block_map.set('type', block.type)
                block_map.set('content', json.dumps(block.content))
                block_map.set('position', block.position)
                blocks_array.append(block_map)
        
        # Get the current state of the document
        doc = active_docs[page_id]
        state_vector = encode_state_vector(doc)
        
        # Send the state vector to the client
        emit('sync_step1', {'state_vector': state_vector.tobytes().hex()})

    @socketio.on('sync_step2')
    def handle_sync_step2(data):
        """
        Handle the second step of the sync protocol
        """
        page_id = data.get('page_id')
        client_state_vector = bytes.fromhex(data.get('state_vector', ''))
        
        if not page_id or page_id not in active_docs:
            emit('error', {'message': 'Invalid page ID'})
            return
        
        # Get the document
        doc = active_docs[page_id]
        
        # Encode the state as an update based on the client's state vector
        update = encode_update_from_state_vector(doc, client_state_vector)
        
        # Send the update to the client
        emit('sync_update', {'update': update.tobytes().hex()})

    @socketio.on('update')
    def handle_update(data):
        """
        Handle updates from clients
        """
        page_id = data.get('page_id')
        update_bytes = bytes.fromhex(data.get('update', ''))
        
        if not page_id or page_id not in active_docs:
            emit('error', {'message': 'Invalid page ID'})
            return
        
        # Get the document
        doc = active_docs[page_id]
        
        # Apply the update to the document
        doc.apply_update(update_bytes)
        
        # Broadcast the update to all clients in the room except the sender
        emit('update', {'update': update_bytes.hex()}, room=page_id, skip_sid=request.sid)
        
        # Persist changes to database (debounced/throttled in a real implementation)
        persist_changes(page_id, doc)

    @socketio.on('leave_page')
    def handle_leave_page(data):
        """
        Handle a client leaving a page
        """
        page_id = data.get('page_id')
        if not page_id:
            return
        
        leave_room(page_id)
        logger.info(f"Client {request.sid} left page {page_id}")
        
        # Check if the room is empty and clean up if needed
        if len(socketio.server.rooms.get(page_id, {})) == 0 and page_id in active_docs:
            # Persist any final changes
            persist_changes(page_id, active_docs[page_id])
            # Remove the document from memory
            del active_docs[page_id]
            logger.info(f"Cleaned up document for page {page_id}")

def persist_changes(page_id, doc):
    """
    Persist changes from the YDoc to the database
    """
    try:
        db = get_db()
        
        # Get the blocks array from the YDoc
        blocks_array = doc.get_array('blocks')
        
        # Get existing blocks from the database
        existing_blocks = {str(block.id): block for block in 
                          db.query(Block).filter(Block.page_id == page_id).all()}
        
        # Process each block in the YDoc
        for i in range(len(blocks_array)):
            block_map = blocks_array[i]
            block_id = block_map.get('id')
            block_type = block_map.get('type')
            block_content = json.loads(block_map.get('content'))
            block_position = i  # Use array index as position
            
            if block_id in existing_blocks:
                # Update existing block
                block = existing_blocks[block_id]
                block.type = block_type
                block.content = block_content
                block.position = block_position
                del existing_blocks[block_id]
            else:
                # Create new block
                new_block = Block(
                    id=uuid.UUID(block_id),
                    page_id=page_id,
                    type=block_type,
                    content=block_content,
                    position=block_position
                )
                db.add(new_block)
        
        # Delete blocks that no longer exist in the YDoc
        for block in existing_blocks.values():
            db.delete(block)
        
        db.commit()
        logger.info(f"Persisted changes for page {page_id}")
    except Exception as e:
        logger.error(f"Error persisting changes: {str(e)}")
        db.rollback() 