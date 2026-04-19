const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const debtRoutes = require("./routes/debtRoutes");

const app = express();
mongoose.connect("mongodb+srv://hassan83_db_user:Test12345@kronofogden.ni6d17h.mongodb.net/?appName=Kronofogden")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

app.use(cors());
app.use(express.json());

app.use("/api/debts", debtRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});