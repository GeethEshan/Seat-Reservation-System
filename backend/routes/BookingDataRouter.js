const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer"); // Import nodemailer
const Booking = require("../modals/BookingModal");
const Holiday = require("../modals/Holiday");

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "trainee.seat.reservation@gmail.com",
    pass: "trvn wptu oeoz gush",
  },
  secure: true,
  tls: {
    rejectUnauthorized: false,
  },
});

// POST route to reserve a new booking
router.post("/reserve-seat/add", async (req, res) => {
  const {
    userId,
    userName,
    userEmail,
    userContactNo,
    userNicNo,
    bookingDate,
    layoutName,
    seatId,
  } = req.body;

  const missingFields = [];
  if (!userId) missingFields.push("userId");
  if (!userName) missingFields.push("userName");
  if (!userEmail) missingFields.push("userEmail");
  if (!userContactNo) missingFields.push("userContactNo");
  if (!userNicNo) missingFields.push("userNicNo");
  if (!bookingDate) missingFields.push("bookingDate");
  if (!layoutName) missingFields.push("layoutName");
  if (!seatId) missingFields.push("seatId");

  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
  }

  try {
    const existingBooking = await Booking.findOne({
      userId,
      bookingDate,
      layoutName,
      seatId,
    });
    if (existingBooking) {
      return res.status(400).json({ error: "You have already reserved this seat for this date and layout" });
    }

    const newBooking = new Booking({
      userId,
      userName,
      userEmail,
      userContactNo,
      userNicNo,
      bookingDate,
      layoutName,
      seatId,
    });

    await newBooking.save();
    // Optional: Send confirmation email to user
    const mailOptions = {
      from: "trainee.seat.reservation@gmail.com",
      to: userEmail,
      subject: "Booking Confirmation",
      text: `Dear ${userName},\n\nYour seat has been successfully reserved (Seat ID: ${seatId}) for ${bookingDate}.\n\nBest regards,\nSeat Reservation System Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    return res.status(200).json({ success: "Booking successful", newBooking });
  } catch (err) {
    console.error("Error creating booking:", err);
    return res.status(500).json({ error: "Error creating booking" });
  }
});

// POST route to check if a user has already reserved a seat for a given date
router.post("/check-reservation", async (req, res) => {
  const { userId, bookingDate, layoutName } = req.body;

  try {
    const existingBooking = await Booking.findOne({
      userId,
      bookingDate,
      layoutName,
    });

    if (existingBooking) {
      return res.status(200).json({ exists: true, booking: existingBooking });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (err) {
    console.error("Error checking booking:", err);
    return res.status(500).json({ error: "Error checking booking" });
  }
});


// DELETE route to delete a specific booking by seatId, date, and layoutName
router.delete("/delete-booking/:seatId/:date/:layoutName", async (req, res) => {
  const { seatId, date, layoutName } = req.params; // Destructure seatId, date, and layoutName from req.params

  try {
    // Find the booking by seatId, date, and layoutName
    const booking = await Booking.findOneAndDelete({
      seatId,
      bookingDate: new Date(date),
      layoutName, // Add layoutName to the query
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found for this seat, date, and layout" });
    }

    // Send notification email to the user about the cancellation
    const mailOptions = {
      from: "trainee.seat.reservation@gmail.com",
      to: booking.userEmail,
      subject: "Seat Unavailability Notification",
      text: `Dear ${booking.userName},\n\nWe regret to inform you that the seat you reserved (Seat ID: ${booking.seatId}) for ${booking.bookingDate.toISOString().split("T")[0]} in the layout "${layoutName}" has been marked as temporarily unavailable. We apologize for any inconvenience caused.\n\nPlease contact us for further assistance.\n\nBest regards,\nSeat Reservation System Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    return res.status(200).json({ success: "Booking deleted successfully" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    return res.status(500).json({ error: "Error deleting booking" });
  }
});


// GET route to fetch booking history for a specific date and layoutName
router.get("/history/:date/:layoutName", async (req, res) => {
  const { date, layoutName } = req.params;

  try {
    const bookings = await Booking.find({ bookingDate: date, layoutName: layoutName });
    if (bookings.length > 0) {
      return res.status(200).json(bookings);
    } else {
      return res.status(404).json({ error: "No bookings found for this date and layout" });
    }
  } catch (err) {
    console.error("Error fetching booking history:", err);
    return res.status(500).json({ error: "Error fetching booking history" });
  }
});


// GET route to fetch bookings for a specific user
router.get("/user-bookings/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Modify the query to populate the necessary fields
    const bookings = await Booking.find({ userId }).select('seatId layoutName bookingDate'); // Fetch only seatId and layoutName

    if (bookings.length > 0) {
      return res.status(200).json(bookings);
    } else {
      return res.status(404).json({ error: "No bookings found for this user" });
    }
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    return res.status(500).json({ error: "Error fetching user bookings" });
  }
});

// GET route to fetch bookings for a specific user and specific date, including layoutName
router.get("/user-bookings/:userId/date/:date", async (req, res) => {
  const { userId, date } = req.params;

  try {
    const bookings = await Booking.find({ userId, bookingDate: date }).select("layoutName otherFields"); // Add other fields as necessary

    if (bookings.length > 0) {
      return res.status(200).json(bookings);
    } else {
      return res.status(404).json({ error: "No bookings found for this user on this date" });
    }
  } catch (err) {
    console.error("Error fetching user bookings for specific date:", err);
    return res.status(500).json({ error: "Error fetching user bookings for specific date" });
  }
});

// New route to check if a user has already reserved a seat on a specific date and layout
router.get("/user-booking-check/:userId/layout/:layoutName/date/:date", async (req, res) => {
  const { userId, layoutName, date } = req.params;

  try {
    const existingBooking = await Booking.findOne({ userId, bookingDate: date, layoutName });

    if (existingBooking) {
      return res.status(200).json({ reserved: true });
    } else {
      return res.status(200).json({ reserved: false });
    }
  } catch (err) {
    console.error("Error checking user booking:", err);
    return res.status(500).json({ error: "Error checking user booking" });
  }
});


// PATCH route to update attendance status for a booking (reservation)
router.patch("/update-attendance/:id", async (req, res) => {
  const { id } = req.params;
  const { attended } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    booking.attended = attended;
    await booking.save();
    return res.status(200).json({ success: "Attendance updated", booking });
  } catch (err) {
    console.error("Error updating attendance:", err);
    return res.status(500).json({ error: "Error updating attendance" });
  }
});

// DELETE route to delete a specific booking
router.delete("/delete-booking/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the booking before deleting it to get layoutName and seatId
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Proceed to delete the booking
    await Booking.findByIdAndDelete(id);

    // Return success response with layoutName and seatId
    return res.status(200).json({
      success: "Booking deleted successfully",
      layoutName: booking.layoutName,
      seatId: booking.seatId,
    });
  } catch (err) {
    console.error("Error deleting booking:", err);
    return res.status(500).json({ error: "Error deleting booking" });
  }
});


// GET route to fetch all bookings
router.get("/bookings/all", async (req, res) => {
  try {
    const bookings = await Booking.find({});
    return res.status(200).json(bookings);
  } catch (err) {
    return res.status(500).json({ error: "Error fetching bookings" });
  }
});

// GET route to fetch users with both attendance statuses for a specific date
router.get("/attendance-summary/:date", async (req, res) => {
  const { date } = req.params;

  try {
    const attended = await Booking.find({ bookingDate: date, attended: true });
    const notAttended = await Booking.find({ bookingDate: date, attended: false });

    return res.status(200).json({ attended, notAttended });
  } catch (err) {
    console.error("Error fetching attendance summary:", err);
    return res.status(500).json({ error: "Error fetching attendance summary" });
  }
});


// Fetch reserved seats based on booking date and layout name
router.get("/reserved-seats/:date/:layoutName", async (req, res) => {
  const { date, layoutName } = req.params;

  try {
    // Query the Booking collection for the given date and layout name
    const bookings = await Booking.find({ bookingDate: date, layoutName });
    
    // If bookings exist, return them with status 200
    if (bookings.length > 0) {
      return res.status(200).json(bookings);
    } else {
      // If no bookings are found, return 404 with an error message
      return res.status(404).json({});
    }
  } catch (err) {
    // Handle any errors during the query process
    console.error("Error fetching reserved seats:", err);
    return res.status(500).json({});
  }
});

// POST route to add a holiday
router.post('/holiday', async (req, res) => {
  const { date, message } = req.body;

  // Validate the request body
  if (!date || !message) {
    return res.status(400).json({ error: 'Date and message are required.' });
  }

  try {
    // Create a new holiday
    const holiday = new Holiday({ date, message });
    await holiday.save();
    return res.status(201).json({ message: 'Holiday added successfully.', holiday });
  } catch (error) {
    return res.status(500).json({ error: 'Error adding holiday.', details: error.message });
  }
});

// GET route to retrieve all holidays
router.get("/holiday2", async (req, res) => {
  try {
    const holidays = await Holiday.find();
    res.json(holidays);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// DELETE route to remove a holiday by date
router.delete('/holiday/:date', async (req, res) => {
  const { date } = req.params;

  try {
    // Find and delete the holiday
    const result = await Holiday.findOneAndDelete({ date });

    if (!result) {
      return res.status(404).json({ error: 'Holiday not found.' });
    }

    return res.status(200).json({ message: 'Holiday deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error deleting holiday.', details: error.message });
  }
});
module.exports = router;
