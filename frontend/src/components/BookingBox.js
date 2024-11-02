import PropTypes from "prop-types";
import React from "react";
import "./BookingBox.css";

export default function BookingBox(props) {
  return (
    <div className="bookingBox-contener">
      <h2>{props.userName}</h2>
      <h2>{props.userEmail}</h2>
      <h2>{props.userContactNo}</h2>

      {props.attended ? (
        <h3 style={{ color: "black" }}>present</h3>
      ) : (
        <h3 style={{ color: "red" }}>absent</h3>
      )}
    </div>
  );
}

BookingBox.propTypes = {
  userName: PropTypes.string.isRequired,
  userEmail: PropTypes.string.isRequired,
  userContactNo: PropTypes.string.isRequired,
  attended: PropTypes.bool.isRequired,
};
