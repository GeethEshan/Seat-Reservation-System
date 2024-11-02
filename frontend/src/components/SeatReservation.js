import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./SeatReservation.css";
import logo from "../images/logo.png";

const SeatReservation = () => {
  const [days, setDays] = useState([]);
  const [availableSeats, setAvailableSeats] = useState({}); // Store available seats data per date
  const [holidays, setHolidays] = useState([]); // Store holidays data
  const navigate = useNavigate();

  const updateWeekdays = useCallback(() => {
    const newDays = [];
    let currentDate = new Date();

    while (newDays.length < 5) {
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
        newDays.push({
          date: currentDate.toISOString().split("T")[0],
          label: `${currentDate.toLocaleDateString("en-US", {
            weekday: "long",
          })} - ${currentDate.toLocaleDateString("en-GB")}`,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setDays(newDays);
  }, []);

  useEffect(() => {
    updateWeekdays();
  }, [updateWeekdays]);

  // Fetch available seats for the selected date
  const fetchAvailableSeats = async (date) => {
    try {
      const response = await fetch(`http://localhost:8000/api/seat-layout/available-seats?date=${date}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("Fetched available seats data:", data); // Log the fetched data
      setAvailableSeats(prev => ({ ...prev, [date]: data })); // Store data for the specific date
    } catch (error) {
      console.error("Failed to fetch available seats:", error);
    }
  };

  // Fetch holidays from the database
  const fetchHolidays = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/bookings/holiday2");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setHolidays(data); // Store the fetched holidays
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
    }
  };

  // Fetch available seats for all dates after they are set
  useEffect(() => {
    days.forEach(day => {
      fetchAvailableSeats(day.date);
    });
  }, [days]); // Only run this effect when 'days' changes

  // Fetch holidays when the component mounts
  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleContinueClick = (day) => {
    navigate(`/layout-viewer?date=${day.date}`);
  };

  return (
    <div className="reservation-container">
      <div className="top-bar">
        <div className="navbar">
          <img src={logo} alt="Logo" className="logo" />
          <nav className="nav-items">
            <button onClick={() => navigate("/landing-page")}>Home</button>
            <button onClick={() => navigate("/my-reservations")}>Bookings</button>
            <button onClick={() => navigate("/user-profile-update")}>Profile</button>
          </nav>
        </div>
      </div>
      <h2 className="reservation-title">Select Your Reservation Date</h2>
      <div className="reservation-grid">
        {days.map((day) => (
          <div key={day.date} className="reservation-card">
            <div className="date">
              <span className="weekday" style={{ fontWeight: 'bold' }}>
                {day.label.split(" - ")[0]}
              </span>
              <span className="date-value" style={{ fontWeight: 'bold' }}>
                {day.label.split(" - ")[1]}
              </span>
            </div>

            {/* Check if the day is a holiday */}
            {holidays.some(holiday => {
              const holidayDate = new Date(holiday.date).toISOString().split("T")[0];
              return holidayDate === day.date;
            }) ? (
              // Display holiday message if it's a holiday
              <div className="holiday-message" style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                height: '100%', // Full height of the card
                fontSize: '20px', // Larger font size
                fontWeight: 'bold', // Bold font
                textAlign: 'center', // Center align text
                marginTop: '70px' // Optional: Adjust top margin if needed
              }}>
                {holidays.find(holiday => {
                  const holidayDate = new Date(holiday.date).toISOString().split("T")[0];
                  return holidayDate === day.date;
                }).message}
              </div>
            ) : (
              <>
                <h3>Remaining Seats</h3>
                {/* Display available seats info for the specific date */}
                {availableSeats[day.date] && (
                  <div className="available-seats-info">
                    {availableSeats[day.date].map((layout) => (
                      <div key={layout.layoutName}>
                        <span>{layout.layoutName}: </span>
                        <span>{layout.availableSeats} </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="continue-button"
                  onClick={() => handleContinueClick(day)}
                  style={{
                    backgroundColor: '#87CEFA', // Slightly darker blue color
                    marginTop: '10px',
                    color: 'black',              // Text color
                    padding: '10px 20px',        // Padding for the button
                    border: 'none',              // No border
                    borderRadius: '5px',         // Rounded corners
                    cursor: 'pointer',           // Cursor style on hover
                    fontSize: '16px',            // Font size
                    transition: 'background-color 0.3s', // Smooth transition on hover
                  }}
                >
                  Continue
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatReservation;
