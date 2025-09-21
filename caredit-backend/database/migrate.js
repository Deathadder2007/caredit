const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  user: process.env.DB_USER || 'winner',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'caredit',
  password: process.env.DB_PASSWORD || 'winner2007',
  port: parseInt(process.env.DB_PORT) || 5432,
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Début de la migration de la base de données...');
    
    // Lire le fichier de schéma
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Exécuter le schéma
    await pool.query(schema);
    
    console.log('✅ Migration terminée avec succès!');
    console.log('📊 Base de données CareCredit créée et configurée');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;