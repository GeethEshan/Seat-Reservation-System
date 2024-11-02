import PropTypes from "prop-types";
import React from "react";

const Grid = ({ squares, onDrop, seatPositions }) => {
  const handleDrop = (e, row, col) => {
    e.preventDefault();
    const seatId = e.dataTransfer.getData("text/plain");
    onDrop(seatId, row, col);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Allow drop
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${squares}, 50px)`,
      }}
    >
      {Array.from({ length: squares * squares }, (_, index) => {
        const row = Math.floor(index / squares);
        const col = index % squares;

        // Check if this cell is occupied
        const occupiedSeat = seatPositions.find(
          (seat) => seat.row === row && seat.col === col
        );

        return (
          <button
            key={index}
            aria-label={
              occupiedSeat ? `Seat ${occupiedSeat.seatId}` : "Empty seat"
            } // Describes the seat for screen readers
            onDrop={(e) => handleDrop(e, row, col)}
            onDragOver={handleDragOver}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                // Simulates drop action for keyboard users
                handleDrop(e, row, col);
              }
            }}
            style={{
              width: "50px",
              height: "50px",
              border: "1px solid #ccc",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: occupiedSeat ? "lightblue" : "white",
              cursor: "pointer", // Indicates interactivity
              outline: "none", // Optionally style focus state
            }}
          >
            {occupiedSeat ? `Seat ${occupiedSeat.seatId}` : ""}
          </button>
        );
      })}
    </div>
  );
};
Grid.propTypes = {
  squares: PropTypes.arrayOf(PropTypes.array).isRequired, // Expecting a 2D array
  onDrop: PropTypes.func.isRequired, // Expecting a function
  seatPositions: PropTypes.arrayOf(PropTypes.array).isRequired, // Expecting a 2D array
};
export default Grid;
