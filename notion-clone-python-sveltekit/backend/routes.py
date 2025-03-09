from flask import jsonify, request
import uuid
from models import get_db, Page, Block

def register_routes(app):
    # Pages API endpoints
    @app.route('/api/pages', methods=['GET'])
    def get_pages():
        db = get_db()
        pages = db.query(Page).all()
        return jsonify([page.to_dict() for page in pages])

    @app.route('/api/pages/<page_id>', methods=['GET'])
    def get_page(page_id):
        db = get_db()
        page = db.query(Page).filter(Page.id == page_id).first()
        if not page:
            return jsonify({"error": "Page not found"}), 404
        return jsonify(page.to_dict())

    @app.route('/api/pages', methods=['POST'])
    def create_page():
        data = request.json
        if not data or 'title' not in data:
            return jsonify({"error": "Title is required"}), 400

        db = get_db()
        page = Page(title=data['title'])
        db.add(page)
        db.commit()
        
        # Create an initial paragraph block
        block = Block(
            page_id=page.id,
            type='paragraph',
            content={"text": "Start writing here..."},
            position=0
        )
        db.add(block)
        db.commit()
        
        return jsonify(page.to_dict()), 201

    @app.route('/api/pages/<page_id>', methods=['PUT'])
    def update_page(page_id):
        data = request.json
        if not data or 'title' not in data:
            return jsonify({"error": "Title is required"}), 400

        db = get_db()
        page = db.query(Page).filter(Page.id == page_id).first()
        if not page:
            return jsonify({"error": "Page not found"}), 404

        page.title = data['title']
        db.commit()
        return jsonify(page.to_dict())

    @app.route('/api/pages/<page_id>', methods=['DELETE'])
    def delete_page(page_id):
        db = get_db()
        page = db.query(Page).filter(Page.id == page_id).first()
        if not page:
            return jsonify({"error": "Page not found"}), 404

        db.delete(page)
        db.commit()
        return jsonify({"message": "Page deleted successfully"})

    # Blocks API endpoints
    @app.route('/api/pages/<page_id>/blocks', methods=['GET'])
    def get_blocks(page_id):
        db = get_db()
        blocks = db.query(Block).filter(Block.page_id == page_id).order_by(Block.position).all()
        return jsonify([block.to_dict() for block in blocks])

    @app.route('/api/blocks/<block_id>', methods=['GET'])
    def get_block(block_id):
        db = get_db()
        block = db.query(Block).filter(Block.id == block_id).first()
        if not block:
            return jsonify({"error": "Block not found"}), 404
        return jsonify(block.to_dict())

    @app.route('/api/pages/<page_id>/blocks', methods=['POST'])
    def create_block(page_id):
        data = request.json
        if not data or 'type' not in data or 'content' not in data:
            return jsonify({"error": "Type and content are required"}), 400

        db = get_db()
        # Check if page exists
        page = db.query(Page).filter(Page.id == page_id).first()
        if not page:
            return jsonify({"error": "Page not found"}), 404

        # Get the highest position value
        max_position = db.query(Block).filter(Block.page_id == page_id).count()
        
        # Create new block
        block = Block(
            page_id=page_id,
            type=data['type'],
            content=data['content'],
            position=data.get('position', max_position)
        )
        db.add(block)
        db.commit()
        return jsonify(block.to_dict()), 201

    @app.route('/api/blocks/<block_id>', methods=['PUT'])
    def update_block(block_id):
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        db = get_db()
        block = db.query(Block).filter(Block.id == block_id).first()
        if not block:
            return jsonify({"error": "Block not found"}), 404

        # Update block fields
        if 'type' in data:
            block.type = data['type']
        if 'content' in data:
            block.content = data['content']
        if 'position' in data:
            block.position = data['position']

        db.commit()
        return jsonify(block.to_dict())

    @app.route('/api/blocks/<block_id>', methods=['DELETE'])
    def delete_block(block_id):
        db = get_db()
        block = db.query(Block).filter(Block.id == block_id).first()
        if not block:
            return jsonify({"error": "Block not found"}), 404

        # Get the page_id and position before deleting
        page_id = block.page_id
        position = block.position

        # Delete the block
        db.delete(block)
        
        # Update positions of remaining blocks
        blocks_to_update = db.query(Block).filter(
            Block.page_id == page_id,
            Block.position > position
        ).all()
        
        for b in blocks_to_update:
            b.position -= 1
        
        db.commit()
        return jsonify({"message": "Block deleted successfully"}) 