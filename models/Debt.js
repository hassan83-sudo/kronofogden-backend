const mongoose = require("mongoose");

const debtSchema = new mongoose.Schema({
  name: String,
  amount: Number
});

module.exports = mongoose.model("Debt", debtSchema);