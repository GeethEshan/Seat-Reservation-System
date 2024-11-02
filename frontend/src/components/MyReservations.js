import React, { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import "./MyReservations.css";
import logo from "../images/logo.png";

const MyReservations = () => {
  const [bookings, setBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage] = useState(5);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user?._id) {
        setError("User not logged in");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/bookings/user-bookings/${user._id}`
        );
        const data = await response.json();

        if (response.ok) {
          const sortedBookings = data.sort(
            (a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)
          );
          setBookings(sortedBookings);
        } else {
          setError(data.error || "Error fetching bookings");
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Error fetching bookings");
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    if (error || feedback) {
      const timer = setTimeout(() => {
        setError("");
        setFeedback("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, feedback]);

  const isFutureDate = (date) => {
    const today = new Date();
    const bookingDate = new Date(date);
    return bookingDate > today;
  };

  const handleCancelClick = async (id, bookingDate) => {
    if (isFutureDate(bookingDate)) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/bookings/delete-booking/${id}`,
          {
            method: "DELETE",
          }
        );
        const data = await response.json();
        if (response.ok) {
          setBookings(bookings.filter((booking) => booking._id !== id));
          setFeedback("Booking canceled successfully");
          // Optional: Show additional feedback if needed
          console.log(`Deleted Booking - Layout Name: ${data.layoutName}, Seat ID: ${data.seatId}`);
        } else {
          setError(data.error || "Error canceling booking");
        }
      } catch (err) {
        console.error("Error canceling booking:", err);
        setError("Error canceling booking");
      }
    } else {
      setFeedback("You can only cancel future bookings");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking
  );

  const totalPages = Math.ceil(bookings.length / bookingsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="my-reservations-container">
      <header className="navbar">
        <img src={logo} alt="Logo" className="logo" />
        <nav className="nav-items">
          <button onClick={() => navigate("/landing-page")}>Home</button>
          <button onClick={() => navigate("/reserve-seat")}>Reservation</button>
        </nav>
      </header>

      <h2>My Reservations</h2>

      <div className="popup-container">
        {error && <div className="popup error">{error}</div>}
        {feedback && <div className="popup feedback">{feedback}</div>}
      </div>

      {currentBookings.length > 0 ? (
        <>
          <table className="reservations-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Seat ID</th> {/* Updated column for Seat ID */}
                <th>Layout Name</th> {/* New column for Layout Name */}
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="table_body">
              {currentBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>{formatDate(booking.bookingDate)}</td>
                  <td>{booking.seatId}</td> {/* Display Seat ID */}
                  <td>{booking.layoutName}</td> {/* Display Layout Name */}
                  <td>
                    <button
                      className="cancel-button"
                      onClick={() =>
                        handleCancelClick(booking._id, booking.bookingDate)
                      }
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="page-info">{`Page ${currentPage} of ${totalPages}`}</span>
            <button
              className="pagination-button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p>No reservations found</p>
      )}
    </div>
  );
};

export default MyReservations;
