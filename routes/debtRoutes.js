const express = require("express");
const router = express.Router();

const {
  getDebts,
  addDebt,
  payDebt,
} = require("../controllers/debtController");

router.get("/", getDebts);
router.post("/", addDebt);
router.post("/pay/:id", payDebt);

module.exports = router;