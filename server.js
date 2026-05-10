const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));

const JWT_SECRET = "SECRET_KEY";

mongoose.connect("mongodb://127.0.0.1:27017/betalningsapp")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: String,
    index: true,
    default: null
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  monthlyPayment: {
    type: Number,
    default: 0,
    min: 0
  },

  deadline: {
    type: Date,
    default: null
  },

  paid: {
    type: Boolean,
    default: false
  },

  paidAt: {
    type: Date,
    default: null
  },

  paymentHistory: [
    {
      paidAt: {
        type: Date,
        default: Date.now
      },
      amount: {
        type: Number,
        default: 0
      }
    }
  ],

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },

  timeStatus: {
    type: String,
    default: ""
  },

  requestedMoreTime: {
    type: Boolean,
    default: false
  },

  timeApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Ingen token" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Ogiltig token" });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Endast admin" });
  }

  next();
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email och lösenord krävs"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Användaren finns redan"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false
    });

    res.json({
      message: "Registrering lyckades",
      userId: user._id,
      isAdmin: user.isAdmin
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Register error" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Fel email eller lösenord"
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Fel email eller lösenord"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        isAdmin: user.isAdmin
      },
      JWT_SECRET
    );

    res.json({
      token,
      userId: user._id,
      isAdmin: user.isAdmin
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
});

// ADMIN ser alla fakturor, customer ser bara sina egna
app.get("/api/invoices", auth, async (req, res) => {
  try {
    let filter = {};

    if (!req.user.isAdmin) {
      filter = { userId: req.user.userId };
    }

    const invoices = await Invoice.find(filter).sort({ deadline: 1 });
    res.json(invoices);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kunde inte hämta fakturor" });
  }
});

// ADMIN: skapa faktura
app.post("/api/invoices", auth, adminOnly, async (req, res) => {
  try {
    const { userId, name, amount, monthlyPayment, deadline } = req.body;

    if (!userId || !name || !amount) {
      return res.status(400).json({
        message: "userId, name och amount krävs"
      });
    }

    const invoice = await Invoice.create({
      userId,
      name,
      amount,
      monthlyPayment: monthlyPayment || 0,
      deadline: deadline || null,
      paid: false,
      paidAt: null,
      paymentHistory: [],
      timeStatus: ""
    });

    res.status(201).json(invoice);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kunde inte skapa faktura" });
  }
});

// USER: betala egen faktura
app.post("/api/invoices/pay/:id", auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Faktura hittades inte" });
    }

    if (!req.user.isAdmin && String(invoice.userId) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Du får inte betala denna faktura" });
    }

    if (invoice.paid) {
      return res.status(400).json({ message: "Fakturan är redan betald" });
    }

    const now = new Date();

    invoice.paid = true;
    invoice.paidAt = now;

    invoice.paymentHistory.push({
      paidAt: now,
      amount: invoice.amount
    });

    await invoice.save();

    res.json({
      message: "Fakturan betalades",
      invoice
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kunde inte markera som betald" });
  }
});

// ADMIN: ta bort faktura
app.delete("/api/invoices/:id", auth, adminOnly, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Faktura hittades inte" });
    }

    res.json({ message: "Faktura borttagen" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kunde inte ta bort faktura" });
  }
});

app.listen(3000, () => {
  console.log("Server körs på http://127.0.0.1:3000");
});