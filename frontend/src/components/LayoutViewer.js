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

const styles = {
  container: { padding: "20px" },
  backButton: { marginBottom: "20px" },
  subNavBar: { marginBottom: "20px" },
  subNavTitle: { fontSize: "1.5em" },
  cardContainer: { display: "flex", gap: "10px" },
  card: { padding: "10px", borderRadius: "8px", cursor: "pointer" },
  modal: { content: { top: "50%", left: "50%", right: "auto", bottom: "auto", marginRight: "-50%", transform: "translate(-50%, -50%)" }},
};

export default LayoutViewer;
