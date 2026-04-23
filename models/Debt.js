const mongoose = require("mongoose");

const debtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paid: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium"
    },
    monthlyPayment: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Debt", debtSchema);