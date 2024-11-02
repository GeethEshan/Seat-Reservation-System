import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import SeatIcon from "./SeatIcon";
import Grid from "./Grid";
import "./SeatLayout.css"; // Import the CSS file for styles

const SeatLayout = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [totalSeats, setTotalSeats] = useState(0);
  const [seatPositions, setSeatPositions] = useState([]); // Array of { seatId, row, col }
  const [squares] = useState(10); // Define the grid size (10x10)
  const [layoutName, setLayoutName] = useState(""); // Layout name for saving
  const [layouts, setLayouts] = useState([]); // Array to hold all layouts
  const [selectedLayout, setSelectedLayout] = useState(null); // Layout currently being edited
  const [isEditing, setIsEditing] = useState(false); // Track editing state

  const handleSeatChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setTotalSeats(isNaN(value) ? 0 : Math.min(value, 100)); // Limit total seats to a maximum of 100
    setSeatPositions([]); // Reset seat positions when total seats change
  };

  const handleDrop = (seatId, row, col) => {
    setSeatPositions((prev) => {
      const cellOccupied = prev.find(
        (seatPos) => seatPos.row === row && seatPos.col === col
      );

      if (cellOccupied) {
        alert(`Cell (${row}, ${col}) is already occupied by Seat ${cellOccupied.seatId}`);
        return prev; // Do not update state if cell is occupied
      }

      const existingSeat = prev.find((seatPos) => seatPos.seatId === parseInt(seatId));
      if (existingSeat) {
        return prev.map((seat) =>
          seat.seatId === parseInt(seatId)
            ? { seatId: parseInt(seatId), row, col } // Update position
            : seat
        );
      }

      return [...prev, { seatId: parseInt(seatId), row, col }]; // Ensure seatId is stored as an integer
    });
  };

  const saveLayout = async () => {
    if (!layoutName) {
      alert("Please enter a layout name before saving.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/seat-layout/saveLayout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layoutName,
          seatPositions,
        }),
      });

      if (response.ok) {
        alert("Layout saved successfully!");
        setSeatPositions([]); // Clear seat positions after saving
        setTotalSeats(0); // Reset total seats
        setLayoutName(""); // Reset layout name
        fetchLayouts(); // Refresh the layouts list
      } else {
        alert("Failed to save layout.");
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      alert("Error saving layout. Please try again.");
    }
  };

  const fetchLayouts = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/seat-layout");
      const data = await response.json();
      setLayouts(data);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      alert("Error fetching layouts. Please try again.");
    }
  };

  const handleUpdateLayout = async () => {
    if (!selectedLayout || !layoutName) {
      alert("Please select a layout and enter a layout name before updating.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/seat-layout/${selectedLayout._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layoutName,
          seatPositions,
        }),
      });

      if (response.ok) {
        alert("Layout updated successfully!");
        fetchLayouts(); // Refresh the layouts list
        resetForm(); // Reset the form fields after updating
      } else {
        alert("Failed to update layout.");
      }
    } catch (error) {
      console.error("Error updating layout:", error);
      alert("Error updating layout. Please try again.");
    }
  };

  const handleDeleteLayout = async (layoutId) => {
    if (window.confirm("Are you sure you want to delete this layout?")) {
      try {
        const response = await fetch(`http://localhost:8000/api/seat-layout/${layoutId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Layout deleted successfully!");
          fetchLayouts(); // Refresh the layouts list
        } else {
          alert("Failed to delete layout.");
        }
      } catch (error) {
        console.error("Error deleting layout:", error);
        alert("Error deleting layout. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setSelectedLayout(null); // Clear selected layout
    setSeatPositions([]); // Clear seat positions after updating
    setTotalSeats(0); // Reset total seats
    setLayoutName(""); // Reset layout name
    setIsEditing(false); // Reset editing state
  };

  useEffect(() => {
    fetchLayouts(); // Fetch layouts on component mount
  }, []);

  const handleSelectLayout = (layout) => {
    setSelectedLayout(layout);
    setLayoutName(layout.layoutName);
    setSeatPositions(layout.seatPositions); // Populate seat positions for editing
    setTotalSeats(layout.seatPositions.length); // Set total seats based on existing layout
    setIsEditing(true); // Enable editing mode
  };

  const availableSeats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  return (
    <div className="seat-layout-container">
      <button 
        className="dashboard-button" 
        onClick={() => navigate('/admin-dashboard')} // Navigate to admin-dashboard on click
      >
        Dashboard
      </button>

      <h1>Seat Layout Designer</h1>

      {/* Table for Existing Layouts and Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        <table style={{ borderCollapse: 'collapse', width: '80%', backgroundColor: 'lightgrey' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px', border: '1px solid #ccc', backgroundColor: "#cccccc" }}>Existing Layouts</th>
              <th style={{ padding: '10px', border: '1px solid #ccc',backgroundColor: "#cccccc" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {layouts.map((layout) => (
              <tr key={layout._id}>
                <td onClick={() => handleSelectLayout(layout)} style={{ padding: '10px', border: '1px solid #ccc', cursor: 'pointer' }}>
                  {layout.layoutName}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                  <div className="action-buttons">
                    <button onClick={() => handleSelectLayout(layout)}>Edit</button>
                    <button onClick={() => handleDeleteLayout(layout._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="create-new-layout-heading">Create New Layout</h2>
      <div className="input-container">
        <div className="input-row">
          <div className="total-seats-container">
            <label htmlFor="totalSeats">Total Seats (max 100): </label>
            <input
              type="number"
              id="totalSeats"
              value={totalSeats}
              onChange={handleSeatChange}
              min="1"
              max="100"
            />
          </div>

          <div className="layout-name-container">
            <label htmlFor="layoutName">Layout Name: </label>
            <input
              type="text"
              id="layoutName"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="layout-container">
        <div className="drag-seats">
          <h3>Drag Seats:</h3>
          <div className="seat-icons">
            {availableSeats.map((seatId) => {
              const isOccupied = seatPositions.some((seat) => seat.seatId === seatId);
              return <SeatIcon key={seatId} id={seatId} isOccupied={isOccupied} />;
            })}
          </div>
        </div>

        <div className="grid-layout">
          <h3>Grid Layout:</h3>
          <Grid squares={squares} seatPositions={seatPositions} onDrop={handleDrop} />
        </div>
      </div>

      <div className="submit-container">
      <button
  onClick={isEditing ? handleUpdateLayout : saveLayout}
  style={{
    backgroundColor: isEditing ? '#4CAF50' : '#008CBA', // Green for Update, Blue for Save
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    marginRight: '10px', // Spacing between buttons if added to a container
    cursor: 'pointer',
    borderRadius: '5px', // Rounded corners
    transition: 'background-color 0.3s', // Smooth background color transition
  }}
>
  {isEditing ? "Update Layout" : "Save Layout"}
</button>

      </div>
    </div>
  );
};

export default SeatLayout;
