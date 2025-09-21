const express = require("express");
const cors = require("cors");
const User = require("./entities/User");
const Card = require("./entities/Card");
const Transaction = require("./entities/Transaction");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/user/me", async (req, res) => {
  const user = await User.me();
  res.json(user);
});

app.get("/api/cards", async (req, res) => {
  const cards = await Card.filter({});
  res.json(cards);
});

app.get("/api/transactions", async (req, res) => {
  const transactions = await Transaction.filter({});
  res.json(transactions);
});

app.listen(5000, () => console.log("Backend running on port 5000"));

