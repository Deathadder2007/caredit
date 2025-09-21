const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  user: process.env.DB_USER || 'winner',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'caredit',
  password: process.env.DB_PASSWORD || 'winner2007',
  port: parseInt(process.env.DB_PORT) || 5432,
  max: 20, // Nombre maximum de connexions dans le pool
  idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30s
  connectionTimeoutMillis: 2000, // Timeout de connexion de 2s
};

// Création du pool de connexions
const pool = new Pool(dbConfig);

// Gestion des erreurs du pool
pool.on('error', (err) => {
  console.error('Erreur inattendue du client PostgreSQL:', err);
  process.exit(-1);
});

// Fonction pour tester la connexion
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connexion à la base de données PostgreSQL réussie');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    return false;
  }
};

// Fonction pour exécuter une requête
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Requête exécutée:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Erreur lors de l\'exécution de la requête:', err);
    throw err;
  }
};

// Fonction pour obtenir un client du pool
const getClient = async () => {
  return await pool.connect();
};

// Fonction pour fermer le pool
const closePool = async () => {
  await pool.end();
  console.log('Pool de connexions fermé');
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool
};