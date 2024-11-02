import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./AdminLP.css"; // Import the CSS for styling
import unavailableImage from "../images/unavailable-icon.png"; // Replace with actual image paths
import availableImage from "../images/available-icon.jpg";
import attendanceImage from "../images/attendence-icon.png";
import traineesImage from "../images/trainees.png";
import reportsImage from "../images/reports-icon.png";
import layoutsImage from "../images/layout-icon.png";

const AdminLP = () => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  // List of pages with titles, links, and image sources
  const pages = [
    {
      id: 1,
      title: "Make Unavailable",
      link: "/admin-dashboard",
      image: unavailableImage,
    },
    {
      id: 2,
      title: "Make Available Again",
      link: "/available-again",
      image: availableImage,
    },
    {
      id: 3,
      title: "Mark Attendance",
      link: "/reserve-history",
      image: attendanceImage,
    },
    { id: 4, title: "Trainees", link: "/trainees", image: traineesImage },
    { id: 5, title: "Reports", link: "/report", image: reportsImage },
    { id: 6, title: "Layouts", link: "/seat-layout", image: layoutsImage },
  ];

  return (
    <div className="admin-page">
      {/* Back Button */}
      <button
        className="back-button"
        onClick={() => navigate("/landing-page")} // Navigate to "landing-page"
      >
        Back
      </button>
      
      {/* Welcome Text */}
      <h1 className="welcome-text">Welcome Admin!</h1>
      
      {/* Card Container */}
      <div className="cards-container1">
        {pages.map((page) => (
          <a key={page.id} href={page.link} className="card1">
            <div className="card-content1">
              <h3>{page.title}</h3>
              <img
                src={page.image} // Render the image
                alt={page.title} // Set alt text
                style={{
                  width: "70px", // Adjust width as needed
                  height: "70px", // Adjust height as needed
                  display: "block", // Make sure it displays as a block
                  margin: "10px auto", // Center the image horizontally
                }}
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default AdminLP;
