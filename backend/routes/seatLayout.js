// routes/seatLayoutRoutes.js
const express = require('express');
const router = express.Router();
const SeatLayout = require('../modals/SeatLayout');
const Booking = require("../modals/BookingModal");
const TemporarilyUnavailableSeat = require("../modals/TemporarilyUnavailableSeat");

// POST route to save the seat layout
router.post('/saveLayout', async (req, res) => {
  const { layoutName, seatPositions } = req.body;

  // Validate request body
  if (!layoutName || !Array.isArray(seatPositions)) {
    return res.status(400).json({ error: 'Invalid request data.' });
  }

  // Create a new seat layout
  const seatLayout = new SeatLayout({
    layoutName,
    seatPositions,
  });

  try {
    const savedLayout = await seatLayout.save();
    res.status(201).json(savedLayout);
  } catch (error) {
    console.error('Error saving layout:', error);
    res.status(500).json({ error: 'Failed to save layout.' });
  }
});

// GET route to retrieve all seat layouts
router.get('/', async (req, res) => {
  try {
    const layouts = await SeatLayout.find(); // Fetch all layouts from the database
    res.status(200).json(layouts);
  } catch (error) {
    console.error('Error fetching layouts:', error);
    res.status(500).json({ error: 'Failed to fetch layouts.' });
  }
});

// Route to get all layout names
router.get("/layout-names", async (req, res) => {
  try {
    // Fetch all seat layouts
    const layouts = await SeatLayout.find({}, 'layoutName'); // Only fetch layoutName
    res.json(layouts);
  } catch (error) {
    console.error("Error fetching layout names:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT route to update a specific seat layout
router.put('/:id', async (req, res) => {
  const { layoutName, seatPositions } = req.body;

  // Validate request body
  if (!layoutName || !Array.isArray(seatPositions)) {
    return res.status(400).json({ error: 'Invalid request data.' });
  }

  try {
    const updatedLayout = await SeatLayout.findByIdAndUpdate(
      req.params.id,
      { layoutName, seatPositions },
      { new: true } // Return the updated document
    );

    if (!updatedLayout) {
      return res.status(404).json({ error: 'Layout not found.' });
    }

    res.status(200).json(updatedLayout);
  } catch (error) {
    console.error('Error updating layout:', error);
    res.status(500).json({ error: 'Failed to update layout.' });
  }
});

// DELETE route to delete a specific seat layout
router.delete('/:id', async (req, res) => {
  try {
    const deletedLayout = await SeatLayout.findByIdAndDelete(req.params.id);

    if (!deletedLayout) {
      return res.status(404).json({ error: 'Layout not found.' });
    }

    res.status(200).json({ message: 'Layout deleted successfully.' });
  } catch (error) {
    console.error('Error deleting layout:', error);
    res.status(500).json({ error: 'Failed to delete layout.' });
  }
});

// Route to make a seat temporarily unavailable
router.post('/unavailable-seats', async (req, res) => {
  const { date, seatId, layoutName } = req.body; // Destructure layoutName from the request body

  // Validate input
  if (!date || !seatId || !layoutName) {
    return res.status(400).json({ message: 'Date, seatId, and layoutName are required.' });
  }

  try {
    // Create a new TemporarilyUnavailableSeat
    const unavailableSeat = new TemporarilyUnavailableSeat({
      date,
      seatId,
      layoutName, // Include layoutName in the new object
    });

    // Save the unavailable seat to the database
    await unavailableSeat.save();

    // Return success response
    res.status(201).json({ message: 'Seat marked as temporarily unavailable.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while marking the seat as unavailable.' });
  }
});

// Route to get temporarily unavailable seats for a specific date and layout
router.get('/unavailable-seats/:date/:layoutName', async (req, res) => {
  const { date, layoutName } = req.params;

  try {
    // Find temporarily unavailable seats matching the date and layout name
    const unavailableSeats = await TemporarilyUnavailableSeat.find({
      date: date,
      layoutName: layoutName,
    });

    // Check if any seats were found
    if (unavailableSeats.length === 0) {
      return res.status(404).json({ message: 'No unavailable seats found for this date and layout.' });
    }

    // Respond with the found seats
    return res.status(200).json(unavailableSeats);
  } catch (error) {
    console.error("Error fetching unavailable seats:", error);
    return res.status(500).json({ message: 'Server error while fetching unavailable seats.' });
  }
});

// Route to delete temporarily unavailable seats for a specific date, layout, and seat ID
router.delete('/unavailable-seats/:date/:layoutName/:seatId', async (req, res) => {
  const { date, layoutName, seatId } = req.params;

  try {
    // Find and delete the temporarily unavailable seat matching the date, layout name, and seat ID
    const deletedSeat = await TemporarilyUnavailableSeat.findOneAndDelete({
      date: date,
      layoutName: layoutName,
      seatId: seatId
    });

    // Check if the seat was deleted
    if (!deletedSeat) {
      return res.status(404).json({ message: 'No unavailable seat found for this date, layout, and seat ID to delete.' });
    }

    // Respond with a success message
    return res.status(200).json({ message: `Seat ${seatId} deleted successfully.` });
  } catch (error) {
    console.error("Error deleting unavailable seats:", error);
    return res.status(500).json({ message: 'Server error while deleting unavailable seats.' });
  }
});

router.get('/available-seats', async (req, res) => {
  const { date } = req.query; // Expecting date to be passed as a query parameter

  try {
    // Step 1: Get all seat layouts
    const layouts = await SeatLayout.find();

    // Step 2: Get temporarily unavailable seats for the specified date
    const unavailableSeats = await TemporarilyUnavailableSeat.find({ date });

    // Step 3: Get reserved seats for the specified date
    const reservedSeats = await Booking.find({ bookingDate: date });

    // Step 4: Calculate available seats count
    const availableSeatsCount = layouts.map(layout => {
      const layoutUnavailableSeats = unavailableSeats
        .filter(unavailable => unavailable.layoutName === layout.layoutName)
        .map(unavailable => unavailable.seatId);
      
      const layoutReservedSeats = reservedSeats
        .filter(reservation => reservation.layoutName === layout.layoutName)
        .map(reservation => reservation.seatId);

      // All seatIds in this layout
      const allSeats = layout.seatPositions.map(seat => seat.seatId);
      
      // Calculate available seats
      const availableCount = allSeats.filter(seatId => 
        !layoutUnavailableSeats.includes(seatId) &&
        !layoutReservedSeats.includes(seatId)
      ).length; // Get the count of available seats

      return {
        layoutName: layout.layoutName,
        availableSeats: availableCount, // Return the count instead of the IDs
      };
    });

    res.status(200).json(availableSeatsCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
