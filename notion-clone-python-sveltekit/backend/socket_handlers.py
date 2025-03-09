from flask import request
from flask_socketio import emit, join_room, leave_room
from models import get_db, Block, Page
import json
import logging
import uuid
from y_py import YDoc, YMap, YArray
import threading
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store active documents (page_id -> YDoc)
active_docs = {}
# Store document locks to prevent race conditions
doc_locks = {}
# Store last persistence time for each document
last_persist_time = {}
# Persistence interval in seconds
PERSIST_INTERVAL = 5

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

def get_or_create_doc_lock(page_id):
    """
    Get or create a lock for a document.
    """
    if page_id not in doc_locks:
        doc_locks[page_id] = threading.Lock()
    return doc_locks[page_id]

def start_persistence_thread():
    """
    Start a background thread to periodically persist changes.
    """
    def persistence_worker():
        while True:
            try:
                current_time = time.time()
                pages_to_persist = []
                
                # Find documents that need to be persisted
                for page_id, last_time in list(last_persist_time.items()):
                    if current_time - last_time >= PERSIST_INTERVAL:
                        pages_to_persist.append(page_id)
                
                # Persist changes for each document
                for page_id in pages_to_persist:
                    if page_id in active_docs:
                        with get_or_create_doc_lock(page_id):
                            persist_changes(page_id, active_docs[page_id])
                            last_persist_time[page_id] = current_time
                
                # Sleep for a short time
                time.sleep(1)
            except Exception as e:
                logger.error(f"Error in persistence worker: {str(e)}")
    
    thread = threading.Thread(target=persistence_worker, daemon=True)
    thread.start()
    logger.info("Started persistence background thread")

def register_socket_handlers(socketio):
    # Start the persistence thread
    start_persistence_thread()
    
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
        # 데이터가 문자열인 경우 JSON으로 파싱
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                emit('error', {'message': 'Invalid JSON data'})
                return
        
        page_id = data.get('page_id')
        if not page_id:
            emit('error', {'message': 'Page ID is required'})
            return

        # Join the room for this page
        join_room(page_id)
        logger.info(f"Client {request.sid} joined page {page_id}")

        # Initialize YDoc for this page if it doesn't exist
        with get_or_create_doc_lock(page_id):
            if page_id not in active_docs:
                active_docs[page_id] = YDoc()
                last_persist_time[page_id] = time.time()
                
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

    @socketio.on('update_block')
    def handle_update_block(data):
        """
        Handle block update events from clients
        """
        try:
            # 데이터가 문자열인 경우 JSON으로 파싱
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    emit('error', {'message': 'Invalid JSON data'})
                    return
            
            page_id = data.get('pageId')
            block = data.get('block')
            
            if not page_id or not block:
                emit('error', {'message': 'Invalid data for block update'})
                return
            
            logger.info(f"Block update received for page {page_id}, block {block.get('id')}")
            
            # Update the block in the database
            db = get_db()
            db_block = db.query(Block).filter(Block.id == block.get('id')).first()
            
            if db_block:
                # Update the block
                if 'type' in block:
                    db_block.type = block['type']
                if 'content' in block:
                    db_block.content = block['content']
                if 'position' in block:
                    db_block.position = block['position']
                
                db.commit()
                
                # Broadcast the update to all clients in the room except the sender
                emit('block_updated', block, room=page_id, skip_sid=request.sid)
                logger.info(f"Block update broadcasted to room {page_id}")
            else:
                emit('error', {'message': f"Block {block.get('id')} not found"})
        except Exception as e:
            logger.error(f"Error in update_block: {str(e)}")
            emit('error', {'message': f'Update error: {str(e)}'})

    @socketio.on('add_block')
    def handle_add_block(data):
        """
        Handle block creation events from clients
        """
        try:
            # 데이터가 문자열인 경우 JSON으로 파싱
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    emit('error', {'message': 'Invalid JSON data'})
                    return
            
            page_id = data.get('pageId')
            block = data.get('block')
            
            if not page_id or not block:
                emit('error', {'message': 'Invalid data for block creation'})
                return
            
            logger.info(f"Block creation received for page {page_id}")
            
            # Broadcast the new block to all clients in the room except the sender
            emit('block_added', block, room=page_id, skip_sid=request.sid)
            logger.info(f"Block creation broadcasted to room {page_id}")
        except Exception as e:
            logger.error(f"Error in add_block: {str(e)}")
            emit('error', {'message': f'Add block error: {str(e)}'})

    @socketio.on('delete_block')
    def handle_delete_block(data):
        """
        Handle block deletion events from clients
        """
        try:
            # 데이터가 문자열인 경우 JSON으로 파싱
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    emit('error', {'message': 'Invalid JSON data'})
                    return
            
            page_id = data.get('pageId')
            block_id = data.get('blockId')
            
            if not page_id or not block_id:
                emit('error', {'message': 'Invalid data for block deletion'})
                return
            
            logger.info(f"Block deletion received for page {page_id}, block {block_id}")
            
            # Broadcast the deletion to all clients in the room except the sender
            emit('block_deleted', block_id, room=page_id, skip_sid=request.sid)
            logger.info(f"Block deletion broadcasted to room {page_id}")
        except Exception as e:
            logger.error(f"Error in delete_block: {str(e)}")
            emit('error', {'message': f'Delete block error: {str(e)}'})

    @socketio.on('update_title')
    def handle_update_title(data):
        """
        Handle title update events from clients
        """
        try:
            # 데이터가 문자열인 경우 JSON으로 파싱
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    emit('error', {'message': 'Invalid JSON data'})
                    return
            
            page_id = data.get('pageId')
            title = data.get('title')
            
            if not page_id or title is None:
                emit('error', {'message': 'Invalid data for title update'})
                return
            
            logger.info(f"Title update received for page {page_id}: {title}")
            
            # Update the title in the database
            db = get_db()
            page = db.query(Page).filter(Page.id == page_id).first()
            
            if page:
                page.title = title
                db.commit()
                
                # Broadcast the title update to all clients in the room except the sender
                emit('title_updated', title, room=page_id, skip_sid=request.sid)
                logger.info(f"Title update broadcasted to room {page_id}")
            else:
                emit('error', {'message': f"Page {page_id} not found"})
        except Exception as e:
            logger.error(f"Error in update_title: {str(e)}")
            emit('error', {'message': f'Title update error: {str(e)}'})

    @socketio.on('sync_step2')
    def handle_sync_step2(data):
        """
        Handle the second step of the sync protocol
        """
        try:
            # 데이터가 문자열인 경우 JSON으로 파싱
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    emit('error', {'message': 'Invalid JSON data'})
                    return
            
            page_id = data.get('page_id')
            client_sv = data.get('state_vector')
            
            if not page_id or not client_sv:
                emit('error', {'message': 'Invalid data for sync'})
                return
            
            # Convert hex string to bytes
            client_sv_bytes = bytes.fromhex(client_sv)
            
            with get_or_create_doc_lock(page_id):
                if page_id not in active_docs:
                    emit('error', {'message': 'Document not found'})
                    return
                
                doc = active_docs[page_id]
                update = encode_update_from_state_vector(doc, client_sv_bytes)
            
            # Send the update to the client
            emit('sync_step2', {'update': update.tobytes().hex()})
        except Exception as e:
            logger.error(f"Error in sync_step2: {str(e)}")
            emit('error', {'message': f'Sync error: {str(e)}'})

    @socketio.on('update')
    def handle_update(data):
        """
        Handle document updates from clients
        """
        try:
            # 데이터가 문자열인 경우 JSON으로 파싱
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    emit('error', {'message': 'Invalid JSON data'})
                    return
            
            page_id = data.get('page_id')
            update_hex = data.get('update')
            
            if not page_id or not update_hex:
                emit('error', {'message': 'Invalid data for update'})
                return
            
            # Convert hex string to bytes
            update_bytes = bytes.fromhex(update_hex)
            
            with get_or_create_doc_lock(page_id):
                if page_id not in active_docs:
                    emit('error', {'message': 'Document not found'})
                    return
                
                doc = active_docs[page_id]
                doc.apply_update(update_bytes)
                
                # Update the last persistence time
                last_persist_time[page_id] = time.time()
            
            # Broadcast the update to all clients in the room except the sender
            emit('update', {'update': update_hex}, room=page_id, skip_sid=request.sid)
        except Exception as e:
            logger.error(f"Error in update: {str(e)}")
            emit('error', {'message': f'Update error: {str(e)}'})

    @socketio.on('leave_page')
    def handle_leave_page(data):
        """
        Handle a client leaving a page
        """
        try:
            # 데이터가 문자열인 경우 JSON으로 파싱
            if isinstance(data, str):
                try:
                    data = json.loads(data)
                except json.JSONDecodeError:
                    emit('error', {'message': 'Invalid JSON data'})
                    return
            
            page_id = data.get('page_id')
            
            if not page_id:
                emit('error', {'message': 'Page ID is required'})
                return
            
            # Leave the room for this page
            leave_room(page_id)
            logger.info(f"Client {request.sid} left page {page_id}")
            
            # Check if this was the last client in the room
            # If so, we can clean up resources
            # This would require tracking active clients per room
            # For now, we'll just keep the document in memory
        except Exception as e:
            logger.error(f"Error in leave_page: {str(e)}")
            emit('error', {'message': f'Leave page error: {str(e)}'})

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