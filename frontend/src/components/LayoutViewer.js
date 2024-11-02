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

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const bookingDate = queryParams.get("date");

  const fetchLayouts = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/seat-layout");
      setLayouts(response.data);
    } catch (error) {
      console.error("Error fetching layouts:", error);
      alert("Error fetching layouts. Please try again.");
    }
  };

  const fetchReservedSeats = async (bookingDate, layoutName) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/bookings/reserved-seats/${bookingDate}/${layoutName}`
      );
      setReservedSeats((prevReservedSeats) => ({
        ...prevReservedSeats,
        [layoutName]: response.data.map((booking) => booking.seatId) || [],
      }));
    } catch (error) {
      console.error("Error fetching reserved seats:", error);
    }
  };

  const fetchUnavailableSeats = async (bookingDate, layoutName) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/seat-layout/unavailable-seats/${bookingDate}/${layoutName}`
      );
      setUnavailableSeats(response.data.map((seat) => seat.seatId) || []);
    } catch (error) {
      console.error("Error fetching unavailable seats:", error);
    }
  };

  useEffect(() => {
    fetchLayouts();
  }, []);

  useEffect(() => {
    if (bookingDate && selectedLayout) {
      fetchReservedSeats(bookingDate, selectedLayout.layoutName);
      fetchUnavailableSeats(bookingDate, selectedLayout.layoutName);
    }
  }, [bookingDate, selectedLayout]);

  const handleSelectLayout = (layout) => {
    setSelectedLayout(layout);
    setSelectedSeat(null);
    setReservationStatus("");
    setUnavailableSeats([]);
  };

  const handleSelectSeat = (seat) => {
    const isReserved = reservedSeats[selectedLayout.layoutName]?.includes(
      seat.seatId
    );
    const isUnavailable = unavailableSeats.includes(seat.seatId);

    if (isReserved || isUnavailable) {
      alert(
        "This seat is already reserved or unavailable and cannot be selected."
      );
      return;
    }

    if (selectedSeat && selectedSeat.seatId === seat.seatId) {
      setSelectedSeat(null);
    } else {
      setSelectedSeat(seat);
    }
  };

  const handleReserveSeat = async () => {
    if (!selectedSeat) {
      return setReservationStatus("Please select a seat to reserve.");
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      return setReservationStatus("User not logged in. Please log in.");
    }

    const missingDetails = validateUserDetails(user);
    if (missingDetails.length > 0) {
      return setReservationStatus(
        `Please provide the following user details: ${missingDetails.join(
          ", "
        )}`
      );
    }

    try {
      const response = await reserveSeat(user, bookingDate);
      await handleReservationResponse(response, user);
    } catch (error) {
      handleError(error);
    }
  };

  const validateUserDetails = (user) => {
    const missingDetails = [];
    if (!user._id) missingDetails.push("User ID");
    if (!user.name) missingDetails.push("User Name");
    if (!user.email) missingDetails.push("User Email");
    if (!user.contactNo) missingDetails.push("User Contact No");
    if (!user.nicNo) missingDetails.push("User NIC No");
    return missingDetails;
  };

  const checkBooking = async (user, bookingDate, layoutName) => {
    const response = await axios.post("http://localhost:8000/api/bookings/check-reservation", {
      userId: user._id,
      bookingDate: bookingDate || new Date().toISOString().split("T")[0],
      layoutName: layoutName,
    });
    return response.data;
  };
  
  const reserveSeat = async (user, bookingDate) => {
    const bookingDateFormatted = bookingDate || new Date().toISOString().split("T")[0];
  
    // First, check if the user already has a booking for the selected date
    const checkResponse = await checkBooking(user, bookingDateFormatted, selectedLayout.layoutName);
    
    if (checkResponse.exists) {
      alert(`You have already reserved a seat for this date: ${bookingDateFormatted}.`);
      return;  // Stop further execution if the user already has a booking
    }
  
    // If no booking exists, proceed with seat reservation
    const response = await axios.post("http://localhost:8000/api/bookings/reserve-seat/add", {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userContactNo: user.contactNo,
      userNicNo: user.nicNo,
      bookingDate: bookingDateFormatted,
      seatId: selectedSeat.seatId,
      layoutName: selectedLayout.layoutName,
    });
  
    // Optionally handle errors
    if (!response.data.success) {
      alert("Error occurred while reserving your seat.");
    }
  
    return response.data;
  };
  

  const handleReservationResponse = async (data, user) => {
    if (data.success) {
      const qrCodeData = {
        seatId: selectedSeat.seatId,
        userName: user.name,
        userEmail: user.email,
        bookingDate: bookingDate || new Date().toISOString().split("T")[0],
      };
      setQrData(JSON.stringify(qrCodeData));
      await sendConfirmationEmail(
        user.email,
        selectedSeat.seatId,
        user.name,
        user.nicNo,
        bookingDate
      );
      setIsModalOpen(true); // Open modal when reservation is successful
      setReservationStatus("");
    } else {
      setReservationStatus(data.error || "Failed to reserve seat.");
    }
  };

  const handleError = (error) => {
    console.error("Error reserving seat:", error);
    if (error.response?.data?.message) {
      console.error("Error message:", error.response.data.message);
      alert(error.response.data.message); // Display the error message to the user
    } else {
      console.error("An unexpected error occurred:", error);
      
    }
  };

  const sendConfirmationEmail = async (
    userEmail,
    seatId,
    userName,
    userNicNo,
    bookingDate
  ) => {
    try {
      await axios.post("http://localhost:8000/api/email/send", {
        to: userEmail,
        name: userName,
        nicNo: userNicNo,
        seatNumber: seatId,
        bookingDate: bookingDate || new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error sending email:", error);
      alert(
        "Error sending confirmation email. Please check your email settings."
      );
    }
  };

  const getLayoutCardStyle = (layout) => {
    return {
      background:
        selectedLayout?.layoutName === layout.layoutName
          ? "linear-gradient(135deg, #5da92f, #9bd46a)" // Selected layout
          : "linear-gradient(135deg, #aed1ef, #f2dfc1, #f0b9ef)", // Default layout
    };
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    window.location.reload(); // Refresh the page when modal is closed
  };

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button
        style={styles.backButton}
        onClick={() => navigate("/reserve-seat")}
      >
        Go Back
      </button>

      {/* Sub Navigation for Layouts */}
      <div style={styles.subNavBar}>
        <h3 style={styles.subNavTitle}>Available Layouts</h3>
        <div style={styles.cardContainer}>
          {layouts.map((layout) => (
            <button
              key={layout._id}
              className="card"
              aria-label={`Select layout ${layout.layoutName}`} // Provides a meaningful description for screen readers
              onClick={() => handleSelectLayout(layout)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelectLayout(layout); // Allows selecting layout with Enter or Space key
                }
              }}
              style={{ ...styles.card, ...getLayoutCardStyle(layout) }} // Applying dynamic styles
            >
              <h4>{layout.layoutName}</h4>
            </button>
          ))}
        </div>
      </div>

      {selectedLayout && (
  <div style={styles.selectedLayoutContainer}>
    <h3>Selected Layout: {selectedLayout.layoutName}</h3>
    <h4>Seat IDs:</h4>
    <div style={styles.seatGrid}>
      {Array.from({ length: 10 }, (_, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {Array.from({ length: 10 }, (_, colIndex) => {
            const seat = selectedLayout.seatPositions.find(
              (s) => s.row === rowIndex && s.col === colIndex
            );

            const isReserved = reservedSeats[
              selectedLayout.layoutName
            ]?.includes(seat?.seatId);
            const isUnavailable = unavailableSeats.includes(seat?.seatId);
            const isSelected =
              selectedSeat && selectedSeat.seatId === seat?.seatId;

            const getSeatLabel = () => {
              if (!seat) {
                return "Empty space"; // Descriptive label for screen readers
              }

              if (isUnavailable) {
                return `Seat ${seat.seatId} unavailable`;
              }

              if (isReserved) {
                return `Seat ${seat.seatId} reserved`;
              }

              return `Seat ${seat.seatId} available`;
            };

            const getBackgroundStyle = () => {
              if (!seat) return {}; // No background style for empty space

              let background;
              if (isUnavailable) {
                background =
                  "radial-gradient(circle, rgba(255, 255, 204, 1) 0%, rgba(255, 204, 0, 1) 100%)";
              } else if (isReserved) {
                background =
                  "radial-gradient(circle, rgba(255, 230, 204, 1) 0%, rgba(255, 0, 0, 1) 100%)";
              } else if (isSelected) {
                background =
                  "radial-gradient(circle, rgba(204, 255, 204, 1) 0%, rgba(51, 255, 51, 1) 100%)";
              } else {
                background =
                  "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(173, 216, 230, 1) 100%)";
              }

              return {
                ...styles.seatIcon,
                background,
                cursor: isReserved || isUnavailable ? "not-allowed" : "pointer",
              };
            };

            const seatStyle = getBackgroundStyle();
            
            // Render an empty div for empty spaces in the layout
            return seat ? (
              <button
                key={`${rowIndex}-${colIndex}`}
                aria-label={getSeatLabel()}
                style={seatStyle}
                onClick={() => {
                  if (seat && !isReserved && !isUnavailable) {
                    handleSelectSeat(seat);
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === " ") &&
                    seat &&
                    !isReserved &&
                    !isUnavailable
                  ) {
                    handleSelectSeat(seat);
                  }
                }}
              >
                {seat.seatId}
              </button>
            ) : (
              <div key={`${rowIndex}-${colIndex}`} style={styles.emptySeatSpace}></div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  


          <div style={styles.reserveContainer}>
            <h4>
              Selected Seat: {selectedSeat ? selectedSeat.seatId : "None"}
            </h4>
            <button style={styles.reserveButton} onClick={handleReserveSeat}>
              Reserve Seat
            </button>
            {reservationStatus && (
              <p style={{ color: "red" }}>{reservationStatus}</p>
            )}
          </div>
        </div>
      )}

      {/* Modal for QR Code */}
      <Modal
  isOpen={isModalOpen}
  onRequestClose={handleModalClose}
  style={modalStyles}
>
  <h3>Reservation Confirmed!</h3>
  <h4>Check Your Email For More Info</h4>
  {qrData && <QRCodeCanvas value={qrData} size={200} />}
  <button onClick={handleModalClose} style={styles.closeModalButton}>
    Close
  </button>
</Modal>

    </div>
  );
};

// Styling
const styles = {
  container: { textAlign: "center", marginTop: "40px" },
  subNavBar: { opacity: "10", padding: "10px" },
  subNavTitle: { margin: "0",opacity: "10" },
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
