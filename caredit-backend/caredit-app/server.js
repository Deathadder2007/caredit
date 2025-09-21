const express = require("express");
const cors = require("cors");
const User = require("./entities/User");
const Card = require("./entities/Card");
const Transaction = require("./entities/Transaction");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Récupérer infos user
app.get("/api/user/me", async (req, res) => {
  try {
    const user = await User.me();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mettre à jour infos user
app.put("/api/user/me", async (req, res) => {
  try {
    const user = await User.updateMyUserData(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Récupérer toutes les cartes
app.get("/api/cards", async (req, res) => {
  try {
    const cards = await Card.filter({});
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Créer une nouvelle carte
app.post("/api/cards", async (req, res) => {
  try {
    const card = await Card.create(req.body);
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Récupérer toutes les transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.filter({});
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Créer une nouvelle transaction
app.post("/api/transactions", async (req, res) => {
  try {
    const tx = await Transaction.create(req.body);
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("✅ Backend running on port 5000"));

