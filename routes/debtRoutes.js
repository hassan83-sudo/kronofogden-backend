const express = require("express");
const router = express.Router();

const {
  getDebts,
  addDebt,
  updateDebt,
  payDebt,
  deleteDebt,
  autoDebt,
} = require("../controllers/debtController");

router.get("/", getDebts);
router.post("/", addDebt);
router.put("/:id", updateDebt);
router.post("/pay/:id", payDebt);
router.delete("/:id", deleteDebt);
router.post("/auto", autoDebt);

module.exports = router;