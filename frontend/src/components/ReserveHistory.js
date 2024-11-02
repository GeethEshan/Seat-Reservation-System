import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import PropTypes from "prop-types";

// LayoutViewer component
const LayoutViewer = ({ onSelectLayout, onNavigate }) => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState(null); // State for selected layout ID

  const fetchLayouts = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/seat-layout");
      setLayouts(response.data);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      alert("Error fetching layouts. Please try again.");
    }
  };

  useEffect(() => {
    fetchLayouts();
  }, []);

  const handleCardClick = (layoutId, layoutName) => {
    setSelectedLayoutId(layoutId); // Set selected layout ID
    onSelectLayout(layoutName);
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <button
          style={styles.dashboardButton3}
          onClick={onNavigate} // Navigate to admin-lp on button click
        >
          Dashboard
        </button>
        <h3 style={styles.sectionsLabel}>Sections</h3>
      </div>
      <div style={styles.contentContainer}>
        <div style={styles.subNavBar}>
          <div style={styles.cardContainer4}>
            {layouts.map((layout) => (
              <button
                key={layout._id}
                className="card4"
                aria-pressed={selectedLayoutId === layout._id} // Communicates whether the card is selected
                style={{
                  ...styles.card4,
                  background:
                    selectedLayoutId === layout._id
                      ? "linear-gradient(135deg, #5da92f, #9bd46a)"
                      : "linear-gradient(135deg, #aed1ef, #f2dfc1, #f0b9ef)",
                }}
                onClick={() => handleCardClick(layout._id, layout.layoutName)} // Handles the card click event
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleCardClick(layout._id, layout.layoutName); // Enables keyboard navigation using Enter or Space
                  }
                }}
                aria-label={`Select layout ${layout.layoutName}`} // Provides a description for screen readers
              >
                <h4>{layout.layoutName}</h4>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ReserveHistory component
const ReserveHistory = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLayout, setSelectedLayout] = useState(""); // State for selected layout
  const [historyData, setHistoryData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(7);

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchHistory = async (date, layoutName) => {
      if (layoutName) {
        try {
          const response = await axios.get(
            `http://localhost:8000/api/bookings/history/${date}/${layoutName}`
          );
          setHistoryData(response.data || []);
        } catch (error) {
          console.error("Error fetching reserve history:", error);
          setHistoryData([]);
        }
      }
    };

    const currentDate = new Date().toISOString().split("T")[0];
    setSelectedDate(currentDate);
    setSelectedLayout(""); // Reset layout on date change
    fetchHistory(currentDate, selectedLayout);
  }, [selectedLayout]); // Fetch history when selected layout changes

  const handleCheckboxChange = async (id, attended) => {
    try {
      await axios.patch(
        `http://localhost:8000/api/bookings/update-attendance/${id}`,
        { attended }
      );
      setHistoryData((prevData) =>
        prevData.map((entry) =>
          entry._id === id ? { ...entry, attended } : entry
        )
      );
    } catch (error) {
      console.error("Error updating attendance:", error);
      alert("Failed to update attendance. Please try again.");
    }
  };

  // Pagination logic
  const currentRecords = historyData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );
  const totalPages = Math.ceil(historyData.length / recordsPerPage);

  const goToNextPage = () =>
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  const goToPreviousPage = () =>
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));

  const navigateToAdmin = () => {
    navigate("/admin-lp"); // Navigate to the admin-lp page
  };

  return (
    <div className="reserve-history">
      <LayoutViewer
        onSelectLayout={setSelectedLayout}
        onNavigate={navigateToAdmin}
      />{" "}
      {/* Pass the navigate function */}
      <div className="header-info" style={styles.headerInfo}>
        <h1 className="reserved-title">Those Who Have Reserved A Seat For :</h1>
        <div className="current-date" style={styles.currentDate}>
          <strong>{selectedDate}</strong>
        </div>
      </div>
      <div className="content">
        <table className="history-table" style={styles.historyTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>NIC No</th>
              <th>Contact No</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((entry) => (
                <tr key={entry._id}>
                  <td>{entry.userName}</td>
                  <td>{entry.userNicNo}</td>
                  <td>{entry.userContactNo}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={entry.attended}
                      onChange={() =>
                        handleCheckboxChange(entry._id, !entry.attended)
                      }
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">
                  No data available for the selected date and layout
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            {currentPage > 1 && (
              <button className="pagination-button" onClick={goToPreviousPage}>
                Previous
              </button>
            )}
            <span className="pagination-text" style={{ color: "black" }}>
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <button className="pagination-button" onClick={goToNextPage}>
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: "20px",
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "20px",
  },
  headerInfo: {
    textAlign: "center",
    width: "100%",
    marginBottom: "20px",
  },
  currentDate: {
    fontSize: "1.2em",
  },
  subNavBar: {
    margin: "20px 0",
  },
  subNavTitle: {
    fontSize: "1.5em",
  },
  cardContainer4: {
    display: "flex",
    width: "900px",
    justifyContent: "center",
    gap: "10px",
  },
  card4: {
    textAlign: "center", // Center text
    width: "250px", // Set width
    background: "linear-gradient(135deg, #aed1ef, #f2dfc1, #f0b9ef)", // Background gradient
    color: "#333", // Text color
    borderRadius: "8px", // Rounded corners
    padding: "15px", // Padding for inner content
    margin: "10px", // Margin between cards
    cursor: "pointer", // Pointer cursor on hover
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
    transition: "background 0.3s ease", // Smooth transition for background
  },

  dashboardButton3: {
    padding: "10px 15px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    margin: "10px 0", // Add margin for spacing
    width: "130px",
  },
  sectionsLabel: {
    textAlign: "center", // Center the text horizontally
    margin: "20px 0", // Optional: add some vertical spacing
    fontSize: "1.5em", // Optional: increase font size for better visibility
    fontWeight: "bold", // Optional: make it bold for emphasis
  },
  historyTable: {
    width: "90%", // Adjusted for better responsiveness
    maxWidth: "1000px",
    margin: "0 auto",
    borderCollapse: "collapse",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    overflowX: "auto",
    color: "white",
  },
};
LayoutViewer.propTypes = {
  onSelectLayout: PropTypes.func.isRequired, // Expecting a function
  onNavigate: PropTypes.func.isRequired, // Expecting a function
};
export default ReserveHistory;
