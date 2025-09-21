const { Pool } = require("pg");

// ⚡ Connexion PostgreSQL intégrée
const pool = new Pool({
  user: "winner",
  host: "localhost",
  database: "caredit",
  password: "winner2007",
  port: 5432,
});

const Transaction = {
  // Récupérer plusieurs transactions avec filtres
  filter: async (filter = {}, orderBy = "-created_at", limit = null) => {
    let query = "SELECT * FROM transactions";
    const values = [];
    const conditions = [];

    let i = 1;
    for (const key in filter) {
      conditions.push(`${key} = $${i}`);
      values.push(filter[key]);
      i++;
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    if (orderBy) {
      const direction = orderBy.startsWith("-") ? "DESC" : "ASC";
      const column = orderBy.replace("-", "");
      query += ` ORDER BY ${column} ${direction}`;
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const res = await pool.query(query, values);
    return res.rows;
  },

  // Créer une nouvelle transaction
  create: async (data) => {
    const query = `
      INSERT INTO transactions
      (type, amount, currency, recipient, recipient_phone, description, status, reference, service_type, provider, card_id, location, fees, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`;
    const values = [
      data.type,
      data.amount,
      data.currency || "CFA",
      data.recipient,
      data.recipient_phone || null,
      data.description || null,
      data.status || "completed",
      data.reference || null,
      data.service_type || null,
      data.provider || null,
      data.card_id || null,
      data.location || null,
      data.fees || 0,
      data.created_by || null,
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  // Récupérer une transaction par ID
  getById: async (id) => {
    const res = await pool.query("SELECT * FROM transactions WHERE id = $1", [id]);
    return res.rows[0];
  },

  // Mettre à jour une transaction par ID
  update: async (id, data) => {
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in data) {
      fields.push(`${key}=$${i}`);
      values.push(data[key]);
      i++;
    }
    values.push(id);

    const query = `UPDATE transactions SET ${fields.join(", ")} WHERE id=$${i} RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  },
};

module.exports = Transaction;

