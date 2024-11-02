import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker"; // Importing the date picker
import "react-datepicker/dist/react-datepicker.css"; // Import CSS for the date picker
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom
import "./AdminDashboard.css"; // Import CSS for styles

const LayoutViewer = () => {
  const navigate = useNavigate(); // Initialize navigate function
  const [layoutsAD, setLayoutsAD] = useState([]);
  const [selectedLayoutAD, setSelectedLayoutAD] = useState(null);
  const [selectedSeatsAD, setSelectedSeatsAD] = useState([]);
  const [markingStatusAD, setMarkingStatusAD] = useState("");
  const [reservedSeatsAD, setReservedSeatsAD] = useState([]);
  const [unavailableSeatsAD, setUnavailableSeatsAD] = useState([]);
  const [bookingDateAD, setBookingDateAD] = useState(new Date());
  const [noReservedSeatsMessageAD, setNoReservedSeatsMessageAD] = useState("");

  const fetchLayoutsAD = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/seat-layout");
      setLayoutsAD(response.data);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      alert("Error fetching layouts. Please try again.");
    }
  };

  const fetchReservedSeatsAD = async (date, layoutName) => {
    try {
      const formattedDate = date.toISOString().split("T")[0];
      const response = await axios.get(
        `http://localhost:8000/api/bookings/reserved-seats/${formattedDate}/${layoutName}`
      );
      const reserved = response.data.map((booking) => booking.seatId) || [];
      setReservedSeatsAD(reserved);
      setNoReservedSeatsMessageAD(
        reserved.length === 0
          ? "There are no reserved seats for this date."
          : ""
      );
    } catch (error) {
      console.error("Error fetching reserved seats:", error);
      setReservedSeatsAD([]);
    }
  };

  const fetchUnavailableSeatsAD = async (date, layoutName) => {
    try {
      const formattedDate = date.toISOString().split("T")[0];
      const response = await axios.get(
        `http://localhost:8000/api/seat-layout/unavailable-seats/${formattedDate}/${layoutName}`
      );
      const unavailable = response.data.map((seat) => seat.seatId) || [];
      setUnavailableSeatsAD(unavailable);
    } catch (error) {
      console.error("Error fetching unavailable seats:", error);
      setUnavailableSeatsAD([]);
    }
  };

  useEffect(() => {
    fetchLayoutsAD();
  }, []);

  useEffect(() => {
    if (selectedLayoutAD) {
      fetchReservedSeatsAD(bookingDateAD, selectedLayoutAD.layoutName);
      fetchUnavailableSeatsAD(bookingDateAD, selectedLayoutAD.layoutName);
    }
  }, [bookingDateAD, selectedLayoutAD]);

  const handleSelectLayoutAD = (layout) => {
    setSelectedLayoutAD(layout);
    setSelectedSeatsAD([]);
    setMarkingStatusAD("");
    setNoReservedSeatsMessageAD("");
    fetchReservedSeatsAD(bookingDateAD, layout.layoutName);
    fetchUnavailableSeatsAD(bookingDateAD, layout.layoutName);
  };

  const handleSelectSeat = (seat) => {
    if (!seat) {
      alert("This seat is not available for selection.");
      return;
    }

    if (reservedSeatsAD.includes(seat.seatId)) {
      alert("This seat is already reserved and cannot be selected.");
      return;
    }

    setSelectedSeatsAD((prev) => {
      if (prev.includes(seat.seatId)) {
        return prev.filter((id) => id !== seat.seatId);
      } else {
        return [...prev, seat.seatId];
      }
    });
  };

  const handleMarkUnavailable = async () => {
    if (selectedSeatsAD.length === 0) {
      setMarkingStatusAD(
        "Please select at least one seat to mark as unavailable."
      );
      return;
    }

    try {
      const formattedDate = bookingDateAD.toISOString().split("T")[0];
      const promises = selectedSeatsAD.map((seatId) =>
        axios.post("http://localhost:8000/api/seat-layout/unavailable-seats", {
          date: formattedDate,
          seatId,
          layoutName: selectedLayoutAD.layoutName,
        })
      );

      await Promise.all(promises);

      setMarkingStatusAD(
        "Selected seats marked as temporarily unavailable successfully."
      );
      fetchReservedSeatsAD(bookingDateAD, selectedLayoutAD.layoutName);
      fetchUnavailableSeatsAD(bookingDateAD, selectedLayoutAD.layoutName);
      setSelectedSeatsAD([]);
    } catch (error) {
      console.error("Error marking seats as unavailable:", error);
      setMarkingStatusAD(
        "Error marking seats as unavailable. Please try again."
      );
    }
  };

  return (
    <div className="container">
      <div className="content-container">
        <div className="header">
          <button
            onClick={() => navigate("/admin-lp")}
            className="dashboard-button1"
          >
            Dashboard
          </button>
          <h3 className="sub-nav-title">Sections</h3>
        </div>

        <div className="card-container2">
          {layoutsAD.map((layout) => (
            <button
              key={layout._id}
              className="card2"
              onClick={() => handleSelectLayoutAD(layout)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelectLayoutAD(layout);
                }
              }}
              style={{
                background:
                  selectedLayoutAD?.layoutName === layout.layoutName
                    ? "linear-gradient(135deg, #5da92f, #9bd46a)"
                    : "linear-gradient(135deg, #aed1ef, #f2dfc1,#f0b9ef)",
                cursor: "pointer", // Optional for better UX
              }}
            >
              <h4>{layout.layoutName}</h4>
            </button>
          ))}
        </div>

        <div className="date-picker-container">
          <DatePicker
            selected={bookingDateAD}
            onChange={(date) => {
              setBookingDateAD(date);
              setReservedSeatsAD([]);
              setUnavailableSeatsAD([]);
              if (selectedLayoutAD) {
                fetchReservedSeatsAD(date, selectedLayoutAD.layoutName);
                fetchUnavailableSeatsAD(date, selectedLayoutAD.layoutName);
              }
            }}
            dateFormat="yyyy-MM-dd"
            className="date-picker"
          />
          <button
            onClick={() => navigate("/date-manager")}
            style={{
              marginLeft: "10px",
              padding: "8px 12px",
              backgroundColor: "#5da92f",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Holidays
          </button>
        </div>

        {selectedLayoutAD && (
          <div className="selected-layout-container">
            <h3>Selected Section: {selectedLayoutAD.layoutName}</h3>
            <div className="seat-grid">
              {Array.from({ length: 10 }, (_, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {Array.from({ length: 10 }, (_, colIndex) => {
                    const seat = selectedLayoutAD.seatPositions.find(
                      (s) => s.row === rowIndex && s.col === colIndex
                    );
                    const isReserved = reservedSeatsAD.includes(seat?.seatId);
                    const isUnavailable = unavailableSeatsAD.includes(
                      seat?.seatId
                    );
                    const isSelected = selectedSeatsAD.includes(seat?.seatId);
                    const getBackgroundStyle = () => {
                      if (isUnavailable) {
                        return "radial-gradient(circle, rgba(255, 230, 204, 1) 0%, rgba(255, 165, 0, 1) 100%)";
                      } else if (isReserved) {
                        return "radial-gradient(circle, rgba(255, 200, 200, 1) 0%, rgba(255, 200, 200, 1) 30%, rgba(255, 0, 0, 1) 100%)";
                      } else if (isSelected) {
                        return "radial-gradient(circle, rgba(204, 255, 204, 1) 0%, rgba(0, 128, 0, 1) 100%)";
                      } else {
                        return "#fff";
                      }
                    };

                    // Determine cursor style based on seat availability
                    const cursorStyle =
                      seat && !isUnavailable ? "pointer" : "not-allowed";

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        className={`seat ${isReserved ? "reserved" : ""} ${
                          isSelected ? "selected" : ""
                        } ${isUnavailable ? "unavailable" : ""}`}
                        onClick={() => !isUnavailable && handleSelectSeat(seat)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            !isUnavailable && handleSelectSeat(seat);
                          }
                        }}
                        style={{
                          background: getBackgroundStyle(),
                          cursor: cursorStyle,
                        }}
                      >
                        {seat?.seatId}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="marking-status">
              {markingStatusAD && <p>{markingStatusAD}</p>}
            </div>
            <button
              onClick={handleMarkUnavailable}
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Mark as Unavailable
            </button>
            <p style={{ color: "red" }}>{noReservedSeatsMessageAD}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutViewer;
