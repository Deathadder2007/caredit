const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

class Card {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.cardNumber = data.card_number;
    this.cardType = data.card_type;
    this.cardBrand = data.card_brand;
    this.status = data.status;
    this.expiryDate = data.expiry_date;
    this.cvv = data.cvv;
    this.pinHash = data.pin_hash;
    this.dailyLimit = parseFloat(data.daily_limit || 0);
    this.monthlyLimit = parseFloat(data.monthly_limit || 0);
    this.isDefault = data.is_default;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.dailyUsage = data.daily_usage || 0;
    this.monthlyUsage = data.monthly_usage || 0;
  }

  // Générer un numéro de carte
  static generateCardNumber(brand) {
    const prefixes = {
      visa: '4',
      mastercard: '5',
      amex: '3'
    };

    const prefix = prefixes[brand] || '4';
    let cardNumber = prefix;
    
    // Générer 14 chiffres supplémentaires pour Visa/Mastercard, 13 pour Amex
    const digits = brand === 'amex' ? 13 : 14;
    
    for (let i = 0; i < digits; i++) {
      cardNumber += Math.floor(Math.random() * 10);
    }

    return cardNumber;
  }

  // Générer une date d'expiration (2 ans dans le futur)
  static generateExpiryDate() {
    const now = new Date();
    const year = now.getFullYear() + 2;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${month}/${year.toString().slice(-2)}`;
  }

  // Générer un CVV
  static generateCVV() {
    return String(Math.floor(Math.random() * 900) + 100);
  }

  // Créer une nouvelle carte
  static async create(cardData) {
    try {
      const {
        userId,
        cardType,
        cardBrand,
        dailyLimit = 500000,
        monthlyLimit = 2000000,
        isDefault = false
      } = cardData;

      // Générer les données de la carte
      const cardNumber = Card.generateCardNumber(cardBrand);
      const expiryDate = Card.generateExpiryDate();
      const cvv = Card.generateCVV();

      // Vérifier si c'est la première carte de l'utilisateur
      const existingCards = await query(
        'SELECT COUNT(*) as count FROM cards WHERE user_id = $1',
        [userId]
      );

      const isFirstCard = parseInt(existingCards.rows[0].count) === 0;

      // Si c'est la première carte ou si elle est définie comme défaut, la rendre par défaut
      const shouldBeDefault = isFirstCard || isDefault;

      // Si cette carte doit être par défaut, retirer le statut par défaut des autres cartes
      if (shouldBeDefault) {
        await query(
          'UPDATE cards SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }

      // Insérer la nouvelle carte
      const result = await query(
        `INSERT INTO cards (
          user_id, card_number, card_type, card_brand, status,
          expiry_date, cvv, daily_limit, monthly_limit, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          userId, cardNumber, cardType, cardBrand, 'pending',
          expiryDate, cvv, dailyLimit, monthlyLimit, shouldBeDefault
        ]
      );

      const card = new Card(result.rows[0]);
      return await Card.attachUsages([card]);
    } catch (error) {
      console.error('Erreur lors de la création de la carte:', error);
      throw error;
    }
  }

  // Attacher les informations d'usage aux cartes
  static async attachUsages(cards) {
    try {
      if (!Array.isArray(cards)) cards = [cards];

      const cardIds = cards.map(c => c.id);
      if (cardIds.length === 0) return cards;

      const usageQuery = `
        SELECT 
          card_id,
          COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0) AS daily_usage,
          COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) AS monthly_usage
        FROM transactions
        WHERE card_id = ANY($1) AND status = 'completed'
        GROUP BY card_id
      `;

      const usageResult = await query(usageQuery, [cardIds]);

      const usageMap = {};
      usageResult.rows.forEach(row => {
        usageMap[row.card_id] = {
          daily_usage: parseInt(row.daily_usage, 10),
          monthly_usage: parseInt(row.monthly_usage, 10)
        };
      });

      return cards.map(card => ({
        ...card,
        daily_usage: usageMap[card.id]?.daily_usage || 0,
        monthly_usage: usageMap[card.id]?.monthly_usage || 0
      }));
    } catch (error) {
      console.error('Erreur lors de l\'attachement des usages:', error);
      return cards;
    }
  }

  // Trouver une carte par ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM cards WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const card = new Card(result.rows[0]);
      const cardsWithUsage = await Card.attachUsages([card]);
      return cardsWithUsage[0];
    } catch (error) {
      console.error('Erreur lors de la recherche de la carte:', error);
      throw error;
    }
  }

  // Trouver les cartes d'un utilisateur
  static async findByUserId(userId, options = {}) {
    try {
      const { status, cardType, isDefault } = options;
      
      let queryText = 'SELECT * FROM cards WHERE user_id = $1';
      const params = [userId];
      let paramIndex = 2;

      if (status) {
        queryText += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (cardType) {
        queryText += ` AND card_type = $${paramIndex}`;
        params.push(cardType);
        paramIndex++;
      }

      if (isDefault !== undefined) {
        queryText += ` AND is_default = $${paramIndex}`;
        params.push(isDefault);
        paramIndex++;
      }

      queryText += ' ORDER BY created_at DESC';

      const result = await query(queryText, params);
      const cards = result.rows.map(row => new Card(row));
      
      return await Card.attachUsages(cards);
    } catch (error) {
      console.error('Erreur lors de la recherche des cartes:', error);
      throw error;
    }
  }

  // Filtrer les cartes avec options
  static async filter(filter = {}, orderBy = '-created_at', limit = null) {
    try {
      let queryText = 'SELECT * FROM cards';
      const params = [];
      const conditions = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(filter)) {
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }

      if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
      }

      if (orderBy) {
        const direction = orderBy.startsWith('-') ? 'DESC' : 'ASC';
        const column = orderBy.replace('-', '');
        queryText += ` ORDER BY ${column} ${direction}`;
      }

      if (limit) {
        queryText += ` LIMIT $${paramIndex}`;
        params.push(limit);
      }

      const result = await query(queryText, params);
      const cards = result.rows.map(row => new Card(row));
      
      return await Card.attachUsages(cards);
    } catch (error) {
      console.error('Erreur lors du filtrage des cartes:', error);
      throw error;
    }
  }

  // Mettre à jour une carte
  async update(updateData) {
    try {
      const allowedFields = [
        'status', 'daily_limit', 'monthly_limit', 'is_default'
      ];

      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (allowedFields.includes(dbField) && value !== undefined) {
          fields.push(`${dbField} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      values.push(this.id);

      const result = await query(
        `UPDATE cards SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      return new Card(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la carte:', error);
      throw error;
    }
  }

  // Définir le PIN de la carte
  async setPin(pin) {
    try {
      if (!/^\d{4}$/.test(pin)) {
        throw new Error('Le PIN doit contenir exactement 4 chiffres');
      }

      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const pinHash = await bcrypt.hash(pin, saltRounds);

      await query(
        'UPDATE cards SET pin_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [pinHash, this.id]
      );

      this.pinHash = pinHash;
      return true;
    } catch (error) {
      console.error('Erreur lors de la définition du PIN:', error);
      throw error;
    }
  }

  // Vérifier le PIN de la carte
  async verifyPin(pin) {
    try {
      if (!this.pinHash) {
        throw new Error('PIN non défini pour cette carte');
      }

      return await bcrypt.compare(pin, this.pinHash);
    } catch (error) {
      console.error('Erreur lors de la vérification du PIN:', error);
      throw error;
    }
  }

  // Vérifier les limites de la carte
  async checkLimits(amount) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Vérifier l'usage quotidien
      const dailyUsageResult = await query(
        'SELECT COALESCE(SUM(amount), 0) as usage FROM transactions WHERE card_id = $1 AND created_at >= $2 AND status = $3',
        [this.id, todayStart, 'completed']
      );

      const dailyUsage = parseFloat(dailyUsageResult.rows[0].usage);

      // Vérifier l'usage mensuel
      const monthlyUsageResult = await query(
        'SELECT COALESCE(SUM(amount), 0) as usage FROM transactions WHERE card_id = $1 AND created_at >= $2 AND status = $3',
        [this.id, monthStart, 'completed']
      );

      const monthlyUsage = parseFloat(monthlyUsageResult.rows[0].usage);

      const errors = [];

      if (dailyUsage + amount > this.dailyLimit) {
        errors.push(`Limite quotidienne dépassée: ${dailyUsage + amount} > ${this.dailyLimit}`);
      }

      if (monthlyUsage + amount > this.monthlyLimit) {
        errors.push(`Limite mensuelle dépassée: ${monthlyUsage + amount} > ${this.monthlyLimit}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        dailyUsage,
        monthlyUsage,
        remainingDaily: this.dailyLimit - dailyUsage,
        remainingMonthly: this.monthlyLimit - monthlyUsage
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des limites:', error);
      throw error;
    }
  }

  // Supprimer une carte
  async delete() {
    try {
      // Vérifier s'il y a des transactions en cours
      const pendingTransactions = await query(
        'SELECT COUNT(*) as count FROM transactions WHERE card_id = $1 AND status = $2',
        [this.id, 'pending']
      );

      if (parseInt(pendingTransactions.rows[0].count) > 0) {
        throw new Error('Impossible de supprimer une carte avec des transactions en cours');
      }

      const result = await query(
        'DELETE FROM cards WHERE id = $1 RETURNING *',
        [this.id]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Erreur lors de la suppression de la carte:', error);
      throw error;
    }
  }

  // Obtenir l'historique des transactions de la carte
  async getTransactionHistory(limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT * FROM transactions 
         WHERE card_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [this.id, limit, offset]
      );

      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  // Convertir en JSON (sans données sensibles)
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      cardNumber: this.cardNumber,
      cardType: this.cardType,
      cardBrand: this.cardBrand,
      status: this.status,
      expiryDate: this.expiryDate,
      dailyLimit: this.dailyLimit,
      monthlyLimit: this.monthlyLimit,
      isDefault: this.isDefault,
      dailyUsage: this.dailyUsage,
      monthlyUsage: this.monthlyUsage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Card;