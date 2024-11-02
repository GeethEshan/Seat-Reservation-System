const express = require("express");
const router = express.Router();
const User = require("../modals/UserModal");
const PastTrainees = require("../modals/PastTraineesModal");
const PastBookings = require("../modals/PastBookingsModal"); // Import the PastBookings model
const Booking = require("../modals/BookingModal"); // Import the Booking model
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  "898926845547-r7h9jlmgom538bnjuh2kigivmuh90qpk.apps.googleusercontent.com"
);

// Route to add a new user
router.post("/user/add", async (req, res) => {
  const { name, nicNo, contactNo, email, password } = req.body;

  try {
    const userExistsemail = await User.findOne({ email });
    if (userExistsemail) {
      return res.status(400).json({ error: "User already exists" });
    } else {
      const newUser = new User({ name, nicNo, contactNo, email, password });
      await newUser.save();
      return res
        .status(200)
        .json({ success: "User saved successfully", newUser });
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Route for Google Sign-In
router.post("/user/google-signin", async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience:
        "898926845547-r7h9jlmgom538bnjuh2kigivmuh90qpk.apps.googleusercontent.com",
    });
    const payload = ticket.getPayload();

    // Check if user already exists in your database by email (if provided)
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // If the user does not exist, create a new one
      user = new User({
        name: payload.name || "", // Ensure name has a default empty string if missing
        email: payload.email || "", // Email can be empty if not provided by Google
        contactNo: "", // Default as empty
        nicNo: "", // Default as empty
        password: "", // No password required for OAuth-based login
      });
      await user.save();
    }

    // Respond with success and user info (excluding password)
    res.json({ success: true, message: "User signed in successfully", user });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Invalid token" });
  }
});

// Facebook sign-in route
router.post("/user/facebook-signin", async (req, res) => {
  const { userInfo } = req.body; // Extract accessToken and userInfo

  // Extract name and email from userInfo object
  const { name, email } = userInfo;

  try {
    let user;

    // Check if a user already exists by name
    if (name) {
      user = await User.findOne({ name });
    }

    // If the user does not exist, create a new user
    if (!user) {
      user = new User({
        name: name || "", // Ensure name is provided, or default to empty string
        email: email || "", // Default email to an empty string if not provided
        nicNo: "", // Default as empty since Facebook doesn't provide it
        contactNo: "", // Default as empty since Facebook doesn't provide it
        password: "", // No password required for Facebook sign-in
      });
      await user.save();
    }

    // Send a success response with user data (excluding password)
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        nicNo: user.nicNo,
        contactNo: user.contactNo,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Route to get a user by email and password
router.get("/user/get", async (req, res) => {
  const { email, password } = req.query;

  try {
    const findUser = await User.findOne({ email });
    if (findUser) {
      if (findUser.password === password) {
        return res
          .status(200)
          .json({ success: "User login successful", findUser });
      } else {
        return res.status(401).json({ error: "Invalid password" });
      }
    } else {
      return res.status(401).json({ error: "Invalid username" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Route to fetch all users
router.get("/user/get-all", async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: "Error fetching users" });
  }
});

// Route to update a user by ID
router.put("/user/update/:id", async (req, res) => {
  const { name, nicNo, contactNo, email } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, nicNo, contactNo, email },
      { new: true }
    );
    return res
      .status(200)
      .json({ success: "User updated successfully", updatedUser });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Route to remove a user and move to past trainees
router.delete("/user/remove/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      // Fetch bookings associated with the user
      const bookings = await Booking.find({ userId: user._id });

      // Move user data to PastTrainees
      const pastTraineeData = {
        name: user.name,
        nicNo: user.nicNo,
        contactNo: user.contactNo,
        email: user.email,
      };
      await PastTrainees.create(pastTraineeData);

      // Move booking data to PastBookings and remove from Bookings
      for (const booking of bookings) {
        const pastBookingData = {
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          userContactNo: user.contactNo,
          userNicNo: user.nicNo,
          bookingDate: booking.bookingDate,
          seatNumber: booking.seatNumber,
          attended: booking.attended,
        };
        await PastBookings.create(pastBookingData);

        // Remove the booking from the Bookings table
        await Booking.deleteOne({ _id: booking._id }); // Remove from Bookings
      }

      // Now use findByIdAndDelete to remove the user
      await User.findByIdAndDelete(req.params.id);
      return res
        .status(200)
        .json({
          success: "User moved to past trainees and removed successfully",
        });
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
