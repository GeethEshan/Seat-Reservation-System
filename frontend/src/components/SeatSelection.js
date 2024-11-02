import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "./SeatSelection.css";
import logo from "../images/logo.png";

const SEATS_PER_PAGE = 50;

const SeatSelection = () => {
  const [totalSeats, setTotalSeats] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [temporarilyUnavailableSeats, setTemporarilyUnavailableSeats] =
    useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [userReservations, setUserReservations] = useState([]);
  const [qrData, setQrData] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const bookingDate = queryParams.get("date");
  const userData = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/seats/allSeats/getAll"
        );
        const data = await response.json();
        setTotalSeats(data?.seat?.totalSeats || 0);
      } catch (err) {
        console.error("Error fetching seats:", err);
      }
    };

    const fetchTemporarilyUnavailableSeats = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/seats/seats/unavailable/${bookingDate}`
        );
        const data = await response.json();
        setTemporarilyUnavailableSeats(data.map((seat) => seat.seatNumber));
      } catch (err) {
        console.error("Error fetching temporarily unavailable seats:", err);
      }
    };

    const fetchBookings = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/bookings/history/${bookingDate}`
        );
        const data = await response.json();
        setReservedSeats(data.map((booking) => booking.seatNumber));
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };

    fetchSeats();
    fetchTemporarilyUnavailableSeats();
    fetchBookings();
  }, [bookingDate]);

  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/bookings/user-bookings/${userData._id}/date/${bookingDate}`
        );
        const data = await response.json();
        setUserReservations(data);
      } catch (err) {
        console.error("Error fetching user bookings:", err);
      }
    };

    fetchUserBookings();
  }, [userData._id, bookingDate]);

  const handleSeatClick = (seatNumber) => {
    if (reservedSeats.includes(seatNumber)) {
      alert("This seat is already reserved.");
    } else if (temporarilyUnavailableSeats.includes(seatNumber)) {
      alert("This seat is temporarily unavailable.");
    } else if (userReservations.length > 0) {
      alert("You can only reserve one seat per day.");
    } else {
      setSelectedSeat(seatNumber);
    }
  };

  const handleReserveClick = async () => {
    if (!selectedSeat) {
      alert("Please select a seat.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/bookings/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData._id,
          userName: userData.name,
          userEmail: userData.email,
          userContactNo: userData.contactNo,
          userNicNo: userData.nicNo,
          bookingDate: bookingDate,
          seatNumber: selectedSeat,
        }),
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setReservedSeats((prev) => [...prev, selectedSeat]);
        setQrData({
          userName: userData.name,
          date: bookingDate,
          seatNumber: selectedSeat,
        });
        setSendingEmail(true);
        await sendEmail(userData);
        setSendingEmail(false);
      }
    } catch (err) {
      console.error("Error reserving seat:", err);
    }
  };

  const sendEmail = async (userData) => {
    try {
      await fetch("http://localhost:8000/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: userData.email,
          name: userData.name,
          nicNo: userData.nicNo,
          seatNumber: selectedSeat,
          bookingDate: bookingDate,
        }),
      });
    } catch (err) {
      console.error("Error sending email:", err);
    }
  };

  const handleDownloadQr = () => {
    const canvas = document.querySelector(".qr-code-canvas");
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "QR_Code.png";
    downloadLink.click();
  };

  const handleCloseQrPopup = () => {
    setQrData(null);
    if (selectedSeat && !userReservations.length) {
      setUserReservations([
        {
          seatNumber: selectedSeat,
          bookingDate: bookingDate,
        },
      ]);
    }
  };

  const totalPages = Math.ceil(totalSeats / SEATS_PER_PAGE);
  const displayedSeats = Array.from(
    { length: totalSeats },
    (_, index) => index + 1
  ).slice(currentPage * SEATS_PER_PAGE, (currentPage + 1) * SEATS_PER_PAGE);

  function handleKeyDown(event, seatNumber) {
    if (event.key === "Enter" || event.key === " ") {
      handleSeatClick(seatNumber); // Trigger seat click when 'Enter' or 'Space' is pressed
    }
  }

  // Function to determine the class name for each seat
  const getSeatClass = (seatNumber) => {
    const isReserved = reservedSeats.includes(seatNumber);
    const isTemporarilyUnavailable =
      temporarilyUnavailableSeats.includes(seatNumber);
    const isSelected = selectedSeat === seatNumber;

    if (isReserved) {
      return "reserved";
    } else if (isTemporarilyUnavailable) {
      return "temporarily-unavailable";
    } else if (isSelected) {
      return "selected";
    } else {
      return "available";
    }
  };

  return (
    <div className="seat-selection-container">
      <div className="top-bar" style= {{
        margin:"0px"}}>
        <div className="navbar">
          <img src={logo} alt="Logo" className="logo" />
          <h2 className="booking-date">{bookingDate}</h2>
          <nav className="nav-items">
            <button onClick={() => navigate("/landing-page")}>Home</button>
            <button onClick={() => navigate("/reserve-seat")}>Reserve</button>
            <button onClick={() => navigate("/my-reservations")}>My Bookings</button>
            <button onClick={() => navigate("/seat-layout")}>seat layout</button>
          </nav>
        </div>
      </div>
      <div className="seat-selection-content">
        <div className="left-side">
          <div className="seat-grid">
            {displayedSeats.map((seatNumber) => (
              <button
                key={seatNumber}
                className={`seat ${getSeatClass(seatNumber)}`} // Using the extracted function here
                onClick={() => handleSeatClick(seatNumber)}
                onKeyDown={(e) => handleKeyDown(e, seatNumber)} // For keyboard accessibility
                style={
                  selectedSeat === seatNumber
                    ? { backgroundColor: "limegreen" }
                    : {}
                }
                aria-pressed={selectedSeat === seatNumber} // Indicates the selected state
              >
                <div style={{ color: "black" }}>{seatNumber}</div>
              </button>
            ))}
          </div>
          <div className="pagination">
            {currentPage > 0 && (
              <button onClick={() => setCurrentPage((prev) => prev - 1)}>
                Previous Page
              </button>
            )}
            <span>
              Page {currentPage + 1} of {totalPages}
            </span>
            {currentPage < totalPages - 1 && (
              <button onClick={() => setCurrentPage((prev) => prev + 1)}>
                Next Page
              </button>
            )}
          </div>
          <button className="reserve-button" onClick={handleReserveClick}>
            Reserve Seat
          </button>
        </div>
        <div className="right-side">
          <h3 style={{ fontSize: "1.5em" }}>Instructions</h3>
          <p style={{ fontSize: "1.2em" }}>
            Click on an available seat to reserve it.
          </p>
          <h3 style={{ fontSize: "1.5em" }}>Legend</h3>
          <div className="legend-item">
            <div className="seat available"></div>
            <span style={{ fontSize: "1.2em", marginLeft: "20px" }}>
              Available
            </span>
          </div>
          <div className="legend-item">
            <div className="seat reserved"></div>
            <span style={{ fontSize: "1.2em", marginLeft: "20px" }}>
              Reserved
            </span>
          </div>
          <div className="legend-item">
            <div className="seat temporarily-unavailable"></div>
            <span style={{ fontSize: "1.2em", marginLeft: "20px" }}>
              Temporarily Unavailable
            </span>
          </div>
          <div className="legend-item">
            <div className="seat selected"></div>
            <span style={{ fontSize: "1.2em", marginLeft: "20px" }}>
              Selected
            </span>
          </div>
        </div>
      </div>

      {qrData && (
        <div className="qr-popup">
          <div className="qr-content">
            <h3>
              {sendingEmail
                ? "Sending information about your seat reservation..."
                : "We have sent information about your seat reservation to your Gmail address."}
            </h3>
            {sendingEmail ? (
              <p>Please wait...</p>
            ) : (
              <>
                <QRCodeCanvas
                  value={`Name: ${qrData.userName}\nDate: ${qrData.date}\nSeat Number: ${qrData.seatNumber}`}
                  size={256}
                  className="qr-code-canvas"
                />
                <button onClick={handleDownloadQr}>Download QR Code</button>
              </>
            )}
            <button onClick={handleCloseQrPopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;
