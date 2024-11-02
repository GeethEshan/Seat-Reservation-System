import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import logoImage from "../images/landing1.png"; // Import the new image

const LandingPage = () => {
  const navigate = useNavigate();

  const handleSignUpClick = () => {
    navigate("/Sign-Up");
  };

  const handleLogInClick = () => {
    navigate("/login");
  };

  const handleAdminClick = () => {
    navigate("/admin-login");
  };

  return (
    <div className="landing-container">
      <img src={logoImage} alt="Landing Logo" className="landing-logo" />{" "}
      {/* Add the logo image */}
      <div className="welcome-message">
        <h1>Welcome To Our Seats Reservation Platform</h1>
      </div>
      <div className="buttons-container">
        <button className="landing-button" onClick={handleSignUpClick}>
          Sign Up
        </button>
        <button className="landing-button" onClick={handleLogInClick}>
          Log In
        </button>
        <button className="landing-button" onClick={handleAdminClick}>
          Admin
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
