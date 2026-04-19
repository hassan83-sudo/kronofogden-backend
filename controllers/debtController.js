const Debt = require("../models/debtModel");

exports.getDebts = async (req, res) => {
  const debts = await Debt.find();
  res.json(debts);
};

exports.addDebt = async (req, res) => {
  const newDebt = new Debt({
    name: req.body.name,
    amount: req.body.amount
  });

  await newDebt.save();
  res.json(newDebt);
};

exports.payDebt = async (req, res) => {
  try {
    await Debt.findByIdAndUpdate(req.params.id, {
      paid: true
    });

    res.json({ message: "Debt marked as paid" });
  } catch (err) {
    res.status(500).json(err);
  }
};