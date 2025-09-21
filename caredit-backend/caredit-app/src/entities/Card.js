const { Pool } = require('pg');

// ⚡ Configuration PostgreSQL intégrée
const pool = new Pool({
  user: 'winner',
  host: 'localhost',
  database: 'caredit',
  password: 'winner2007',
  port: 5432,
});

const Card = {
  // 🔎 Utilitaire pour ajouter daily_usage & monthly_usage
  async attachUsages(cards) {
    if (!Array.isArray(cards)) cards = [cards];

    const ids = cards.map(c => c.id);
    if (ids.length === 0) return cards;

    const query = `
      SELECT 
        card_id,
        COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0) AS daily_usage,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS monthly_usage
      FROM transactions
      WHERE card_id = ANY($1)
      GROUP BY card_id
    `;
    const res = await pool.query(query, [ids]);

    const usageMap = {};
    res.rows.forEach(r => {
      usageMap[r.card_id] = {
        daily_usage: parseInt(r.daily_usage, 10),
        monthly_usage: parseInt(r.monthly_usage, 10),
      };
    });

    return cards.map(c => ({
      ...c,
      daily_usage: usageMap[c.id]?.daily_usage || 0,
      monthly_usage: usageMap[c.id]?.monthly_usage || 0,
    }));
  },

  // 📌 Récupérer plusieurs cartes
  filter: async (filter = {}, orderBy = "-created_date", limit = null) => {
    let query = "SELECT * FROM cards";
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
    return Card.attachUsages(res.rows);
  },

  // ➕ Créer une nouvelle carte
  create: async (data) => {
    const query = `
      INSERT INTO cards
      (card_number, card_type, card_brand, status, expiry_date, daily_limit, monthly_limit, is_default, pin_set, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`;
    const values = [
      data.card_number || null,
      data.card_type,
      data.card_brand || 'visa',
      data.status || 'pending',
      data.expiry_date || null,
      data.daily_limit || 500000,
      data.monthly_limit || 2000000,
      data.is_default || false,
      data.pin_set || false,
      data.created_by || null
    ];
    const res = await pool.query(query, values);
    return Card.attachUsages(res.rows[0]);
  },

  // 🔍 Récupérer une carte par ID
  getById: async (id) => {
    const res = await pool.query("SELECT * FROM cards WHERE id = $1", [id]);
    if (!res.rows[0]) return null;
    return Card.attachUsages(res.rows[0]);
  },

  // ✏️ Mettre à jour une carte par ID
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

    const query = `UPDATE cards SET ${fields.join(", ")} WHERE id=$${i} RETURNING *`;
    const res = await pool.query(query, values);
    return Card.attachUsages(res.rows[0]);
  },

  // ❌ Supprimer une carte
  delete: async (id) => {
    const res = await pool.query("DELETE FROM cards WHERE id=$1 RETURNING *", [id]);
    return res.rows[0];
  },

  // 🔍 Récupérer une carte avec usages calculés
  getWithUsage: async (id) => {
    const card = await Card.getById(id);
    if (!card) return null;
    return card; // attachUsages est déjà appelé dans getById
  },
};

module.exports = Card;

