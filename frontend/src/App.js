import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tags, setTags] = useState(''); // Input field for comma-separated tags
  const [selectedTag, setSelectedTag] = useState(''); // State for filtering by clicking a tag (stores tag name)
  const [pinned, setPinned] = useState(false); // State for the pinned checkbox
  // --- New state to store unique tags with numbers ---
  const [numberedUniqueTags, setNumberedUniqueTags] = useState([]);
  const [editingSpotId, setEditingSpotId] = useState(null); // ID of the note being spot edited
  const [spotEditTitle, setSpotEditTitle] = useState('');
  const [spotEditDescription, setSpotEditDescription] = useState('');
  const [spotEditTags, setSpotEditTags] = useState(''); // Comma-separated string
  const [history, setHistory] = useState([]); // Stack to store action history
  const [validationErrors, setValidationErrors] = useState({}); // State to hold validation errors { fieldName: 'Error message' }
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); // To control modal visibility
  const [noteToDeleteId, setNoteToDeleteId] = useState(null); // To store the ID of the note to delete


  // Handle clicking on a note card to start spot editing
  const handleSpotEditClick = (note) => {
      // Don't start editing if another note is already being edited on the spot
      if (editingSpotId !== null) {
          // Optionally, alert the user or cancel the current spot edit
          // alert('Please save or cancel the current edit first.');
          // handleSpotCancel(); // Option to auto-cancel previous edit
          return; // Prevent editing multiple notes at once
      }

      setEditingSpotId(note.id);
      setSpotEditTitle(note.title);
      setSpotEditDescription(note.description);
      setSpotEditTags(note.tags.join(', ')); // Join tags array back to string
      // Note: Pinned status is not being spot-edited in this implementation
  };

  // Handle saving the changes from spot editing
  const handleSpotUpdate = async (noteId) => {
      const trimmedTitle = spotEditTitle.trim();
      const trimmedDescription = spotEditDescription.trim();

      setValidationErrors({}); // Clear general errors

      if (!trimmedTitle) {
          setValidationErrors({ spotEditTitle: 'Title cannot be empty.' });
          return;
      }

      // if (!editingNote) {
      //    console.error("No note selected for update.");
      //    return;
      // }

      const tagsArray = spotEditTags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);

      try {
          await axios.put(`http://localhost:5000/notes/${noteId}`, {
              title: trimmedTitle,
              description: trimmedDescription,
              tags: tagsArray,
              pinned: notes.find(n => n.id === noteId)?.pinned || false, // Keep original pinned status
          });

          setEditingSpotId(null); // Exit spot editing mode
          setSpotEditTitle(''); // Clear temporary state
          setSpotEditDescription('');
          setSpotEditTags('');

          setEditingSpotId(null); // Exit spot editing mode
          setSpotEditTitle(''); // Clear temporary state
          setSpotEditDescription('');
          setSpotEditTags('');
          setValidationErrors({}); // Clear general errors on successful update

          fetchNotes(); // Refetch notes to show updated data
      } catch (error) {
          console.error('Error updating note:', error);
          alert('Failed to update note. See console for details.');
      }
  };

  // Handle canceling spot editing
  const handleSpotCancel = () => {
      setEditingSpotId(null); // Exit spot editing mode
      setSpotEditTitle(''); // Clear temporary state
      setSpotEditDescription('');
      setSpotEditTags('');
  };

  // ... existing handler functions ...

  // --- Function to show the custom delete confirmation modal ---
  const handleShowDeleteConfirm = (id) => {
      // Prevent showing the modal if the note is being spot-edited (optional, but good UX)
      if (editingSpotId === id) {
          // You could decide to allow deletion from spot edit, or show a different message
          alert("Please save or cancel your edit before deleting.");
          return;
      }
      if (editingSpotId !== null) {
          // If another note is being spot-edited, maybe prevent deleting others
          alert("Please save or cancel the current edit before deleting other notes.");
          return;
      }


      setNoteToDeleteId(id); // Store the ID of the note pending deletion
      setShowDeleteConfirmModal(true); // Set state to true to show the modal
  };


  // --- Function to handle confirming the delete action (called by "Yes, Delete" button in modal) ---
  // This function contains the core deletion logic that was previously in handleDelete
  // --- Function to handle confirming the delete action (called by "Yes, Delete" button in modal) ---
const handleConfirmDelete = async () => {
    // Check if we have a note ID stored for deletion
    if (!noteToDeleteId) {
        console.error("No note ID specified for confirmation delete. Closing modal.");
        handleCancelDelete(); // Close the modal and reset state
        return;
    }

    // --- Find the note's state BEFORE deletion (for undo) ---
    // This must happen BEFORE any state updates or API calls that remove the note from 'notes'
    // Use the stored noteToDeleteId to find the note in the current state
    const noteBeforeDelete = notes.find(n => n.id === noteToDeleteId);
    if (!noteBeforeDelete) {
        console.error(`Note not found in state with ID ${noteToDeleteId} before deletion (confirm delete). Cannot record undo history.`);
        alert("Error recording undo history for delete.");
        // We'll still attempt to delete, but without undo history for this case
    }

    // --- --- START DELETION ANIMATION LOGIC (from previous step) --- ---

    // Get the specific note card DOM element using its ID
    const noteElement = document.getElementById(`note-${noteToDeleteId}`);

    // Hide the modal immediately after confirming, before the animation starts
    // We do this here so the user sees the modal close before the note disappears
    handleCancelDelete(); // Close the modal and reset the pending ID

    if (noteElement) {
        // Add the 'deleting' class to the element to trigger the CSS exit animation
        noteElement.classList.add('deleting');

        // Define the animation duration (MUST match the animation-duration in your CSS)
        const animationDuration = 500; // Example: if your CSS is 0.5s, use 500ms

        // Wait for the animation to finish using setTimeout
        setTimeout(async () => {
            // --- --- END DELETION ANIMATION LOGIC (start actual delete after delay) --- ---

            try {
                // Perform the actual DELETE API call to the backend
                await axios.delete(`http://localhost:5000/notes/${noteToDeleteId}`);
                // console.log('Note deleted:', noteToDeleteId);

                // --- Update frontend state by filtering out the deleted note ---
                // This removes the element from the DOM *after* the animation visually completes.
                setNotes(prevNotes => prevNotes.filter(note => note.id !== noteToDeleteId));

                // --- Clear related state and validation errors on successful delete (after API call) ---
                setSelectedTag(''); // Clear tag filter
                // Check if the deleted note was the one being edited on the spot
                if(editingSpotId === noteToDeleteId) { // Use noteToDeleteId here
                    handleSpotCancel(); // Exit spot edit mode if deleting the actively edited note
                }
                setValidationErrors({}); // Clear errors

                // --- Record successful DELETE action in history (AFTER successful API delete) ---
                // Only add to history if noteBeforeDelete was successfully found earlier
                if (noteBeforeDelete) {
                    setHistory(prevHistory => [...prevHistory, { type: 'DELETE', deletedNote: noteBeforeDelete }]);
                }

                // --- ADD THIS LINE: Refetch notes to update tags ---
                fetchNotes(); // <--- Add this line

            } catch (error) {
                console.error('Error deleting note after animation:', error);
                alert('Failed to delete note. See console for details.');
                // --- Error Handling if API Fails AFTER Animation Starts ---
                // If the deletion API call fails AFTER the animation starts, the note is visually gone but still in the backend.
                // This requires more complex error handling. For now, we'll show an alert and try to revert the visual state.
                noteElement.classList.remove('deleting'); // Attempt to remove the deleting class to make the note reappear visually
                // You might also need to add the note back to the frontend state (setNotes),
                // but this can be tricky with order and unique keys.
            }
        }, animationDuration); // The timeout duration matches the CSS animation duration

    } else {
        // --- Fallback if the element wasn't found (e.g., very fast UI update or error) ---
        // If the element isn't found in the DOM, proceed with the delete immediately without animation.
        console.error(`Note element with ID note-${noteToDeleteId} not found for animation. Deleting immediately.`);
        // Modal is already closed by handleCancelDelete() called above

        try {
              // Perform the actual DELETE API call immediately
            await axios.delete(`http://localhost:5000/notes/${noteToDeleteId}`);

            // Update state immediately since no animation played
            setNotes(prevNotes => prevNotes.filter(note => note.id !== noteToDeleteId));

            // Clear state and validation errors immediately
            setSelectedTag('');
            if(editingSpotId === noteToDeleteId) { // Use noteToDeleteId here
                handleSpotCancel();
            }
            setValidationErrors({});

            // Record action immediately if noteBeforeDelete was found
            if (noteBeforeDelete) {
                setHistory(prevHistory => [...prevHistory, { type: 'DELETE', deletedNote: noteBeforeDelete }]);
            }

            // --- ADD THIS LINE: Refetch notes to update tags ---
            fetchNotes(); // <--- Add this line

        } catch (error) {
            console.error('Error deleting note without animation:', error);
            alert('Failed to delete note. See console for details.');
            // Error handling if API fails immediately
        }
    }
  };


  // --- Function to handle canceling the delete action (called by "No, Cancel" or clicking modal overlay) ---
  const handleCancelDelete = () => {
      setNoteToDeleteId(null); // Clear the stored ID
      setShowDeleteConfirmModal(false); // Set state to false to hide the modal
  };

// ... rest of App component logic ...

  // ... rest of the App component ...
  // Function to generate unique tags with numbers
  const getNumberedUniqueTags = (notesList) => {
    const allTags = notesList.flatMap(note => note.tags || []);
    const uniqueTagNames = [...new Set(allTags)]; // Get unique lowercase tag names
    // Map unique names to objects with a number
    return uniqueTagNames.map((name, index) => ({
      name: name,
      number: index + 1
    }));
  };

  // Helper function to find the number for a given tag name
  const getTagNumber = (tagName) => {
    const foundTag = numberedUniqueTags.find(tagObj => tagObj.name === tagName);
    return foundTag ? foundTag.number : null; // Return number or null if not found
  };


  // Load dark mode preference and fetch notes on initial load
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
    }
    fetchNotes();
  }, []);

  // Apply dark mode class to the body whenever isDarkMode changes
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const fetchNotes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/notes');
      // console.log('Fetched Notes:', res.data);

      const processedNotes = res.data.map(note => ({
        ...note,
        tags: note.tags ? note.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag) : [],
        pinned: Boolean(note.pinned)
      }));

      setNotes(processedNotes);
      // --- Update numbered unique tags after fetching notes ---
      setNumberedUniqueTags(getNumberedUniqueTags(processedNotes));

    } catch (error) {
      console.error('Error fetching notes:', error);
      alert('Failed to fetch notes. See console for details.');
    }
  };

  const handleAdd = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    setValidationErrors({});
    if (!trimmedTitle) {
        setValidationErrors({ title: 'Title cannot be empty.' });
        return;
    }

    const tagsArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);

    try {
        const response = await axios.post('http://localhost:5000/notes', {
          title: trimmedTitle,
          description: trimmedDescription,
          tags: tagsArray,
          pinned: pinned,
        });

        setTitle('');
        setDescription('');
        setTags('');
        setPinned(false);
        setEditingNote(null);
        setSearchTerm('');
        setSelectedTag(''); // Clear tag filter
        setValidationErrors({}); // Clear errors on successful add

        fetchNotes(); // Refetch notes which will update numberedUniqueTags
         // --- Record successful ADD action in history ---
        // Store the ID of the newly added note so we can delete it on undo
        setHistory(prevHistory => [...prevHistory, { type: 'ADD', noteId: response.data.id }]);

    } catch (error) {
        console.error('Error adding note:', error);
        alert('Failed to add note. See console for details.');
    }
  };

  // const handleEdit = (note) => {
  //   setTitle(note.title);
  //   setDescription(note.description);
  //   setTags(note.tags.join(', ')); // note.tags is already an array
  //   setPinned(note.pinned || false);
  //   setEditingNote(note.id);
  //   setSelectedTag(''); // Clear tag filter
  // };

  const handleUpdate = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    setValidationErrors({});

     if (!trimmedTitle) {
        setValidationErrors({ title: 'Title cannot be empty.' }); // Set error for title
        return;
    }
    if (!editingNote) {
         console.error("No note selected for update."); // Should not happen if button is correctly rendered
         return;
    }

    // --- Find the note's current state BEFORE the update ---
    // We need the previous data to restore it on undo
    const noteBeforeUpdate = notes.find(n => n.id === editingNote);
    if (!noteBeforeUpdate) {
        console.error("Note not found in state before update. Cannot record undo history.");
        // Handle this error appropriately - maybe cancel the edit
        alert("Error finding note for update history."); // User feedback
        setEditingNote(null); // Exit edit mode
        return;
    }

    const tagsArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);

    try {
      const response = await axios.put(`http://localhost:5000/notes/${editingNote}`, {
        title: trimmedTitle,
        description: trimmedDescription,
        tags: tagsArray,
        pinned: notes.find(n => n.id === editingNote)?.pinned || false, // Keep original pinned status
      });
      // console.log('Note updated:', response.data);

      setTitle('');
      setDescription('');
      setTags('');
      setPinned(false);
      setEditingNote(null);
      setSearchTerm('');
      setSelectedTag(''); // Clear tag filter

      setEditingSpotId(null); // Exit spot editing mode
      setSpotEditTitle(''); // Clear temporary state
      setSpotEditDescription('');
      setSpotEditTags('');
      setValidationErrors({}); // Clear errors on successful update

      fetchNotes(); // Refetch notes which will update numberedUniqueTags

      // --- Record successful UPDATE action in history ---
      // Store the note's state *before* this update
      setHistory(prevHistory => [...prevHistory, { type: 'UPDATE', previousNote: noteBeforeUpdate }]);

    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note. See console for details.');
    }
  };

  const handleDelete = async (id) => {
      if (!window.confirm('Are you sure you want to delete this note?')) {
        return;
      }

      // --- Find the note's state BEFORE deletion (for undo) ---
      // This must happen BEFORE any state updates or API calls that remove the note from 'notes'
      const noteBeforeDelete = notes.find(n => n.id === id);
      if (!noteBeforeDelete) {
          console.error("Note not found in state before deletion. Cannot record undo history.");
          alert("Error recording undo history for delete.");
          // Decide if you still allow deletion if history can't be recorded. Let's allow it but log error.
      }

      // --- --- START DELETION ANIMATION LOGIC --- ---

      // 1. Get the specific note card DOM element using its ID
      const noteElement = document.getElementById(`note-${id}`);

      if (noteElement) {
          // 2. Add the 'deleting' class to the element to trigger the CSS exit animation
          noteElement.classList.add('deleting');

          // 3. Define the animation duration (MUST match the animation-duration in your CSS .note-card.deleting rule)
          const animationDuration = 500; // Example: if your CSS is 0.5s, use 500ms

          // 4. Use setTimeout to wait for the animation to finish before proceeding with deletion
          setTimeout(async () => {
              // --- --- END DELETION ANIMATION LOGIC (start actual delete after delay) --- ---

              try {
                  // 5. Perform the actual DELETE API call to the backend
                  await axios.delete(`http://localhost:5000/notes/${id}`);
                  // console.log('Note deleted:', id);

                  // 6. Update frontend state by filtering out the deleted note
                  // This removes the element from the DOM *after* the animation visually completes.
                  // Filtering the state directly is often smoother for animation cleanup than a full fetch immediately.
                  setNotes(prevNotes => prevNotes.filter(note => note.id !== id));


                  // --- Clear state and validation errors on successful delete (after API call) ---
                  setSelectedTag(''); // Clear tag filter
                  // Check if the deleted note was the one being edited on the spot
                  if(editingSpotId === id) {
                      handleSpotCancel(); // Exit spot edit mode if deleting the actively edited note
                  }
                  setValidationErrors({}); // Clear errors


                  // --- Record successful DELETE action in history (AFTER successful API delete) ---
                  // Only add to history if noteBeforeDelete was successfully found earlier
                  if (noteBeforeDelete) {
                      setHistory(prevHistory => [...prevHistory, { type: 'DELETE', deletedNote: noteBeforeDelete }]);
                  }


              } catch (error) {
                  console.error('Error deleting note after animation:', error);
                  alert('Failed to delete note. See console for details.');
                  // --- Error Handling if API Fails AFTER Animation Starts ---
                  // If the deletion API call fails AFTER the animation starts, the note is visually gone but still in the backend.
                  // This requires more complex error handling. For now, we'll show an alert and try to revert the visual state.
                  noteElement.classList.remove('deleting'); // Attempt to remove the deleting class to make the note reappear visually
                  // You might also need to add the note back to the frontend state (setNotes),
                  // but this can be tricky with order and unique keys.
              }
          }, animationDuration); // The timeout duration matches the CSS animation duration

      } else {
          // --- Fallback if the element wasn't found (e.g., very fast UI update or error) ---
          // If the element isn't found in the DOM, proceed with the delete immediately without animation.
          console.error(`Note element with ID note-${id} not found for animation. Deleting immediately.`);
          try {
                // Perform the actual DELETE API call immediately
              await axios.delete(`http://localhost:5000/notes/${id}`);

              // Update state immediately since no animation played
              setNotes(prevNotes => prevNotes.filter(note => note.id !== id));

              // Clear state and validation errors immediately
              setSelectedTag('');
              if(editingSpotId === id) { handleSpotCancel(); }
              setValidationErrors({});

              // Record action immediately if noteBeforeDelete was found
              if (noteBeforeDelete) {
                  setHistory(prevHistory => [...prevHistory, { type: 'DELETE', deletedNote: noteBeforeDelete }]);
              }


          } catch (error) {
              console.error('Error deleting note without animation:', error);
              alert('Failed to delete note. See console for details.');
              // Error handling if API fails immediately
          }
      }
    };

  const handleTagClick = (tag) => {
    // Store the clicked tag name (lowercase) for filtering
    setSelectedTag(tag.toLowerCase());
    // Optional: Clear search term when filtering by tag?
    // setSearchTerm('');
  };

  const handleClearTagFilter = () => {
    setSelectedTag('');
  };

  // The getUniqueTags function is now used internally by getNumberedUniqueTags
  // We no longer need a separate function just to get unique names here for display

  // Filter and sort notes (Filtering is still based on tag names)
  const filteredNotes = notes
    .filter(note => {
      const searchMatch =
        (note.title && note.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (note.description && note.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (note.tags && note.tags.join(',').toLowerCase().includes(searchTerm.toLowerCase()));


      const tagMatch = selectedTag ? note.tags && note.tags.includes(selectedTag) : true; // selectedTag is the lowercase name

      return searchMatch && tagMatch;
    })
    .sort((a, b) => {
        if (b.pinned !== a.pinned) {
            return b.pinned ? 1 : -1;
        }
        return new Date(b.created_at) - new Date(a.created_at);
    });

    // ... existing handler functions ...

// --- New function to handle Undo ---
  const handleUndo = async () => {
    if (history.length === 0) {
        console.log("History is empty. Nothing to undo.");
        return;
    }

    // Get the last action from history WITHOUT removing it yet
    const lastAction = history[history.length - 1];

    try {
        switch (lastAction.type) {
            case 'ADD':
                // To undo an 'ADD', we DELETE the note that was added
                console.log('Undoing ADD operation for note ID:', lastAction.noteId);
                await axios.delete(`http://localhost:5000/notes/${lastAction.noteId}`);
                break;

            case 'UPDATE':
                // To undo an 'UPDATE', we PUT the note's previous state back
                console.log('Undoing UPDATE operation for note ID:', lastAction.previousNote.id);
                await axios.put(`http://localhost:5000/notes/${lastAction.previousNote.id}`, {
                    title: lastAction.previousNote.title,
                    description: lastAction.previousNote.description,
                    tags: lastAction.previousNote.tags, // stored as array
                    pinned: lastAction.previousNote.pinned,
                });
                break;

            case 'DELETE':
                // To undo a 'DELETE', we POST the deleted note back
                console.log('Undoing DELETE operation for note ID:', lastAction.deletedNote.id);
                await axios.post('http://localhost:5000/notes', {
                    title: lastAction.deletedNote.title,
                    description: lastAction.deletedNote.description,
                    tags: lastAction.deletedNote.tags, // stored as array
                    pinned: lastAction.deletedNote.pinned,
                    // Note: The backend might assign a NEW ID when re-adding.
                    // If you need to restore the original ID, your backend would need to support PUT to create with a specific ID.
                });
                break;

            default:
                console.error("Unknown action type in history:", lastAction.type);
                return; // Don't pop history for unknown actions
        }

        // If the API call was successful, remove the last action from history
        setHistory(prevHistory => prevHistory.slice(0, -1));

        // Refetch notes to update the UI after undoing the action
        fetchNotes();

    } catch (error) {
        console.error('Error performing undo:', error);
        alert('Failed to perform undo. See console for details.');
        // If the undo API call fails, you might want to keep the action in history
        // or add more sophisticated error handling/rollback.
    }
  };

  // ... rest of App component logic ...

  // ... existing handler functions (handleAdd, handleUpdate, handleDelete, handleSpotEditClick, etc.) ...

// --- New function to toggle the pinned status of a note ---
  const handleTogglePin = async (note) => {
      // Prevent toggling pin if the note is currently being edited on the spot
      if (editingSpotId === note.id) {
          console.log("Cannot toggle pin while editing on the spot.");
          // Optionally provide user feedback (e.g., a temporary message)
          alert("Please save or cancel the current edit before unpinning.");
          return;
      }

      // Determine the new pinned status (opposite of current)
      const newPinnedStatus = !note.pinned;

      try {
          // Make a PUT request to update the note
          // It's important to send all the note's data, not just the pinned status,
          // to avoid accidentally clearing other fields in the backend.
          await axios.put(`http://localhost:5000/notes/${note.id}`, {
              title: note.title, // Keep existing title
              description: note.description, // Keep existing description
              tags: note.tags, // Keep existing tags (already an array)
              pinned: newPinnedStatus, // Send the toggled pinned status
          });

          // Refetch notes to update the UI, which will also re-sort the list
          fetchNotes();

      } catch (error) {
          console.error(`Error toggling pin status for note ${note.id}:`, error);
          alert('Failed to toggle pin status. See console for details.');
          // Optionally, you might want to provide more specific error feedback
      }
  };

// ... rest of App component logic ...


  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>

      <div className="container">
        {/* --- New container for header elements --- */}
        <div className="header-area">
          {/* Your title */}
          <h1>QuickNotes</h1>
          {/* Dark Mode Toggle - Moved inside the header area */}
          {/* Dark Mode Toggle */}
          <div className="dark-mode-toggle-container">
            <label className="switch">
              <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
              <span className="slider"></span> {/* Icons will be pseudo-elements of this slider */}
            </label>
          </div>
        </div> {/* End of .header-area */}

        {/* Input Form */}
        <div className="input-group">
          {/* Title Input with Validation Feedback */}
          <div className="form-field"> {/* Optional: Wrap input and error in a div */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className={validationErrors.title ? 'input-error' : ''} // Add class if error
            />
            {validationErrors.title && ( // Display error message if it exists
              <span className="error-message">{validationErrors.title}</span>
            )}
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
          />
          {/* Pin Note Checkbox with Wrapper for Styling */}
          <div className="pin-checkbox-container">
            <input
              type="checkbox"
              id="pin-note-checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            <label htmlFor="pin-note-checkbox">
              Pin Note
            </label>
          </div>
          {/* Add/Update Button */}
          {editingNote ? (
            <button onClick={handleUpdate}>Update Note</button>
          ) : (
            <button onClick={handleAdd}>Add Note</button>
          )}
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        {/* --- Undo Button --- */}
        {/* Button is enabled only if history is not empty */}
        <button onClick={handleUndo} disabled={history.length === 0}>
          Undo
        </button>

        {/* Tags List for Filtering - Now shows numbers */}
        {numberedUniqueTags.length > 0 && (
          <div className="tags-list-container">
            <h3>Tags</h3>
            <div className="tags-list">
              {/* Map numbered unique tags to clickable spans */}
              {numberedUniqueTags.map((tagObj) => ( // Iterate over objects { name, number }
                <span
                  key={tagObj.number} // Use number as key
                  className={`tag ${selectedTag === tagObj.name ? 'selected' : ''}`} // Compare selectedTag (name) with tagObj.name
                  onClick={() => handleTagClick(tagObj.name)} // Pass tag name to handler
                >
                  {`${tagObj.number}. ${tagObj.name}`} {/* Display number and name */}
                </span>
              ))}
              {/* Clear filter button */}
              {selectedTag && (
                <button onClick={handleClearTagFilter} className="clear-filter">
                  Clear Tag Filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notes List */}
        <ul className="note-list">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note, index) => ( // index needed for animationDelay
              <li
                key={note.id}
                id={`note-${note.id}`} // --- Add unique ID here ---
                className={`note-card ${note.pinned ? 'pinned' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }} // eslint-disable-next-line no-undef
              >
                {/* --- Conditional Rendering for Spot Edit --- */}
                {note.id === editingSpotId ? (
                  /* --- Render Edit Mode Content (remains the same) --- */
                  <div className="note-card-edit">
                      {/* ... Inputs and Save/Cancel Buttons ... */}
                      <input type="text" value={spotEditTitle} onChange={(e) => setSpotEditTitle(e.target.value)} placeholder="Edit Title" className="spot-edit-input" />
                      <textarea value={spotEditDescription} onChange={(e) => setSpotEditDescription(e.target.value)} placeholder="Edit Description" className="spot-edit-textarea" />
                      <input type="text" value={spotEditTags} onChange={(e) => setSpotEditTags(e.target.value)} placeholder="Edit Tags (comma separated)" className="spot-edit-input" />

                      <div className="button-group">
                          <button onClick={() => handleSpotUpdate(note.id)}>Save</button>
                          <button onClick={handleSpotCancel}>Cancel</button>
                      </div>
                  </div>
                ) : (
                  /* --- Render Display Mode Content --- */
                  // Removed onClick from this div -> Clicking text no longer triggers edit
                  <div className="note-card-display">
                    {/* Display clickable pin icon if note is pinned (for unpinning) */}
                    {note.pinned && (
                      <button
                        className="pin-toggle-button" // Styles when pinned
                        onClick={(e) => { e.stopPropagation(); handleTogglePin(note); }}
                        aria-label="Unpin Note"
                        title="Unpin Note"
                      >
                          📌
                      </button>
                    )}

                    {/* --- Display Pin on Hover button if NOT pinned (for pinning) --- */}
                    { !note.pinned && ( // Render only if the note is NOT pinned
                      <button
                        className="pin-on-hover-button" // New class for styling
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering spot edit on the parent div
                          handleTogglePin(note); // Toggle the pin status (will set to true)
                        }}
                        aria-label="Pin Note" // Accessibility label
                        title="Pin Note" // Tooltip
                      >
                          📌 {/* The pin emoji icon */}
                      </button>
                    )}

                    {/* Container for tag holes - Displays numbers now */}
                    <div className="note-tags-holes">
                      {/* ... Tag Holes JSX ... */}
                      {note.tags && note.tags.map((tag, tagIndex) => {
                        const tagNumber = getTagNumber(tag);
                        return (
                          <span key={tagIndex} className="tag-hole" aria-label={tag}>
                            {tagNumber !== null ? tagNumber : '?'}
                          </span>
                        );
                      })}
                    </div>
                    <strong>{note.title}</strong>
                    <p>{note.description}</p>
                    <small>{new Date(note.created_at).toLocaleString()}</small>

                    {/* Original Edit and Delete Buttons */}
                    <div className="button-group" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleSpotEditClick(note)}>Edit</button>
                        <button onClick={() => handleShowDeleteConfirm(note.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </li>
            ))
          ) : (
            // Styled empty state message
            <div className="empty-state">
              <p>No notes available yet.</p>
              {/* Optional: You could add an icon here */}
              {/* Optional: You could add a button here guiding them to add one */}
            </div>
          )}
        </ul>

      </div>
      {/* --- Delete Confirmation Modal --- */}
      {/* Render the modal only if showDeleteConfirmModal is true */}
      {showDeleteConfirmModal && (
          // Overlay that covers the screen
          <div className="modal-overlay" onClick={handleCancelDelete}> {/* Click outside modal content to cancel */}
              {/* The actual modal content box */}
              <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Stop propagation so clicks inside don't close modal */}
                  <h3>Confirm Deletion</h3>
                  <p>Are you sure you want to delete this note?</p>
                  <div className="modal-buttons">
                      {/* Yes button triggers the actual deletion */}
                      <button onClick={handleConfirmDelete}>Yes, Delete</button>
                      {/* No button cancels and closes the modal */}
                      <button onClick={handleCancelDelete}>No, Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;