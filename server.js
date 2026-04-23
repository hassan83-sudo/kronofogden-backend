require("dotenv").config(); // 👈 DEN HÄR RADEN ÄR NY

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const debtRoutes = require("./routes/debtRoutes");
app.use("/api/debts", debtRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });

// Root route
app.get("/", (req, res) => {
  res.send("Kronofogden Backend is running");
});

// PORT fix för Render + lokal dator
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});