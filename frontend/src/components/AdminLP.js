import React from "react";
import { useNavigate, Link } from "react-router-dom"; // Import useNavigate and Link
import "./AdminLP.css";
import unavailableImage from "../images/unavailable-icon.png";
import availableImage from "../images/available-icon.jpg";
import attendanceImage from "../images/attendence-icon.png";
import traineesImage from "../images/trainees.png";
import reportsImage from "../images/reports-icon.png";
import layoutsImage from "../images/layout-icon.png";

const AdminLP = () => {
  const navigate = useNavigate();

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
      <button
        className="back-button"
        onClick={() => navigate("/landing-page")}
      >
        Back
      </button>

      <h1 className="welcome-text">Welcome Admin!</h1>

      <div className="cards-container1">
        {pages.map((page) => (
          <Link key={page.id} to={page.link} className="card1"> {/* Use Link instead of a */}
            <div className="card-content1">
              <h3>{page.title}</h3>
              <img
                src={page.image}
                alt={page.title}
                style={{
                  width: "70px",
                  height: "70px",
                  display: "block",
                  margin: "10px auto",
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminLP;
