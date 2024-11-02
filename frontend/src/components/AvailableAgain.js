import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker"; // Importing the date picker
import "react-datepicker/dist/react-datepicker.css"; // Import CSS for the date picker
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./AvailableAgain.css";

const AvailableAgain = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [markingStatus, setMarkingStatus] = useState("");
  const [reservedSeats, setReservedSeats] = useState([]);
  const [unavailableSeats, setUnavailableSeats] = useState([]); // New state for unavailable seats
  const [bookingDate, setBookingDate] = useState(new Date());
  const [noReservedSeatsMessage, setNoReservedSeatsMessage] = useState("");

  const fetchLayouts = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/seat-layout");
      setLayouts(response.data);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      alert("Error fetching layouts. Please try again.");
    }
  };

  const fetchReservedSeats = async (date, layoutName) => {
    try {
      const formattedDate = date.toISOString().split("T")[0];
      const response = await axios.get(
        `http://localhost:8000/api/bookings/reserved-seats/${formattedDate}/${layoutName}`
      );
      const reserved = response.data.map((booking) => booking.seatId) || [];
      setReservedSeats(reserved);
      setNoReservedSeatsMessage(
        reserved.length === 0
          ? "There are no reserved seats for this date."
          : ""
      );
    } catch (error) {
      console.error("Error fetching reserved seats:", error);
      setReservedSeats([]); // Reset the reserved seats in case of an error
    }
  };

  const fetchUnavailableSeats = async (date, layoutName) => {
    try {
      const formattedDate = date.toISOString().split("T")[0];
      const response = await axios.get(
        `http://localhost:8000/api/seat-layout/unavailable-seats/${formattedDate}/${layoutName}`
      );
      const unavailable = response.data.map((seat) => seat.seatId) || [];
      setUnavailableSeats(unavailable);
    } catch (error) {
      console.error("Error fetching unavailable seats:", error);
      setUnavailableSeats([]); // Reset unavailable seats in case of an error
    }
  };

  useEffect(() => {
    fetchLayouts();
  }, []);

  useEffect(() => {
    if (selectedLayout) {
      fetchReservedSeats(bookingDate, selectedLayout.layoutName);
      fetchUnavailableSeats(bookingDate, selectedLayout.layoutName); // Fetch unavailable seats as well
    }
  }, [bookingDate, selectedLayout]);

  const handleSelectLayout = (layout) => {
    setSelectedLayout(layout);
    setSelectedSeats([]);
    setMarkingStatus("");
    setNoReservedSeatsMessage("");
    fetchReservedSeats(bookingDate, layout.layoutName);
    fetchUnavailableSeats(bookingDate, layout.layoutName); // Fetch unavailable seats for selected layout
  };

  const handleSelectSeat = (seat) => {
    if (!seat) {
      alert("This seat is not available for selection.");
      return;
    }

    // Allow selecting unavailable seats
    if (unavailableSeats.includes(seat.seatId)) {
      setSelectedSeats((prev) => {
        if (prev.includes(seat.seatId)) {
          return prev.filter((id) => id !== seat.seatId);
        } else {
          return [...prev, seat.seatId];
        }
      });
    } else {
      alert("This seat is not marked as unavailable.");
    }
  };

  const handleMarkUnavailable = async () => {
    if (selectedSeats.length === 0) {
      setMarkingStatus(
        "Please select at least one seat to delete from unavailable seats."
      );
      return;
    }

    try {
      const formattedDate = bookingDate.toISOString().split("T")[0];
      const layoutName = selectedLayout.layoutName; // Get the selected layout name
      const promises = selectedSeats.map(
        (seatId) =>
          axios.delete(
            `http://localhost:8000/api/seat-layout/unavailable-seats/${formattedDate}/${layoutName}/${seatId}`
          ) // Add layout name to the endpoint
      );

      await Promise.all(promises);

      setMarkingStatus("Made available successfully.");
      fetchReservedSeats(bookingDate, selectedLayout.layoutName);
      fetchUnavailableSeats(bookingDate, selectedLayout.layoutName); // Refresh unavailable seats
      setSelectedSeats([]);
    } catch (error) {
      console.error("Error deleting unavailable seats:", error);
      setMarkingStatus("Error deleting unavailable seats. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.button} onClick={() => navigate("/admin-lp")}>
          Dashboard
        </button>
        <h3 style={styles.sectionLabel}>Sections</h3>
      </div>

      <div style={styles.contentContainer}>
        <div style={styles.cardContainer3}>
          {layouts.map((layout) => (
            <button
              key={layout._id}
              className="card3"
              onClick={() => handleSelectLayout(layout)}
              style={{
                ...styles.card3,
                background:
                  selectedLayout?.layoutName === layout.layoutName
                    ? "linear-gradient(135deg, #5da92f, #9bd46a)"
                    : "linear-gradient(135deg, #aed1ef, #f2dfc1,#f0b9ef)",
              }}
            >
              <h4>{layout.layoutName}</h4>
            </button>
          ))}
        </div>

        <div style={styles.datePickerContainer}>
          <DatePicker
            selected={bookingDate}
            onChange={(date) => {
              setBookingDate(date);
              setReservedSeats([]); // Reset reserved seats
              setUnavailableSeats([]); // Reset unavailable seats
              if (selectedLayout) {
                fetchReservedSeats(date, selectedLayout.layoutName);
                fetchUnavailableSeats(date, selectedLayout.layoutName); // Fetch unavailable seats on date change
              }
            }}
            dateFormat="yyyy-MM-dd"
            className="date-picker"
          />
        </div>

        {selectedLayout && (
          <div style={styles.selectedLayoutContainer}>
            <h3>Selected Section: {selectedLayout.layoutName}</h3>
            <div style={styles.seatGrid}>
              {Array.from({ length: 10 }, (_, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {Array.from({ length: 10 }, (_, colIndex) => {
                    const seat = selectedLayout.seatPositions.find(
                      (s) => s.row === rowIndex && s.col === colIndex
                    );
                    const isReserved = reservedSeats.includes(seat?.seatId);
                    const isUnavailable = unavailableSeats.includes(
                      seat?.seatId
                    );
                    const isSelected = selectedSeats.includes(seat?.seatId);
                    const getSeatBackground = () => {
                      if (isUnavailable) {
                        return "radial-gradient(circle, rgba(255, 230, 204, 1) 0%, rgba(255, 165, 0, 1) 100%)";
                      }
                      if (isReserved) {
                        return "radial-gradient(circle, rgba(255, 200, 200, 1) 0%, rgba(255, 200, 200, 1) 30%, rgba(255, 0, 0, 1) 100%)";
                      }
                      if (isSelected) {
                        return "radial-gradient(circle, rgba(204, 255, 204, 1) 0%, rgba(0, 128, 0, 1) 100%)";
                      }
                      return "#fff";
                    };
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        className={`seat ${isReserved ? "reserved" : ""} ${
                          isSelected ? "selected" : ""
                        } ${isUnavailable ? "unavailable" : ""}`}
                        onClick={() => handleSelectSeat(seat)}
                        style={{
                          color: "black",
                          ...styles.seat,
                          background: getSeatBackground(), // Use the extracted function here
                          cursor: seat ? "pointer" : "not-allowed",
                          border:
                            isSelected && isUnavailable
                              ? "2px solid black"
                              : "1px solid #ccc", // Apply black border for selected unavailable seats
                        }}
                      >
                        {seat?.seatId}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            {noReservedSeatsMessage && <p>{noReservedSeatsMessage}</p>}
            {markingStatus && <p>{markingStatus}</p>}
            <button style={styles.button} onClick={handleMarkUnavailable}>
              Make Available
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Responsive styles
const styles = {
  container: {
    padding: "20px",
    maxWidth: "1200px", // Set a max width for the container
    margin: "0 auto", // Center the container
    marginTop: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: "20px",
  },
  button: {
    padding: "10px 15px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    margin: "10px 0", // Add margin for spacing
    width: "130px",
  },
  sectionLabel: {
    textAlign: "center",
    margin: "0 auto",
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  cardContainer3: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "20px",
  },
  card3: {
    textAlign: "center",
    width: "250px",
    background: "linear-gradient(135deg, #aed1ef, #f2dfc1, #f0b9ef)",
    color: "#333",
    borderRadius: "8px", // Rounded corners
    padding: "15px", // Padding for inner content
    margin: "10px", // Margin between cards
    cursor: "pointer", // Pointer cursor on hover
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
    transition: "background 0.3s ease", // Smooth transition for background
  },
  datePickerContainer: {
    margin: "20px 0",
  },
  selectedLayoutContainer: {
    marginTop: "20px",
    textAlign: "center",
  },
  seatGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(10, 1fr)",
    gap: "5px",
    margin: "10px 0",
  },
  seat: {
    width: "40px",
    height: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
};

export default AvailableAgain;
