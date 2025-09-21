const Transaction = require('../models/Transaction');
const Card = require('../models/Card');
const User = require('../models/User');
const NotificationService = require('./notificationService');
const { query } = require('../config/database');

class TransactionService {
  // Effectuer un transfert complet
  static async processTransfer(userId, transferData) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');

      const {
        recipient,
        recipientPhone,
        amount,
        provider,
        description,
        cardId
      } = transferData;

      const transferFee = parseInt(process.env.TRANSFER_FEE) || 50;
      const totalAmount = amount + transferFee;

      // Vérifier le solde de l'utilisateur
      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      const currentBalance = parseFloat(userResult.rows[0].balance);
      
      if (currentBalance < totalAmount) {
        throw new Error('Solde insuffisant');
      }

      // Vérifier les limites de la carte si fournie
      if (cardId) {
        const cardLimits = await Card.checkLimits(cardId, amount);
        if (!cardLimits.isValid) {
          throw new Error(`Limites de carte dépassées: ${cardLimits.errors.join(', ')}`);
        }
      }

      // Créer la transaction
      const transaction = await Transaction.create({
        userId,
        cardId,
        type: 'transfer',
        amount,
        currency: 'CFA',
        recipient,
        recipientPhone,
        description: description || `Transfert vers ${recipient}`,
        provider,
        fees: transferFee
      });

      // Débiter le solde
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [totalAmount, userId]
      );

      // Confirmer la transaction
      await transaction.confirm();

      // Envoyer une notification
      await NotificationService.sendTransactionNotification(userId, transaction);

      await client.query('COMMIT');

      return {
        transaction: transaction.toJSON(),
        fees: transferFee,
        totalAmount,
        newBalance: currentBalance - totalAmount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Effectuer un paiement de facture
  static async processBillPayment(userId, billData) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');

      const {
        serviceType,
        provider,
        accountNumber,
        amount,
        description,
        cardId
      } = billData;

      // Vérifier le solde de l'utilisateur
      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      const currentBalance = parseFloat(userResult.rows[0].balance);
      
      if (currentBalance < amount) {
        throw new Error('Solde insuffisant');
      }

      // Vérifier les limites de la carte si fournie
      if (cardId) {
        const cardLimits = await Card.checkLimits(cardId, amount);
        if (!cardLimits.isValid) {
          throw new Error(`Limites de carte dépassées: ${cardLimits.errors.join(', ')}`);
        }
      }

      // Créer la transaction
      const transaction = await Transaction.create({
        userId,
        cardId,
        type: 'bill_payment',
        amount,
        currency: 'CFA',
        description: description || `Paiement ${serviceType} - ${accountNumber}`,
        serviceType,
        provider,
        fees: 0
      });

      // Débiter le solde
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [amount, userId]
      );

      // Confirmer la transaction
      await transaction.confirm();

      // Envoyer une notification
      await NotificationService.sendTransactionNotification(userId, transaction);

      await client.query('COMMIT');

      return {
        transaction: transaction.toJSON(),
        newBalance: currentBalance - amount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Effectuer un retrait
  static async processWithdrawal(userId, withdrawalData) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');

      const {
        amount,
        location,
        cardId,
        description
      } = withdrawalData;

      const withdrawalFee = parseInt(process.env.WITHDRAWAL_FEE) || 100;
      const totalAmount = amount + withdrawalFee;

      // Vérifier le solde de l'utilisateur
      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      const currentBalance = parseFloat(userResult.rows[0].balance);
      
      if (currentBalance < totalAmount) {
        throw new Error('Solde insuffisant');
      }

      // Vérifier les limites de la carte si fournie
      if (cardId) {
        const cardLimits = await Card.checkLimits(cardId, amount);
        if (!cardLimits.isValid) {
          throw new Error(`Limites de carte dépassées: ${cardLimits.errors.join(', ')}`);
        }
      }

      // Créer la transaction
      const transaction = await Transaction.create({
        userId,
        cardId,
        type: 'withdrawal',
        amount,
        currency: 'CFA',
        description: description || `Retrait à ${location}`,
        location,
        fees: withdrawalFee
      });

      // Débiter le solde
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [totalAmount, userId]
      );

      // Confirmer la transaction
      await transaction.confirm();

      // Envoyer une notification
      await NotificationService.sendTransactionNotification(userId, transaction);

      await client.query('COMMIT');

      return {
        transaction: transaction.toJSON(),
        fees: withdrawalFee,
        totalAmount,
        newBalance: currentBalance - totalAmount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Effectuer un dépôt
  static async processDeposit(userId, depositData) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');

      const {
        amount,
        source,
        description,
        reference
      } = depositData;

      // Vérifier que l'utilisateur existe
      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      const currentBalance = parseFloat(userResult.rows[0].balance);

      // Créer la transaction
      const transaction = await Transaction.create({
        userId,
        type: 'deposit',
        amount,
        currency: 'CFA',
        description: description || `Dépôt depuis ${source}`,
        reference: reference || Transaction.generateReference('deposit'),
        fees: 0
      });

      // Créditer le solde
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [amount, userId]
      );

      // Confirmer la transaction
      await transaction.confirm();

      // Envoyer une notification
      await NotificationService.sendTransactionNotification(userId, transaction);

      await client.query('COMMIT');

      return {
        transaction: transaction.toJSON(),
        newBalance: currentBalance + amount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Annuler une transaction
  static async cancelTransaction(transactionId, userId, reason) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');

      // Récupérer la transaction
      const transactionResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [transactionId, userId]
      );

      if (transactionResult.rows.length === 0) {
        throw new Error('Transaction non trouvée');
      }

      const transaction = new Transaction(transactionResult.rows[0]);

      if (transaction.status === 'completed') {
        // Rembourser le montant
        const totalAmount = transaction.amount + transaction.fees;
        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [totalAmount, userId]
        );
      }

      // Annuler la transaction
      await transaction.cancel(reason);

      // Envoyer une notification
      await NotificationService.create(
        userId,
        'Transaction annulée',
        `Votre transaction ${transaction.reference} a été annulée. ${reason ? `Raison: ${reason}` : ''}`,
        'info'
      );

      await client.query('COMMIT');

      return transaction.toJSON();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtenir le résumé des transactions
  static async getTransactionSummary(userId, period = 'month') {
    try {
      let startDate;
      const now = new Date();

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const result = await query(`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(fees), 0) as total_fees,
          COALESCE(AVG(amount), 0) as avg_amount,
          type,
          COUNT(*) as count_by_type,
          COALESCE(SUM(amount), 0) as amount_by_type
        FROM transactions 
        WHERE user_id = $1 
        AND status = 'completed'
        AND created_at >= $2
        GROUP BY type
        ORDER BY amount_by_type DESC
      `, [userId, startDate]);

      const summary = {
        period,
        startDate,
        endDate: now,
        totalTransactions: 0,
        totalAmount: 0,
        totalFees: 0,
        averageAmount: 0,
        byType: {}
      };

      result.rows.forEach(row => {
        summary.totalTransactions += parseInt(row.count_by_type);
        summary.totalAmount += parseFloat(row.amount_by_type);
        summary.totalFees += parseFloat(row.total_fees);
        summary.byType[row.type] = {
          count: parseInt(row.count_by_type),
          amount: parseFloat(row.amount_by_type),
          fees: parseFloat(row.total_fees)
        };
      });

      summary.averageAmount = summary.totalTransactions > 0 
        ? summary.totalAmount / summary.totalTransactions 
        : 0;

      return summary;
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé des transactions:', error);
      throw error;
    }
  }

  // Vérifier les limites de transaction
  static async checkTransactionLimits(userId, amount, type = 'transfer') {
    try {
      // Récupérer les limites de l'utilisateur
      const limitsResult = await query(
        'SELECT daily_limit, monthly_limit, single_transaction_limit FROM transaction_limits WHERE user_id = $1',
        [userId]
      );

      if (limitsResult.rows.length === 0) {
        throw new Error('Limites de transaction non trouvées');
      }

      const limits = limitsResult.rows[0];

      // Vérifier la limite de transaction unique
      if (amount > limits.single_transaction_limit) {
        return {
          isValid: false,
          error: `Montant supérieur à la limite autorisée (${limits.single_transaction_limit} CFA)`
        };
      }

      // Vérifier la limite quotidienne
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const dailyUsageResult = await query(
        'SELECT COALESCE(SUM(amount), 0) as daily_usage FROM transactions WHERE user_id = $1 AND created_at >= $2 AND status = $3',
        [userId, todayStart, 'completed']
      );

      const dailyUsage = parseFloat(dailyUsageResult.rows[0].daily_usage);
      
      if (dailyUsage + amount > limits.daily_limit) {
        return {
          isValid: false,
          error: `Limite quotidienne dépassée. Usage: ${dailyUsage} CFA, Limite: ${limits.daily_limit} CFA`
        };
      }

      // Vérifier la limite mensuelle
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyUsageResult = await query(
        'SELECT COALESCE(SUM(amount), 0) as monthly_usage FROM transactions WHERE user_id = $1 AND created_at >= $2 AND status = $3',
        [userId, monthStart, 'completed']
      );

      const monthlyUsage = parseFloat(monthlyUsageResult.rows[0].monthly_usage);
      
      if (monthlyUsage + amount > limits.monthly_limit) {
        return {
          isValid: false,
          error: `Limite mensuelle dépassée. Usage: ${monthlyUsage} CFA, Limite: ${limits.monthly_limit} CFA`
        };
      }

      return {
        isValid: true,
        dailyUsage,
        monthlyUsage,
        remainingDaily: limits.daily_limit - dailyUsage,
        remainingMonthly: limits.monthly_limit - monthlyUsage
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des limites:', error);
      throw error;
    }
  }
}

module.exports = TransactionService;