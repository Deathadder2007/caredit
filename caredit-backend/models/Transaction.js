const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.cardId = data.card_id;
    this.type = data.type;
    this.amount = parseFloat(data.amount || 0);
    this.currency = data.currency || 'CFA';
    this.recipient = data.recipient;
    this.recipientPhone = data.recipient_phone;
    this.description = data.description;
    this.status = data.status;
    this.reference = data.reference;
    this.serviceType = data.service_type;
    this.provider = data.provider;
    this.location = data.location;
    this.fees = parseFloat(data.fees || 0);
    this.exchangeRate = parseFloat(data.exchange_rate || 1);
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Générer une référence unique
  static generateReference(type) {
    const prefix = {
      transfer: 'TRF',
      payment: 'PAY',
      withdrawal: 'WTH',
      deposit: 'DEP',
      recharge: 'RCH',
      bill_payment: 'BILL'
    };

    const typePrefix = prefix[type] || 'TXN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${typePrefix}${timestamp}${random}`;
  }

  // Créer une nouvelle transaction
  static async create(transactionData) {
    try {
      const {
        userId,
        cardId,
        type,
        amount,
        currency = 'CFA',
        recipient,
        recipientPhone,
        description,
        serviceType,
        provider,
        location,
        fees = 0
      } = transactionData;

      // Générer une référence unique
      const reference = Transaction.generateReference(type);

      // Insérer la transaction
      const result = await query(
        `INSERT INTO transactions (
          user_id, card_id, type, amount, currency, recipient,
          recipient_phone, description, status, reference,
          service_type, provider, location, fees
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          userId, cardId, type, amount, currency, recipient,
          recipientPhone, description, 'pending', reference,
          serviceType, provider, location, fees
        ]
      );

      return new Transaction(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la création de la transaction:', error);
      throw error;
    }
  }

  // Trouver une transaction par ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM transactions WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new Transaction(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la recherche de la transaction:', error);
      throw error;
    }
  }

  // Trouver une transaction par référence
  static async findByReference(reference) {
    try {
      const result = await query(
        'SELECT * FROM transactions WHERE reference = $1',
        [reference]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new Transaction(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la recherche de la transaction:', error);
      throw error;
    }
  }

  // Filtrer les transactions
  static async filter(filter = {}, orderBy = '-created_at', limit = null, offset = 0) {
    try {
      let queryText = 'SELECT * FROM transactions';
      const params = [];
      const conditions = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(filter)) {
        if (value !== undefined && value !== null) {
          conditions.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
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
        paramIndex++;
      }

      if (offset > 0) {
        queryText += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }

      const result = await query(queryText, params);
      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      console.error('Erreur lors du filtrage des transactions:', error);
      throw error;
    }
  }

  // Obtenir les transactions d'un utilisateur
  static async findByUserId(userId, options = {}) {
    try {
      const {
        type,
        status,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        orderBy = '-created_at'
      } = options;

      let queryText = 'SELECT * FROM transactions WHERE user_id = $1';
      const params = [userId];
      let paramIndex = 2;

      if (type) {
        queryText += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (status) {
        queryText += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (startDate) {
        queryText += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        queryText += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (orderBy) {
        const direction = orderBy.startsWith('-') ? 'DESC' : 'ASC';
        const column = orderBy.replace('-', '');
        queryText += ` ORDER BY ${column} ${direction}`;
      }

      queryText += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;

      if (offset > 0) {
        queryText += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }

      const result = await query(queryText, params);
      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      console.error('Erreur lors de la recherche des transactions:', error);
      throw error;
    }
  }

  // Obtenir les transactions d'une carte
  static async findByCardId(cardId, options = {}) {
    try {
      const {
        status,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = options;

      let queryText = 'SELECT * FROM transactions WHERE card_id = $1';
      const params = [cardId];
      let paramIndex = 2;

      if (status) {
        queryText += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (startDate) {
        queryText += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        queryText += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      queryText += ' ORDER BY created_at DESC';

      if (limit) {
        queryText += ` LIMIT $${paramIndex}`;
        params.push(limit);
        paramIndex++;
      }

      if (offset > 0) {
        queryText += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }

      const result = await query(queryText, params);
      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      console.error('Erreur lors de la recherche des transactions:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'une transaction
  async updateStatus(status, additionalData = {}) {
    try {
      const allowedStatuses = ['pending', 'completed', 'failed', 'cancelled'];
      
      if (!allowedStatuses.includes(status)) {
        throw new Error('Statut de transaction invalide');
      }

      const updateFields = ['status'];
      const values = [status];
      let paramIndex = 2;

      // Ajouter des données supplémentaires si fournies
      for (const [key, value] of Object.entries(additionalData)) {
        if (value !== undefined) {
          updateFields.push(key);
          values.push(value);
          paramIndex++;
        }
      }

      values.push(this.id);

      const result = await query(
        `UPDATE transactions SET ${updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      return new Transaction(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  // Confirmer une transaction
  async confirm() {
    try {
      if (this.status !== 'pending') {
        throw new Error('Seules les transactions en attente peuvent être confirmées');
      }

      return await this.updateStatus('completed');
    } catch (error) {
      console.error('Erreur lors de la confirmation de la transaction:', error);
      throw error;
    }
  }

  // Annuler une transaction
  async cancel(reason = null) {
    try {
      if (this.status === 'completed') {
        throw new Error('Impossible d\'annuler une transaction déjà complétée');
      }

      const additionalData = reason ? { description: `${this.description} - Annulée: ${reason}` } : {};
      return await this.updateStatus('cancelled', additionalData);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la transaction:', error);
      throw error;
    }
  }

  // Marquer une transaction comme échouée
  async fail(reason = null) {
    try {
      const additionalData = reason ? { description: `${this.description} - Échec: ${reason}` } : {};
      return await this.updateStatus('failed', additionalData);
    } catch (error) {
      console.error('Erreur lors du marquage de la transaction comme échouée:', error);
      throw error;
    }
  }

  // Obtenir les statistiques des transactions
  static async getStats(userId, options = {}) {
    try {
      const {
        startDate,
        endDate,
        type,
        status = 'completed'
      } = options;

      let queryText = `
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(AVG(amount), 0) as avg_amount,
          COALESCE(SUM(fees), 0) as total_fees,
          type,
          COUNT(*) as count_by_type
        FROM transactions 
        WHERE user_id = $1 AND status = $2
      `;

      const params = [userId, status];
      let paramIndex = 3;

      if (startDate) {
        queryText += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        queryText += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (type) {
        queryText += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      queryText += ' GROUP BY type';

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Obtenir les transactions récentes
  static async getRecent(userId, limit = 10) {
    try {
      const result = await query(
        `SELECT * FROM transactions 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions récentes:', error);
      throw error;
    }
  }

  // Rechercher des transactions
  static async search(userId, searchTerm, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const result = await query(
        `SELECT * FROM transactions 
         WHERE user_id = $1 
         AND (
           reference ILIKE $2 
           OR recipient ILIKE $2 
           OR description ILIKE $2
           OR service_type ILIKE $2
         )
         ORDER BY created_at DESC 
         LIMIT $3 OFFSET $4`,
        [userId, `%${searchTerm}%`, limit, offset]
      );

      return result.rows.map(row => new Transaction(row));
    } catch (error) {
      console.error('Erreur lors de la recherche des transactions:', error);
      throw error;
    }
  }

  // Convertir en JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      cardId: this.cardId,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      recipient: this.recipient,
      recipientPhone: this.recipientPhone,
      description: this.description,
      status: this.status,
      reference: this.reference,
      serviceType: this.serviceType,
      provider: this.provider,
      location: this.location,
      fees: this.fees,
      exchangeRate: this.exchangeRate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Transaction;