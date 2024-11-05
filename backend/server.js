const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const path = require("path"); // Import path module
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8000; // Azure will provide the PORT in the environment variable
app.disable("x-powered-by");

// Middleware setup
app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      "https://delightful-field-01a8dcc00.5.azurestaticapps.net",  // Deployed frontend URL
      "http://localhost:3000" // Localhost for development
    ],
    credentials: true,
  })
);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'frontend', 'build'))); // Adjust this path based on where your build directory is

// Import and use routers
const UserRouter = require("./routes/UserRouter");
const BookingRouter = require("./routes/BookingDataRouter");
const AllSeatRouter = require("./routes/AllSeatRouter");
const seatLayoutRoutes = require('./routes/seatLayout');

app.use("/api/users", UserRouter);
app.use("/api/seats", AllSeatRouter);
app.use("/api/bookings", BookingRouter);
app.use('/api/seat-layout', seatLayoutRoutes);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: true,
  tls: {
    rejectUnauthorized: false,
  },
});

// Email sending endpoint for seat reservation confirmation
app.post("/api/email/send", (req, res) => {
  const { to, name, nicNo, seatNumber, bookingDate } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Seat Reservation Confirmation",
    text: `Hello ${name},\n\nYour seat has been reserved successfully!\n\nDetails:\n- Seat Number: ${seatNumber}\n- Booking Date: ${bookingDate}\n- NIC No: ${nicNo}\n\nThank you for using our service!`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send({ error: "Error sending email" });
    }
    res.send({ message: "Email sent successfully", info });
  });
});

// The "catchall" handler: for any request that doesn't match one above,
// send back index.html.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html')); // Ensure the path is correct for your setup
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Connect to MongoDB without deprecated options
mongoose
  .connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database is connected successfully");
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });
