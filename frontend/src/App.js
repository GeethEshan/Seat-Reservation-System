// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignUp from "./components/Sign-Up";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import SeatReservation from "./components/SeatReservation";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import ReserveHistory from "./components/ReserveHistory";
import Report from "./components/Report";
import AvailableAgain from "./components/AvailableAgain";
import MyReservations from "./components/MyReservations";
import SeatSelection from "./components/SeatSelection";
import Trainees from "./components/Trainees";
import UserProfileUpdate from "./components/UserProfileUpdate";
import AdminLp from "./components/AdminLP";
import SeatLayout from "./components/SeatLayout";  // Import SeatLayout component
import { DndProvider } from "react-dnd";           // Import react-dnd for drag and drop functionality
import { HTML5Backend } from "react-dnd-html5-backend";  // Use HTML5Backend for drag-and-drop
import LayoutViewer from "./components/LayoutViewer";
import DateManager from "./components/DateManager";

function App() {
  return (
    <DndProvider backend={HTML5Backend}>  {/* Wrap with DndProvider */}
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing-page" element={<LandingPage />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reserve-seat" element={<SeatReservation />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/reserve-history" element={<ReserveHistory />} />
            <Route path="/admin-lp" element={<AdminLp />} />
            <Route path="/available-again" element={<AvailableAgain />} />
            <Route path="/report" element={<Report />} />
            <Route path="/my-reservations" element={<MyReservations />} />
            <Route path="/seat-selection" element={<SeatSelection />} />
            <Route path="/trainees" element={<Trainees />} />{" "}
            {/* Added Trainees route */}
            <Route path="/user-profile-update" element={<UserProfileUpdate />} />{" "}
            {/* Added UserProfileUpdate route */}
            <Route path="/seat-layout" element={<SeatLayout />} />  {/* Added SeatLayout route */}
            <Route path="/layout-viewer" element={<LayoutViewer />} />
            <Route path="/date-manager" element={<DateManager />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </DndProvider>
  );
}

const NotFound = () => {
  return <h1>404 - Page Not Found</h1>;
};

export default App;
