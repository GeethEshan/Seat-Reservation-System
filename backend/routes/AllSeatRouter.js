// AllSeatRouter.js
const express = require("express");
const router = express.Router();
const AllSeat = require("../modals/SeatLayout");
const TemporarilyUnavailableSeat = require("../modals/TemporarilyUnavailableSeat");
const Booking = require("../modals/BookingModal"); // Missing import

// Create or update total seats
router.post("/allSeats/create", async (req, res) => {
  const { totalSeats } = req.body;

  if (typeof totalSeats !== "number" || totalSeats <= 0) {
    return res.status(400).json({ error: "Invalid number of seats" });
  }

  try {
    const seat = await AllSeat.findOneAndUpdate(
      {},
      { totalSeats: totalSeats },
      { new: true, upsert: true } // Create a new document if none exists
    );
    res.status(200).json({
      message: "Seats created/updated successfully",
      seat,
    });
  } catch (err) {
    console.error("Detailed error:", err);
    res.status(500).json({
      error: "Error creating/updating seats",
      details: err.message,
    });
  }
});

// Get total seats
router.get("/allSeats/getAll", async (req, res) => {
  try {
    const seat = await AllSeat.findOne({});
    if (!seat) {
      return res.status(404).json({ error: "No seats found" });
    }
    res.status(200).json({
      seat,
    });
  } catch (err) {
    console.error("Detailed error:", err);
    res.status(500).json({
      error: "Error retrieving seats",
      details: err.message,
    });
  }
});

router.get("/booked-seats/:date", async (req, res) => {
  const { date } = req.params;
  try {
    const bookings = await Booking.find({ bookingDate: date });
    const reservedSeats = bookings.map((booking) => booking.seatId); // Updated from seatNumber to seatId
    res.json({ reservedSeats });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch booked seats" });
  }
});

// Mark a seat as temporarily unavailable
router.post("/seats/mark-unavailable", async (req, res) => {
  const { date, seatId } = req.body; // Updated from seatNumber to seatId

  if (!date || !seatId) {
    return res.status(400).json({ error: "Date and seat ID are required" });
  }

  try {
    // Store the unavailable seat data in the database
    const unavailableSeat = new TemporarilyUnavailableSeat({
      date,
      seatId, // Updated from seatNumber to seatId
    });
    await unavailableSeat.save();

    res.status(200).json({
      message: "Seat marked as temporarily unavailable",
    });
  } catch (err) {
    console.error("Error marking seat unavailable:", err);
    res
      .status(500)
      .json({ error: "Error marking seat unavailable", details: err.message });
  }
});

// Fetch temporarily unavailable seats for a specific date
router.get("/seats/unavailable/:date", async (req, res) => {
  const { date } = req.params;
  try {
    const unavailableSeats = await TemporarilyUnavailableSeat.find({ date });
    res.status(200).json(unavailableSeats);
  } catch (err) {
    console.error("Error fetching temporarily unavailable seats:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch temporarily unavailable seats" });
  }
});

// Get temporarily unavailable seats for a specific date
router.get("/unavailable-seats/:date", async (req, res) => {
  const { date } = req.params;
  try {
    const seats = await TemporarilyUnavailableSeat.find({ date });
    res.json(seats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching unavailable seats" });
  }
});

// New route: Get temporarily unavailable seats formatted as an array
router.get("/formatted-unavailable-seats/:date", async (req, res) => {
  const { date } = req.params;
  try {
    const seats = await TemporarilyUnavailableSeat.find({ date });

    // Format the response to include an array of seat IDs
    const unavailableSeats = seats.map((seat) => seat.seatId); // Updated from seatNumber to seatId

    res.json({ unavailableSeats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching unavailable seats" });
  }
});

module.exports = router;

// Make a seat available again
router.post("/make-available", async (req, res) => {
  const { date, seatId } = req.body; // Updated from seatNumber to seatId
  try {
    await TemporarilyUnavailableSeat.deleteOne({ date, seatId }); // Updated from seatNumber to seatId
    res.json({ message: "Seat made available" });
  } catch (error) {
    res.status(500).json({ message: "Error making seat available" });
  }
});

// Get temporarily unavailable seats for a specific date
router.get("/temp-unavailable/:date", async (req, res) => {
  const { date } = req.params;
  try {
    const unavailableSeats = await TemporarilyUnavailableSeat.find({ date });
    res.json({
      unavailableSeats: unavailableSeats.map((seat) => seat.seatId), // Updated from seatNumber to seatId
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unavailable seats" });
  }
});

// Get temporarily unavailable all seats
router.get("/temp-unavailable", async (req, res) => {
  try {
    const unavailableSeats = await TemporarilyUnavailableSeat.find();

    // Return all fields of the seats, including seatId and date
    res.json({
      unavailableSeats: unavailableSeats.map((seat) => ({
        seatId: seat.seatId, // Updated from seatNumber to seatId
        date: seat.date,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unavailable seats" });
  }
});

// New DELETE route to remove an unavailable seat
router.delete("/temp-unavailable/:seatId", async (req, res) => { // Updated from seatNumber to seatId
  const { seatId } = req.params;

  try {
    const result = await TemporarilyUnavailableSeat.deleteOne({ seatId }); // Updated from seatNumber to seatId

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Seat not found" });
    }

    res.json({ message: "Seat successfully deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete the seat" });
  }
});

// GET route to fetch available seats for a specific date
router.get("/available-seats/:date", async (req, res) => {
  const { date } = req.params;

  try {
    // Get total seats
    const totalSeatsData = await AllSeat.findOne({});
    const totalSeats = totalSeatsData ? totalSeatsData.totalSeats : 0;

    // Get booked seats
    const bookings = await Booking.find({ bookingDate: date });
    const reservedSeats = bookings.map((booking) => booking.seatId); // Updated from seatNumber to seatId

    // Calculate available seats
    const availableSeats = [];
    for (let i = 1; i <= totalSeats; i++) {
      if (!reservedSeats.includes(i.toString())) {
        availableSeats.push(i);
      }
    }

    res.status(200).json({
      totalSeats,
      reservedSeats,
      availableSeats,
    });
  } catch (err) {
    console.error("Error fetching available seats:", err);
    res.status(500).json({ error: "Failed to fetch available seats" });
  }
});

module.exports = router;
