import React, { useState, useEffect, useRef } from "react";
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
  const canvasRef = useRef(null); // Ref for QR code canvas

  const navigate = useNavigate();
  const location = useLocation();
  const bookingDate = new URLSearchParams(location.search).get("date");

  useEffect(() => {
    fetchLayouts();
  }, []);

  useEffect(() => {
    if (bookingDate && selectedLayout) {
      fetchReservedSeats(bookingDate, selectedLayout.layoutName);
      fetchUnavailableSeats(bookingDate, selectedLayout.layoutName);
    }
  }, [bookingDate, selectedLayout]);

  // Fetch layouts
  const fetchLayouts = async () => {
    try {
      const response = await axios.get("https://backend-1-440807.el.r.appspot.com/api/seat-layout");
      setLayouts(response.data);
    } catch (error) {
      alert("Error fetching layouts. Please try again.");
    }
  };

  // Fetch reserved seats
  const fetchReservedSeats = async (date, layoutName) => {
    try {
      const response = await axios.get(
        `https://backend-1-440807.el.r.appspot.com/api/bookings/reserved-seats/${date}/${layoutName}`
      );
      setReservedSeats((prev) => ({ ...prev, [layoutName]: response.data.map((b) => b.seatId) || [] }));
    } catch (error) {
      console.error("Error fetching reserved seats:", error);
    }
  };

  // Fetch unavailable seats
  const fetchUnavailableSeats = async (date, layoutName) => {
    try {
      const response = await axios.get(
        `https://backend-1-440807.el.r.appspot.com/api/seat-layout/unavailable-seats/${date}/${layoutName}`
      );
      setUnavailableSeats(response.data.map((seat) => seat.seatId) || []);
    } catch (error) {
      console.error("Error fetching unavailable seats:", error);
    }
  };

  // Select layout
  const handleSelectLayout = (layout) => {
    setSelectedLayout(layout);
    setSelectedSeat(null);
    setReservationStatus("");
    setUnavailableSeats([]);
  };

  // Select seat
  const handleSelectSeat = (seat) => {
    const isReserved = reservedSeats[selectedLayout.layoutName]?.includes(seat.seatId);
    const isUnavailable = unavailableSeats.includes(seat.seatId);

    if (isReserved || isUnavailable) {
      alert("This seat is already reserved or unavailable.");
      return;
    }

    setSelectedSeat(selectedSeat && selectedSeat.seatId === seat.seatId ? null : seat);
  };

  // Reserve seat
  const handleReserveSeat = async () => {
    if (!selectedSeat) return setReservationStatus("Please select a seat.");
    
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return setReservationStatus("User not logged in. Please log in.");

    try {
      const response = await reserveSeat(user, bookingDate);
      await handleReservationResponse(response, user);
    } catch (error) {
      handleError(error);
    }
  };

  // Reserve seat API call
  const reserveSeat = async (user, date) => {
    const bookingDateFormatted = date || new Date().toISOString().split("T")[0];

    const checkResponse = await axios.post(
      "https://backend-1-440807.el.r.appspot.com/api/bookings/check-reservation",
      { userId: user._id, bookingDate: bookingDateFormatted, layoutName: selectedLayout.layoutName }
    );

    if (checkResponse.data.exists) {
      alert(`You already have a reservation for ${bookingDateFormatted}.`);
      return;
    }

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
    return response.data;
  };

  // Handle reservation response
  const handleReservationResponse = async (data, user) => {
    if (data.success) {
      setQrData(JSON.stringify({
        seatId: selectedSeat.seatId,
        userName: user.name,
        bookingDate: bookingDate || new Date().toISOString().split("T")[0],
      }));
      await sendConfirmationEmail(user.email, selectedSeat.seatId, user.name, user.nicNo, bookingDate);
      setIsModalOpen(true);
      setReservationStatus("");
    } else {
      setReservationStatus(data.error || "Failed to reserve seat.");
    }
  };

  // Handle errors
  const handleError = (error) => {
    const message = error.response?.data?.message || "An unexpected error occurred.";
    console.error(message);
    alert(message);
  };

  // Send confirmation email
  const sendConfirmationEmail = async (email, seatId, name, nic, date) => {
    try {
      await axios.post("https://backend-1-440807.el.r.appspot.com/api/email/send", {
        to: email,
        name: name,
        nicNo: nic,
        seatNumber: seatId,
        bookingDate: date || new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error sending confirmation email.");
    }
  };

  // Download QR code
  const handleDownload = () => {
    if (canvasRef.current) {
      const pngUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "qr_code.png";
      link.click();
    }
  };

  // Close modal and refresh data
  const handleModalClose = async () => {
    setIsModalOpen(false);
    await fetchLayouts();
    if (bookingDate && selectedLayout) {
      await fetchReservedSeats(bookingDate, selectedLayout.layoutName);
      await fetchUnavailableSeats(bookingDate, selectedLayout.layoutName);
    }
  };

  return (
    <div className="layout-viewer-container">
      <button onClick={() => navigate("/reserve-seat")}>Go Back</button>

      <div className="layout-list">
        <h3>Available Layouts</h3>
        {layouts.map((layout) => (
          <button
            key={layout._id}
            className="layout-card"
            onClick={() => handleSelectLayout(layout)}
            style={{ background: selectedLayout?.layoutName === layout.layoutName ? "lightgreen" : "lightgray" }}
          >
            {layout.layoutName}
          </button>
        ))}
      </div>

      {selectedLayout && (
        <div className="selected-layout">
          <h3>Selected Layout: {selectedLayout.layoutName}</h3>
          <div className="seat-grid">
            {Array.from({ length: 10 }).map((_, row) => (
              Array.from({ length: 10 }).map((_, col) => {
                const seat = selectedLayout.seatPositions.find(s => s.row === row && s.col === col);
                const isReserved = reservedSeats[selectedLayout.layoutName]?.includes(seat?.seatId);
                const isUnavailable = unavailableSeats.includes(seat?.seatId);
                const isSelected = selectedSeat?.seatId === seat?.seatId;
                return (
                  <button
                    key={`${row}-${col}`}
                    onClick={() => seat && handleSelectSeat(seat)}
                    disabled={!seat || isReserved || isUnavailable}
                    className={`seat ${isSelected ? "selected" : isReserved ? "reserved" : isUnavailable ? "unavailable" : ""}`}
                  >
                    {seat ? seat.seatId : ""}
                  </button>
                );
              })
            ))}
          </div>
          <button onClick={handleReserveSeat}>Reserve Seat</button>
          {reservationStatus && <p>{reservationStatus}</p>}
        </div>
      )}

      <Modal isOpen={isModalOpen} onRequestClose={handleModalClose}>
        <h2>Reservation Successful!</h2>
        <QRCodeCanvas value={qrData} size={256} ref={canvasRef} />
        <button onClick={handleDownload}>Download QR Code</button>
        <button onClick={handleModalClose}>Close</button>
      </Modal>
    </div>
  );
};

export default LayoutViewer;
