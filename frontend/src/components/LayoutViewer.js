import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Modal from "react-modal";
import "./LayoutViewer.css";

// Set up Modal app element
Modal.setAppElement("#root");

const LayoutViewer = () => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reservationStatus, setReservationStatus] = useState("");
  const [qrData, setQrData] = useState(null);
  const [reservedSeats, setReservedSeats] = useState({});
  const [unavailableSeats, setUnavailableSeats] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canvasRef, setCanvasRef] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const bookingDate = new URLSearchParams(location.search).get("date");

  // Fetch layouts from API
  const fetchLayouts = async () => {
    try {
      const response = await axios.get("https://backend-1-440807.el.r.appspot.com/api/seat-layout");
      setLayouts(response.data);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      alert("Error fetching layouts. Please try again.");
    }
  };

  // Fetch reserved and unavailable seats from API
  const fetchSeats = async (layoutName) => {
    try {
      const [reservedResponse, unavailableResponse] = await Promise.all([
        axios.get(`https://backend-1-440807.el.r.appspot.com/api/bookings/reserved-seats/${bookingDate}/${layoutName}`),
        axios.get(`https://backend-1-440807.el.r.appspot.com/api/seat-layout/unavailable-seats/${bookingDate}/${layoutName}`)
      ]);
      setReservedSeats({
        ...reservedSeats,
        [layoutName]: reservedResponse.data.map((booking) => booking.seatId) || [],
      });
      setUnavailableSeats(unavailableResponse.data.map((seat) => seat.seatId) || []);
    } catch (error) {
      console.error("Error fetching seats:", error);
    }
  };

  useEffect(() => {
    fetchLayouts();
  }, []);

  useEffect(() => {
    if (bookingDate && selectedLayout) {
      fetchSeats(selectedLayout.layoutName);
    }
  }, [bookingDate, selectedLayout]);

  // Layout and seat selection handlers
  const handleSelectLayout = (layout) => {
    setSelectedLayout(layout);
    setSelectedSeat(null);
    setReservationStatus("");
    setUnavailableSeats([]);
  };

  const handleSelectSeat = (seat) => {
    const isReserved = reservedSeats[selectedLayout.layoutName]?.includes(seat.seatId);
    const isUnavailable = unavailableSeats.includes(seat.seatId);

    if (isReserved || isUnavailable) {
      alert("This seat is reserved or unavailable.");
      return;
    }
    setSelectedSeat(seat.seatId === selectedSeat?.seatId ? null : seat);
  };

  // Handle seat reservation
  const handleReserveSeat = async () => {
    if (!selectedSeat) return setReservationStatus("Please select a seat to reserve.");

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return setReservationStatus("User not logged in. Please log in.");

    const missingDetails = ["_id", "name", "email", "contactNo", "nicNo"].filter((field) => !user[field]);
    if (missingDetails.length > 0) {
      return setReservationStatus(`Provide user details: ${missingDetails.join(", ")}`);
    }

    try {
      const bookingDateFormatted = bookingDate || new Date().toISOString().split("T")[0];
      const response = await checkBooking(user, bookingDateFormatted);

      if (response.exists) {
        alert(`Seat already reserved for date: ${bookingDateFormatted}.`);
        return;
      }

      await reserveSeat(user, bookingDateFormatted);
    } catch (error) {
      console.error("Error reserving seat:", error);
      alert("Failed to reserve seat. Please try again.");
    }
  };

  // API call to check for existing booking
  const checkBooking = async (user, bookingDateFormatted) => {
    const response = await axios.post(
      "https://backend-1-440807.el.r.appspot.com/api/bookings/check-reservation",
      {
        userId: user._id,
        bookingDate: bookingDateFormatted,
        layoutName: selectedLayout.layoutName,
      }
    );
    return response.data;
  };

  // API call to reserve seat
  const reserveSeat = async (user, bookingDateFormatted) => {
    const response = await axios.post(
      "https://backend-1-440807.el.r.appspot.com/api/bookings/reserve-seat/add",
      {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userContactNo: user.contactNo,
        userNicNo: user.nicNo,
        bookingDate: bookingDateFormatted,
        seatId: selectedSeat.seatId,
        layoutName: selectedLayout.layoutName,
      }
    );
    handleReservationResponse(response.data, user);
  };

  // Process successful reservation
  const handleReservationResponse = async (data, user) => {
    if (data.success) {
      setQrData(JSON.stringify({
        seatId: selectedSeat.seatId,
        userName: user.name,
        userEmail: user.email,
        bookingDate: bookingDate || new Date().toISOString().split("T")[0],
      }));
      await sendConfirmationEmail(user);
      setIsModalOpen(true);
      setReservationStatus("");
    } else {
      setReservationStatus("Failed to reserve seat.");
    }
  };

  // Send confirmation email
  const sendConfirmationEmail = async (user) => {
    try {
      await axios.post("https://backend-1-440807.el.r.appspot.com/api/email/send", {
        to: user.email,
        name: user.name,
        nicNo: user.nicNo,
        seatNumber: selectedSeat.seatId,
        bookingDate: bookingDate || new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  // Close modal and refresh data
  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchLayouts();
    if (bookingDate && selectedLayout) {
      fetchSeats(selectedLayout.layoutName);
    }
  };

  // QR Code download
  const handleDownload = () => {
    if (canvasRef) {
      const pngUrl = canvasRef.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "qr_code.png";
      link.click();
    } else {
      console.error("Canvas not found");
    }
  };

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button style={styles.backButton} onClick={() => navigate("/reserve-seat")}>Go Back</button>

      {/* Layout selection */}
      <div style={styles.subNavBar}>
        <h3 style={styles.subNavTitle}>Available Layouts</h3>
        <div style={styles.cardContainer}>
          {layouts.map((layout) => (
            <button
              key={layout._id}
              className="card"
              onClick={() => handleSelectLayout(layout)}
              style={{ ...styles.card, background: selectedLayout?.layoutName === layout.layoutName ? "linear-gradient(135deg, #5da92f, #9bd46a)" : "linear-gradient(135deg, #aed1ef, #f2dfc1, #f0b9ef)" }}
            >
              <h4>{layout.layoutName}</h4>
            </button>
          ))}
        </div>
      </div>

      {/* Modal for QR code */}
      <Modal isOpen={isModalOpen} onRequestClose={handleModalClose} style={styles.modal}>
        <QRCodeCanvas value={qrData || ""} size={250} ref={(canvas) => setCanvasRef(canvas)} />
        <button onClick={handleDownload}>Download QR Code</button>
      </Modal>
    </div>
  );
};

// Styling
const styles = {
  container: { textAlign: "center", marginTop: "40px" },
  subNavBar: { opacity: "10", padding: "10px" },
  subNavTitle: { margin: "0", opacity: "10" },
  cardContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    opacity: "10",
    gap: "10px",
    marginTop: "10px",
  },
  card: {
    border: "1px solid #ccc",
    padding: "1px", // Further reduced padding
    borderRadius: "10px",
    width: "180px", // Adjust width if needed
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s",
    height: "50px", // Further reduced height
  },
  selectedLayoutContainer: { marginTop: "20px" },
  seatGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(10, 50px)",
    gridGap: "10px",
    justifyContent: "center",
    marginTop: "10px",
    marginBottom: "15px",
  },
  seatIcon: {
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "5px",
    cursor: "pointer",
    color: "black",
    boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.5)", // Heavy shadow added
  },
  emptySeatIcon: {
    width: "50px",
    height: "50px",
    boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.5)",
    borderRadius: "5px",
    backgroundColor: "#F8F8FF",
  },

  seatIdText: { fontSize: "12px", color: "#000000" },
  reserveContainer: { marginTop: "10px" },
  reserveButton: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  errorText: { color: "red", marginTop: "10px" },
  closeModalButton: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    marginTop: "10px",
    cursor: "pointer",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },

  backButton: {
    width: "150px",
    position: "absolute", // Makes it float at a fixed position
    top: "10px", // Adjust the vertical distance from the top
    left: "10px", // Adjust the horizontal distance from the left
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
const modalStyles = {
  content: {
    display: "flex",

    flexDirection: "column",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.2)",
  },
  modalTitle: {
    fontSize: "1.5em",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  modalContent: {
    fontSize: "1em",
    marginBottom: "20px",
  },
  modalCloseButton: {
    padding: "10px",
    backgroundColor: "#5da92f",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default LayoutViewer;
