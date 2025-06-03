from flask import Flask, request, jsonify
from flask_cors import CORS
# Import the updated model functions
from models import init_db, get_all_notes, add_note, delete_note, update_note

app = Flask(__name__)
CORS(app)

@app.route('/notes', methods=['GET'])
def get_notes():
    # get_all_notes now returns notes with the 'pinned' boolean
    return jsonify(get_all_notes())

@app.route('/notes', methods=['POST'])
def create_note():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    # Tags are stored as a comma-separated string in the DB
    tags = ','.join(data.get('tags', []))
    # Get the pinned status from the request data
    pinned = data.get('pinned', False) # Default to False if not provided

    if not title:
        # Return JSON response for consistency
        return jsonify({"error": "Title is required"}), 400

    # Pass the pinned status to the add_note function
    add_note(title, description, tags, pinned)
    return jsonify({"message": "Note added"}), 201 # Use jsonify for consistency

@app.route('/notes/<int:note_id>', methods=['DELETE'])
def remove_note(note_id):
    delete_note(note_id)
    return jsonify({"message": "Note deleted"}), 200 # Use jsonify for consistency

@app.route('/notes/<int:note_id>', methods=['PUT'])
def edit_note(note_id):
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    # Tags are stored as a comma-separated string in the DB
    tags = ','.join(data.get('tags', []))
    # Get the pinned status from the request data
    pinned = data.get('pinned', False) # Default to False if not provided

    # Basic validation - ensure title is not empty during update
    if not title:
         # Return JSON response for consistency
        return jsonify({"error": "Title required"}), 400

    # Pass the pinned status to the update_note function
    update_note(note_id, title, description, tags, pinned)
    return jsonify({"message": "Note updated"}), 200 # Use jsonify for consistency

if __name__ == '__main__':
    init_db() # Make sure the database and table are initialized with the new column
    app.run(debug=True)