import React, { useEffect, useState } from "react";
import "./Report.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { CSVLink } from "react-csv";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./AdminDashboard.module.css"; // Import the module CSS
import PropTypes from "prop-types";

const LayoutViewer = ({ onSelectLayout, selectedLayout }) => {
  const [layouts, setLayouts] = useState([]);

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

  return (
    <div style={layoutStyles.cardContainer}>
      {layouts.map((layout) => (
        <button
          key={layout._id}
          className="card"
          aria-pressed={selectedLayout === layout.layoutName} // Indicates selection state for screen readers
          style={{
            ...layoutStyles.card,
            background:
              selectedLayout === layout.layoutName
                ? "linear-gradient(135deg, #5da92f, #9bd46a)"
                : "linear-gradient(135deg, #aed1ef, #f2dfc1, #f0b9ef)",
          }}
          onClick={() => onSelectLayout(layout.layoutName)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onSelectLayout(layout.layoutName); // Enable selection with Enter or Space keys
            }
          }}
          aria-label={`Select layout ${layout.layoutName}`} // Screen reader description
        >
          <h4>{layout.layoutName}</h4>
        </button>
      ))}
    </div>
  );
};

const layoutStyles = {
  cardContainer: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap", // Allows wrapping of cards to next line
    marginBottom: "20px",
  },
  card: {
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    textAlign: "center",
    width: "150px",
    minWidth: "120px", // Ensures minimum width on smaller screens
  },
};

const Report = () => {
  const [allBooking, setAllBooking] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(""); // New state for selected layout
  const [presentPage, setPresentPage] = useState(0);
  const [absentPage, setAbsentPage] = useState(0);
  const recordsPerPage = 4; // Set records per page

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/bookings/bookings/all"
      );
      const bookings = await response.json();
      setAllBooking(bookings);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setPresentPage(0);
    setAbsentPage(0);
  };

  const normalizeDate = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const presentBookings = [];
    const absentBookings = [];

    allBooking.forEach((booking) => {
      const normalizedSelectedDate = normalizeDate(selectedDate);
      const normalizedBookingDate = normalizeDate(booking.bookingDate);

      if (
        normalizedSelectedDate &&
        normalizedSelectedDate.getTime() === normalizedBookingDate.getTime() &&
        booking.layoutName === selectedLayout // Filter by layout name
      ) {
        if (booking.attended) {
          presentBookings.push([
            booking.userName,
            booking.userEmail,
            booking.userContactNo,
            "Present",
          ]);
        } else {
          absentBookings.push([
            booking.userName,
            booking.userEmail,
            booking.userContactNo,
            "Absent",
          ]);
        }
      }
    });

    doc.text("Attendance Report", 14, 10);
    doc.text("Present", 14, 20);
    doc.autoTable({
      head: [["Name", "Email", "Contact No", "Attendance"]],
      body: presentBookings,
      startY: 25,
    });

    doc.text("Absent", 14, doc.lastAutoTable.finalY + 10);
    doc.autoTable({
      head: [["Name", "Email", "Contact No", "Attendance"]],
      body: absentBookings,
      startY: doc.lastAutoTable.finalY + 15,
    });

    doc.save("Attendance_Report.pdf");
  };

  const csvData = [
    ["Name", "Email", "Contact No", "Attendance"],
    ...allBooking
      .filter((booking) => {
        const normalizedSelectedDate = normalizeDate(selectedDate);
        const normalizedBookingDate = normalizeDate(booking.bookingDate);
        return (
          normalizedSelectedDate &&
          normalizedSelectedDate.getTime() ===
            normalizedBookingDate.getTime() &&
          booking.layoutName === selectedLayout // Filter by layout name
        );
      })
      .map((booking) => [
        booking.userName,
        booking.userEmail,
        booking.userContactNo,
        booking.attended ? "Present" : "Absent",
      ]),
  ];

  const filteredPresentBookings = allBooking.filter((booking) => {
    const normalizedSelectedDate = normalizeDate(selectedDate);
    const normalizedBookingDate = normalizeDate(booking.bookingDate);
    return (
      normalizedSelectedDate &&
      normalizedSelectedDate.getTime() === normalizedBookingDate.getTime() &&
      booking.layoutName === selectedLayout && // Filter by layout name
      booking.attended
    );
  });

  const filteredAbsentBookings = allBooking.filter((booking) => {
    const normalizedSelectedDate = normalizeDate(selectedDate);
    const normalizedBookingDate = normalizeDate(booking.bookingDate);
    return (
      normalizedSelectedDate &&
      normalizedSelectedDate.getTime() === normalizedBookingDate.getTime() &&
      booking.layoutName === selectedLayout && // Filter by layout name
      !booking.attended
    );
  });

  const presentStartIndex = presentPage * recordsPerPage;
  const presentEndIndex = presentStartIndex + recordsPerPage;
  const presentRecords = filteredPresentBookings.slice(
    presentStartIndex,
    presentEndIndex
  );

  const absentStartIndex = absentPage * recordsPerPage;
  const absentEndIndex = absentStartIndex + recordsPerPage;
  const absentRecords = filteredAbsentBookings.slice(
    absentStartIndex,
    absentEndIndex
  );

  return (
    <div className="report-page" style={{ padding: "20px", margin: "20px" }}>
      <div className={styles.header}>
        <div className={styles.navbar}>
          <img
            src={require("../images/logo.png")}
            alt="Logo"
            className={styles.logo}
          />
          <nav className={styles.navItems}>
            <button onClick={() => navigate("/admin-lp")}>Dashboard</button>
          </nav>
        </div>
      </div>

      <h1 className="title" style={{ textAlign: "center", margin: "20px 0", color: "white" }}>
  Attendance Report
</h1>


      <div
        className="header-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        {/* Layout Cards */}
        <LayoutViewer
          onSelectLayout={setSelectedLayout}
          selectedLayout={selectedLayout} // Pass selectedLayout to LayoutViewer
        />

        {/* Date Picker */}
        <div
          className="data_picker"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
                <label htmlFor="dateInput" className="data_picker_label" style={{ color: "white" }}>
                  Date:
                 </label>

          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy/MM/dd"
          />
          <div style={{ marginTop: "10px" }}>
          <button
  className="download-button"
  onClick={generatePDF}
  style={{
    width: "120px",
    margin: "5px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  }}
>
  Download as PDF
</button>

<CSVLink
  data={csvData}
  filename={"attendance_report.csv"}
  style={{ textDecoration: "none" }}
>
  <button
    className="download-button"
    style={{
      width: "120px",
      margin: "5px",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      padding: "8px 12px",
      borderRadius: "4px",
      cursor: "pointer",
    }}
  >
    Download as CSV
  </button>
</CSVLink>


          </div>
        </div>
      </div>

      <div
        className="reportMainBox"
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        <div
          className="horizontal-layout"
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <div
            className="table-section present-section"
            style={{ flex: "1 1 300px", margin: "0 10px" }}
          >
            <h3 style={{ color: "black" }}>The Visitors</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#f0f0f0" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Name
                  </th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Email
                  </th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Contact No
                  </th>
                </tr>
              </thead>
              <tbody>
                {presentRecords.map((record) => (
                  <tr key={record._id}>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {record.userName}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {record.userEmail}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {record.userContactNo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: "10px" }}>
              {presentPage > 0 && (
                <button onClick={() => setPresentPage(presentPage - 1)}>
                  Previous
                </button>
              )}
              {presentPage <
                Math.ceil(filteredPresentBookings.length / recordsPerPage) -
                  1 && (
                <button onClick={() => setPresentPage(presentPage + 1)}>
                  Next
                </button>
              )}
            </div>
          </div>

          <div
            className="table-section absent-section"
            style={{ flex: "1 1 300px", margin: "0 10px" }}
          >
            <h3 style={{ color: "black" }}>The Absentees</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#f0f0f0" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Name
                  </th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Email
                  </th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>
                    Contact No
                  </th>
                </tr>
              </thead>
              <tbody>
                {absentRecords.map((record) => (
                  <tr key={record._id}>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {record.userName}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {record.userEmail}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {record.userContactNo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: "10px" }}>
              {absentPage > 0 && (
                <button onClick={() => setAbsentPage(absentPage - 1)}>
                  Previous
                </button>
              )}
              {absentPage <
                Math.ceil(filteredAbsentBookings.length / recordsPerPage) -
                  1 && (
                <button onClick={() => setAbsentPage(absentPage + 1)}>
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

LayoutViewer.propTypes = {
  onSelectLayout: PropTypes.func.isRequired, // Expecting a function
  selectedLayout: PropTypes.shape({
    _id: PropTypes.string,
    layoutName: PropTypes.string,
  }), // Expecting an object with specific properties
};
export default Report;
