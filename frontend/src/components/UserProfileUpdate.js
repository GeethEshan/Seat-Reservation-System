import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UserProfileUpdate.css";
import logo from "../images/logo.png";

const UserProfileUpdate = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    nicNo: "",
    contactNo: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch logged-in user's data from local storage
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUserData((prevUserData) => ({
        ...prevUserData,
        name: storedUser.name,
        email: storedUser.email,
        nicNo: storedUser.nicNo || "",
        contactNo: storedUser.contactNo || "",
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevUserData) => ({
      ...prevUserData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userId = storedUser?._id;

    try {
      await axios.put(`http://localhost:8000/api/users/user/update/${userId}`, {
        name: userData.name,
        email: userData.email, // Ensure the email is included in the update
        nicNo: userData.nicNo,
        contactNo: userData.contactNo,
      });
      setMessage("Profile updated successfully");
      setError("");
      // Update local storage with the new data
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, ...userData })
      );
    } catch (err) {
      setError(
        err.response ? err.response.data.error : "Error updating user data"
      );
      setMessage("");
    }
  };

  return (
    <div className="reservation-container">
      <div className="top-bar">
        <div className="navbar">
          <img src={logo} alt="Logo" className="logo" />
          <nav className="nav-items">
            <button onClick={() => navigate("/landing-page")}>Home</button>
            <button onClick={() => navigate("/reserve-seat")}>Reserve</button>
            <button onClick={() => navigate("/my-reservations")}>
              My Bookings
            </button>
          </nav>
        </div>
      </div>
      <div className="user-profile-update">
        <h2>Update Your Profile</h2> {/* New Heading */}
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
        <div className="profile-update-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input type="text" value={userData.name} readOnly />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                name="email"
                value={userData.email}
                onChange={handleChange} // Make email editable
              />
            </div>
            <div className="form-group">
              <label htmlFor="nic">NIC No:</label>
              <input
                type="text"
                name="nicNo"
                value={userData.nicNo}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contact">Contact No:</label>
              <input
                type="text"
                name="contactNo"
                value={userData.contactNo}
                onChange={handleChange}
              />
            </div>

            <button type="submit">Update Profile</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileUpdate;
