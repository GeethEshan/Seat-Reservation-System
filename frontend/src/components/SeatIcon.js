import PropTypes from "prop-types";
import React from "react";

const SeatIcon = ({ id, isOccupied }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", id);
  };

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleDragStart(e); // Enable dragging with the keyboard
        }
      }}
      style={{
        width: "40px",
        height: "40px",
        backgroundColor: isOccupied ? "red" : "lightgreen", // Change color based on occupancy
        border: "1px solid #000",
        margin: "5px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "move",
      }}
      aria-label={`Seat ${id} is ${isOccupied ? "occupied" : "available"}`} // Provide a description for screen readers
    >
      {`Seat ${id}`}
    </button>
  );
};

SeatIcon.propTypes = {
  id: PropTypes.string.isRequired, // Expecting id to be a required string
  isOccupied: PropTypes.bool.isRequired, // Expecting isOccupied to be a required boolean
};

export default SeatIcon;
