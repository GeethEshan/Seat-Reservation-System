import React, { useEffect, useState } from "react";
import "./Trainees.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../images/logo.png";
import PropTypes from "prop-types";

const Trainees = () => {
  const navigate = useNavigate();
  const [trainees, setTrainees] = useState([]);
  const [editableTraineeId, setEditableTraineeId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 7;

  // Fetch users
  useEffect(() => {
    fetchTrainees();
  }, []);

  const fetchTrainees = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/users/user/get-all"
      );
      setTrainees(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Update trainee
  const handleUpdate = async (id, updatedData) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/users/user/update/${id}`,
        updatedData
      );
      updateTraineeInState(id, response.data.updatedUser);
      alert("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("An error occurred while updating the user.");
    } finally {
      setEditableTraineeId(null); // Reset editable state
    }
  };

  const updateTraineeInState = (id, updatedUser) => {
    setTrainees((prev) => prev.map((t) => (t._id === id ? updatedUser : t)));
  };

  // Remove trainee
  const handleRemove = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/users/user/remove/${id}`);
      alert("User moved to past trainees and removed");
      setTrainees((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Error removing user:", error);
      alert("An error occurred while removing the user.");
    }
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = trainees.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(trainees.length / recordsPerPage);

  return (
    <div className="trainees-container">
      <header className="navbar">
        <img src={logo} alt="Logo" className="logo" />
        <nav className="nav-items">
          <button onClick={() => navigate("/admin-lp")}>Dashboard</button>
        </nav>
      </header>

      <h1 className="trainees-title">Trainees Info</h1>

      <table className="trainees-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>NIC No</th>
            <th>Contact No</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentRecords.map((trainee) => (
            <TraineeRow
              key={trainee._id}
              trainee={trainee}
              editableTraineeId={editableTraineeId}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              setEditableTraineeId={setEditableTraineeId}
            />
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {currentPage > 1 && (
          <button onClick={() => setCurrentPage(currentPage - 1)}>
            Previous
          </button>
        )}
        {currentPage < totalPages && (
          <button onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
        )}
      </div>
    </div>
  );
};

// Component for rendering each trainee row
const TraineeRow = ({
  trainee,
  editableTraineeId,
  onUpdate,
  onRemove,
  setEditableTraineeId,
}) => {
  const isEditing = editableTraineeId === trainee._id;

  const handleChange = (field, value) => {
    trainee[field] = value; // Directly modifying the trainee object
  };

  return (
    <tr>
      <td>{trainee._id}</td>
      {["name", "nicNo", "contactNo", "email"].map((field) => (
        <td key={field}>
          {isEditing ? (
            <input
              type={field === "email" ? "email" : "text"}
              defaultValue={trainee[field]}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          ) : (
            trainee[field]
          )}
        </td>
      ))}
      <td className="action-buttons">
        {isEditing ? (
          <button onClick={() => onUpdate(trainee._id, trainee)}>Update</button>
        ) : (
          <button onClick={() => setEditableTraineeId(trainee._id)}>
            Edit
          </button>
        )}
        <button onClick={() => onRemove(trainee._id)}>Remove</button>
      </td>
    </tr>
  );
};

TraineeRow.propTypes = {
  trainee: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    nicNo: PropTypes.string.isRequired,
    contactNo: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
  editableTraineeId: PropTypes.string,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  setEditableTraineeId: PropTypes.func.isRequired,
};

export default Trainees;
