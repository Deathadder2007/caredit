const { Pool } = require('pg');

const pool = new Pool({
  user: 'winner',
  host: 'localhost',
  database: 'caredit',
  password: 'winner2007',
  port: 5432,
});

const User = {
  // Récupérer les infos du user courant (mock login)
  me: async () => {
    const res = await pool.query("SELECT * FROM users LIMIT 1");
    return res.rows[0];
  },

  // Mettre à jour les infos de l'utilisateur courant
  updateMyUserData: async (data) => {
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in data) {
      fields.push(`${key}=$${i}`);
      values.push(data[key]);
      i++;
    }

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id=1 RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  },
};

module.exports = User;

