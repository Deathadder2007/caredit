const bcrypt = require('bcryptjs');
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

async function seedDatabase() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🌱 Début du seeding de la base de données...');
    
    // Créer un utilisateur de test
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash('password123', saltRounds);
    
    const userResult = await pool.query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone_number,
        address, city, country, balance, is_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, [
      'test@caredit.com',
      passwordHash,
      'Jean',
      'Dupont',
      '+228 90 12 34 56',
      '123 Rue de la Paix',
      'Lomé',
      'Togo',
      100000, // 100,000 CFA
      true,
      true
    ]);
    
    const userId = userResult.rows[0].id;
    console.log('✅ Utilisateur de test créé:', userId);
    
    // Créer des limites de transaction pour l'utilisateur
    await pool.query(`
      INSERT INTO transaction_limits (user_id, daily_limit, monthly_limit, single_transaction_limit)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        daily_limit = EXCLUDED.daily_limit,
        monthly_limit = EXCLUDED.monthly_limit,
        single_transaction_limit = EXCLUDED.single_transaction_limit
    `, [userId, 1000000, 5000000, 500000]);
    
    console.log('✅ Limites de transaction créées');
    
    // Créer des cartes de test
    const cards = [
      {
        card_number: '4532 1234 5678 9012',
        card_type: 'virtual',
        card_brand: 'visa',
        status: 'active',
        expiry_date: '12/28',
        cvv: '123',
        daily_limit: 500000,
        monthly_limit: 2000000,
        is_default: true
      },
      {
        card_number: '5555 1234 5678 9012',
        card_type: 'physical',
        card_brand: 'mastercard',
        status: 'active',
        expiry_date: '06/29',
        cvv: '456',
        daily_limit: 1000000,
        monthly_limit: 5000000,
        is_default: false
      }
    ];
    
    for (const cardData of cards) {
      await pool.query(`
        INSERT INTO cards (
          user_id, card_number, card_type, card_brand, status,
          expiry_date, cvv, daily_limit, monthly_limit, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (card_number) DO NOTHING
      `, [
        userId,
        cardData.card_number,
        cardData.card_type,
        cardData.card_brand,
        cardData.status,
        cardData.expiry_date,
        cardData.cvv,
        cardData.daily_limit,
        cardData.monthly_limit,
        cardData.is_default
      ]);
    }
    
    console.log('✅ Cartes de test créées');
    
    // Créer des transactions de test
    const transactions = [
      {
        type: 'transfer',
        amount: 25000,
        currency: 'CFA',
        recipient: 'Marie Kouakou',
        recipient_phone: '+228 90 98 76 54',
        description: 'Transfert pour les courses',
        status: 'completed',
        reference: 'TRF20241201001',
        provider: 'myfeda',
        fees: 50
      },
      {
        type: 'bill_payment',
        amount: 15000,
        currency: 'CFA',
        description: 'Paiement facture électricité',
        status: 'completed',
        reference: 'BILL20241201002',
        service_type: 'Électricité',
        provider: 'CEET',
        fees: 0
      },
      {
        type: 'payment',
        amount: 5000,
        currency: 'CFA',
        description: 'Achat en ligne',
        status: 'completed',
        reference: 'PAY20241201003',
        fees: 0
      }
    ];
    
    for (const txData of transactions) {
      await pool.query(`
        INSERT INTO transactions (
          user_id, type, amount, currency, recipient, recipient_phone,
          description, status, reference, service_type, provider, fees
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (reference) DO NOTHING
      `, [
        userId,
        txData.type,
        txData.amount,
        txData.currency,
        txData.recipient,
        txData.recipient_phone,
        txData.description,
        txData.status,
        txData.reference,
        txData.service_type,
        txData.provider,
        txData.fees
      ]);
    }
    
    console.log('✅ Transactions de test créées');
    
    // Créer des contacts de test
    const contacts = [
      {
        name: 'Marie Kouakou',
        phone_number: '+228 90 98 76 54',
        email: 'marie.kouakou@email.com',
        is_favorite: true
      },
      {
        name: 'Jean Agbodji',
        phone_number: '+228 90 11 22 33',
        email: 'jean.agbodji@email.com',
        is_favorite: false
      },
      {
        name: 'Afi Kossi',
        phone_number: '+228 99 88 77 66',
        email: 'afi.kossi@email.com',
        is_favorite: true
      }
    ];
    
    for (const contactData of contacts) {
      await pool.query(`
        INSERT INTO contacts (user_id, name, phone_number, email, is_favorite)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, phone_number) DO NOTHING
      `, [
        userId,
        contactData.name,
        contactData.phone_number,
        contactData.email,
        contactData.is_favorite
      ]);
    }
    
    console.log('✅ Contacts de test créés');
    
    // Créer des notifications de test
    const notifications = [
      {
        title: 'Bienvenue sur CareCredit!',
        message: 'Votre compte a été créé avec succès. Vous pouvez maintenant utiliser tous nos services.',
        type: 'success'
      },
      {
        title: 'Nouvelle carte créée',
        message: 'Votre carte Visa virtuelle a été créée avec succès.',
        type: 'info'
      },
      {
        title: 'Transfert effectué',
        message: 'Transfert de 25,000 CFA vers Marie Kouakou effectué avec succès.',
        type: 'success'
      }
    ];
    
    for (const notifData of notifications) {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
      `, [
        userId,
        notifData.title,
        notifData.message,
        notifData.type
      ]);
    }
    
    console.log('✅ Notifications de test créées');
    
    console.log('🎉 Seeding terminé avec succès!');
    console.log('📧 Email de test: test@caredit.com');
    console.log('🔑 Mot de passe: password123');
    console.log('💰 Solde initial: 100,000 CFA');
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le seeding si ce script est appelé directement
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;