import sqlite3

# Use a consistent database file name
DATABASE_NAME = 'notes.db'

def init_db():
    conn = sqlite3.connect(DATABASE_NAME)
    cur = conn.cursor()
    # Add the 'pinned' column with a default value
    cur.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            pinned INTEGER DEFAULT 0, -- Added pinned column (0 for false, 1 for true)
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Optional: Add 'pinned' column to existing tables if it doesn't exist
    # This is a more robust approach for schema evolution but can be complex.
    # For this simple example, we'll assume the CREATE TABLE handles initial setup.
    # If you have existing data without the 'pinned' column and need to add it later
    # without losing data, you'd need ALTER TABLE logic here.

    conn.commit()
    conn.close() # Using manual close for init_db as it's typically run once

def get_all_notes():
    # Use 'with' statement for better resource management
    with sqlite3.connect(DATABASE_NAME) as conn:
        # Configure connection to return rows as dictionaries (optional but helpful)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        # Select the new 'pinned' column
        cur.execute('SELECT id, title, description, tags, pinned, created_at FROM notes')
        rows = cur.fetchall()
        return [
            {
                "id": row['id'],
                "title": row['title'],
                "description": row['description'],
                "tags": row['tags'],
                "pinned": bool(row['pinned']), # Convert integer 0/1 to boolean
                "created_at": row['created_at']
            }
            for row in rows
        ]

def add_note(title, description, tags='', pinned=False):
    # Use 'with' statement
    with sqlite3.connect(DATABASE_NAME) as conn:
        cur = conn.cursor()
        # Include 'pinned' in the INSERT statement
        cur.execute('INSERT INTO notes (title, description, tags, pinned) VALUES (?, ?, ?, ?)',
                    (title, description, tags, int(pinned))) # Convert boolean to integer 0/1 for storage
        conn.commit()

def delete_note(note_id):
    # Use 'with' statement
    with sqlite3.connect(DATABASE_NAME) as conn:
        cur = conn.cursor()
        cur.execute('DELETE FROM notes WHERE id = ?', (note_id,))
        conn.commit()

def update_note(note_id, title, description, tags, pinned):
    # Use 'with' statement
    with sqlite3.connect(DATABASE_NAME) as conn:
        cur = conn.cursor()
        # Include 'pinned' in the UPDATE statement
        cur.execute('UPDATE notes SET title = ?, description = ?, tags = ?, pinned = ? WHERE id = ?',
                    (title, description, tags, int(pinned), note_id)) # Convert boolean to integer 0/1 for storage
        conn.commit()