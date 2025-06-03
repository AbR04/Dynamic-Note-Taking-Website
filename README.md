# QuickNotes Application

## Project Overview

QuickNotes is a minimalist and intuitive note-taking web application designed for quick organization and management of personal notes. Built with a modern React frontend and a Flask (Python) backend, it provides a seamless experience for creating, updating, deleting, and organizing notes with various features to enhance productivity.

## Key Features

* **CRUD Operations:** Full functionality to Create, Read, Update, and Delete notes.
* **Dynamic Tagging:** Organize notes using custom tags. Tags are dynamically listed and numbered based on their presence across notes.
* **Tag Filtering:** Filter notes instantly by clicking on associated tags.
* **Real-time Search:** Efficiently search notes by title, description, or tags.
* **Note Pinning:** Pin important notes to the top of your list for easy access.
* **Interactive Dark Mode:** A toggle switch allows users to switch between light and dark themes, with the preference saved locally.
* **In-Place Spot Editing:** Directly edit note details (title, description, tags) within the note card itself for quick modifications.
* **Animated Delete Confirmation:** A visual animation accompanies a confirmation modal before a note is permanently deleted, enhancing user experience and preventing accidental data loss.
* **Robust Undo Functionality:** Revert the last Add, Update, or Delete action, providing a safety net for user interactions.

## Technologies Used

* **Frontend:**
    * React.js: For building the user interface and managing component-based architecture.
    * JavaScript (ES6+)
    * HTML5
    * CSS3: For styling, responsive design, animations, and pseudo-elements.
    * Axios: For making HTTP requests to the backend API.
    * Local Storage: For persisting user preferences like dark mode.
* **Backend:**
    * Flask (Python): (Assumed/Planned) For serving the API endpoints and handling data storage/retrieval.
* **Database:** (Assumed/Planned, e.g., SQLite, PostgreSQL, MongoDB - depends on Flask implementation)
