import React, { useState, useEffect } from "react";
import "./DateManager.css"; // Import your CSS styles for the card

const DateManager = () => {
  const [weekdays, setWeekdays] = useState([]);
  const [holidays, setHolidays] = useState([]); // State to store holidays
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false); // New state for delete modal
  const [selectedDay, setSelectedDay] = useState(null);
  const [message, setMessage] = useState("");

  // Fetch weekdays
  const updateWeekdays = () => {
    const newWeekdays = [];
    let currentDate = new Date();

    while (newWeekdays.length < 10) {
      const dayOfWeek = currentDate.getDay();

      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        newWeekdays.push({
          date: currentDate.toISOString().split("T")[0], // YYYY-MM-DD format
          label: `${currentDate.toLocaleDateString("en-US", {
            weekday: "long",
          })} - ${currentDate.toLocaleDateString("en-GB")}`,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setWeekdays(newWeekdays);
  };

  // Fetch holidays from backend
  const fetchHolidays = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/bookings/holiday2"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch holidays");
      }

      const holidayData = await response.json();
      setHolidays(holidayData); // Store holidays in state
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  // Handle card click
  const handleCardClick = (day) => {
    setSelectedDay(day);
    if (isHoliday(day)) {
      setIsDeleteModal(true); // Open delete modal if it's a holiday
    } else {
      setIsModalOpen(true); // Open message modal for weekdays
    }
  };

  // Handle disable click (for adding holidays)
  const handleDisableClick = async () => {
    if (!selectedDay || !message) {
      alert("Please select a day and enter a message.");
      return;
    }

    const holidayData = {
      date: selectedDay.date, // Make sure the date is in the correct format
      message: message,
    };

    try {
      const response = await fetch(
        "http://localhost:8000/api/bookings/holiday",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(holidayData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to disable date");
      }

      const data = await response.json();
      console.log(data.message);
      setIsModalOpen(false);
      setMessage("");
      updateWeekdays();
      fetchHolidays(); // Refresh holidays after adding one
    } catch (error) {
      console.error("Error disabling date:", error);
      alert("There was an error adding the holiday. Please try again.");
    }
  };

  // Handle delete click
  const handleDeleteClick = async () => {
    if (!selectedDay) return; // Ensure a day is selected

    try {
      const response = await fetch(
        `http://localhost:8000/api/bookings/holiday/${selectedDay.date}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete holiday");
      }

      fetchHolidays(); // Refresh holidays after deleting one
      setIsDeleteModal(false); // Close the delete modal
      setSelectedDay(null); // Reset selected day
    } catch (error) {
      console.error("Error deleting holiday:", error);
      alert("There was an error deleting the holiday. Please try again.");
    }
  };

  // Handle modal cancel click
  const handleCancelClick = () => {
    setIsModalOpen(false);
    setIsDeleteModal(false);
    setMessage("");
  };

  // Effect to update weekdays and fetch holidays on mount
  useEffect(() => {
    updateWeekdays();
    fetchHolidays();
  }, []);

  // Check if the current day is a holiday
  const isHoliday = (day) => {
    return holidays.some(
      (holiday) =>
        new Date(holiday.date).toISOString().split("T")[0] === day.date
    );
  };

  return (
    <div className="date-manager-container">
      <h2 className="date-manager-title">Next Five Weekdays</h2>
      <div className="date-manager-grid">
        {weekdays.map((day) => (
          <button
            key={day.date}
            className="date-card"
            onClick={() => handleCardClick(day)}
            style={{
              backgroundColor: isHoliday(day) ? "#ff9999" : "white", // Set red color for holidays
            }}
          >
            <div className="date-info">
              <span className="weekday-label" style={{ fontWeight: "bold" }}>
                {day.label.split(" - ")[0]}
              </span>
              <span className="date-value" style={{ fontWeight: "bold" }}>
                {day.label.split(" - ")[1]}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Modal for adding holidays */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Message for {selectedDay.label}</h3>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              className="message-input"
            />
            <div className="modal-buttons">
              <button
                className="disable-button"
                onClick={handleDisableClick}
                style={{
                  backgroundColor: "#ff6347", // Tomato color
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  marginRight: "10px", // Add margin between buttons
                }}
              >
                Disable
              </button>
              <button
                className="cancel-button"
                onClick={handleCancelClick}
                style={{
                  backgroundColor: "#ccc", // Light gray color
                  color: "black",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for deleting holidays */}
      {isDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Delete Holiday for {selectedDay.label}?</h3>
            <p>Are you sure you want to delete this holiday?</p>
            <div className="modal-buttons">
              <button
                className="delete-button"
                onClick={handleDeleteClick}
                style={{
                  backgroundColor: "#ff6347", // Tomato color for delete button
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  marginRight: "10px", // Add margin between buttons
                }}
              >
                Delete
              </button>
              <button
                className="cancel-button"
                onClick={handleCancelClick}
                style={{
                  backgroundColor: "#ccc", // Light gray color
                  color: "black",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateManager;
