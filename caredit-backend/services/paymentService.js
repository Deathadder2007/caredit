const FlutterwaveService = require('./flutterwaveService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const NotificationService = require('./notificationService');
const { query } = require('../config/database');

class PaymentService {
  // Initialiser un paiement avec Flutterwave
  static async initializePayment(userId, paymentData) {
    try {
      const {
        amount,
        currency = 'XOF',
        description,
        redirect_url,
        payment_method = 'card'
      } = paymentData;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const flutterwave = new FlutterwaveService();
      const tx_ref = `CAREDIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Créer une transaction en attente
      const transaction = await Transaction.create({
        userId,
        type: 'deposit',
        amount,
        currency,
        description: description || 'Recharge de compte',
        reference: tx_ref,
        status: 'pending',
        provider: 'flutterwave'
      });

      const paymentPayload = {
        amount,
        currency,
        email: user.email,
        phone_number: user.phoneNumber,
        name: `${user.firstName} ${user.lastName}`,
        tx_ref,
        redirect_url: redirect_url || `${process.env.FRONTEND_URL}/payment-success`,
        meta: {
          user_id: userId,
          transaction_id: transaction.id,
          payment_method
        }
      };

      const result = await flutterwave.initializePayment(paymentPayload);

      if (result.success) {
        return {
          success: true,
          data: {
            transaction: transaction.toJSON(),
            payment_url: result.data.data.link,
            payment_reference: tx_ref,
            amount,
            currency
          }
        };
      } else {
        await transaction.fail(result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement:', error);
      throw error;
    }
  }

  // Vérifier et confirmer un paiement
  static async confirmPayment(userId, transactionId) {
    const client = await require('../config/database').getClient();
    
    try {
      await client.query('BEGIN');

      const transaction = await Transaction.findById(transactionId);
      
      if (!transaction || transaction.userId !== userId) {
        throw new Error('Transaction non trouvée');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transaction déjà traitée');
      }

      const flutterwave = new FlutterwaveService();
      const result = await flutterwave.verifyPayment(transaction.reference);

      if (result.success && result.data.data.status === 'successful') {
        // Confirmer la transaction
        await transaction.confirm();
        
        // Créditer le solde de l'utilisateur
        const user = await User.findById(userId);
        await user.updateBalance(transaction.amount, 'add');

        // Envoyer une notification
        await NotificationService.sendTransactionNotification(userId, transaction);

        await client.query('COMMIT');

        return {
          success: true,
          data: {
            transaction: transaction.toJSON(),
            payment_data: result.data.data,
            new_balance: user.balance
          }
        };
      } else {
        await transaction.fail('Paiement non confirmé par Flutterwave');
        await client.query('COMMIT');
        
        return {
          success: false,
          message: 'Paiement non confirmé',
          data: result.data
        };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de la confirmation du paiement:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Effectuer un transfert via Flutterwave
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
        transferType = 'mobile_money' // 'mobile_money' ou 'bank'
      } = transferData;

      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      if (user.balance < amount) {
        throw new Error('Solde insuffisant');
      }

      const flutterwave = new FlutterwaveService();
      const reference = `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Créer une transaction
      const transaction = await Transaction.create({
        userId,
        type: 'transfer',
        amount,
        currency: 'XOF',
        recipient,
        recipientPhone,
        description: description || `Transfert vers ${recipient}`,
        reference,
        provider,
        status: 'pending'
      });

      let transferResult;

      if (transferType === 'mobile_money') {
        transferResult = await flutterwave.transferToMobileMoney({
          account_bank: provider === 'mtn' ? 'MTN' : provider === 'moov' ? 'MOOV' : 'ORANGE',
          account_number: recipientPhone,
          amount,
          narration: description || `Transfert CareCredit vers ${recipientPhone}`,
          beneficiary_name: recipient,
          reference
        });
      } else {
        transferResult = await flutterwave.transferToBank({
          account_bank: transferData.bank_code,
          account_number: transferData.account_number,
          amount,
          narration: description || `Transfert CareCredit vers ${recipient}`,
          beneficiary_name: recipient,
          reference
        });
      }

      if (transferResult.success) {
        // Débiter le solde de l'utilisateur
        await user.updateBalance(amount, 'subtract');
        
        // Confirmer la transaction
        await transaction.confirm();

        // Envoyer une notification
        await NotificationService.sendTransactionNotification(userId, transaction);

        await client.query('COMMIT');

        return {
          success: true,
          data: {
            transaction: transaction.toJSON(),
            transfer_data: transferResult.data.data,
            new_balance: user.balance
          }
        };
      } else {
        await transaction.fail(transferResult.error);
        await client.query('COMMIT');
        
        throw new Error(transferResult.error);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur lors du transfert:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtenir les méthodes de paiement disponibles
  static async getPaymentMethods() {
    try {
      const flutterwave = new FlutterwaveService();
      const banksResult = await flutterwave.getSupportedBanks('TG');

      return {
        success: true,
        data: {
          payment_methods: [
            {
              type: 'card',
              name: 'Carte bancaire',
              description: 'Visa, Mastercard, American Express',
              icon: 'credit-card',
              available: true
            },
            {
              type: 'mobile_money',
              name: 'Mobile Money',
              description: 'MTN MoMo, Moov Money, Orange Money',
              icon: 'smartphone',
              available: true,
              providers: [
                { code: 'mtn', name: 'MTN MoMo' },
                { code: 'moov', name: 'Moov Money' },
                { code: 'orange', name: 'Orange Money' }
              ]
            },
            {
              type: 'bank_transfer',
              name: 'Virement bancaire',
              description: 'Transfert vers compte bancaire',
              icon: 'building',
              available: true,
              banks: banksResult.success ? banksResult.data.data : []
            }
          ]
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des méthodes de paiement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Valider un compte bancaire
  static async validateBankAccount(accountNumber, bankCode) {
    try {
      const flutterwave = new FlutterwaveService();
      const result = await flutterwave.validateBankAccount(accountNumber, bankCode);

      if (result.success) {
        return {
          success: true,
          data: result.data.data
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Erreur lors de la validation du compte:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtenir les frais de transfert
  static async getTransferFees(amount, currency = 'XOF') {
    try {
      const flutterwave = new FlutterwaveService();
      const result = await flutterwave.getTransferFees(amount, currency);

      if (result.success) {
        return {
          success: true,
          data: result.data.data
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des frais:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Traiter un webhook Flutterwave
  static async processWebhook(webhookData, signature) {
    try {
      const flutterwave = new FlutterwaveService();
      
      // Vérifier la signature
      const payload = JSON.stringify(webhookData);
      if (!flutterwave.verifyWebhookSignature(payload, signature)) {
        throw new Error('Signature webhook invalide');
      }

      const result = await flutterwave.processWebhook(webhookData);
      return result;
    } catch (error) {
      console.error('Erreur lors du traitement du webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtenir l'historique des paiements
  static async getPaymentHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate
      } = options;

      const filter = { user_id: userId };
      if (type) filter.type = type;
      if (status) filter.status = status;

      const transactions = await Transaction.filter(filter, '-created_at', limit, (page - 1) * limit);

      // Compter le total
      const { query } = require('../config/database');
      let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = $1';
      const countParams = [userId];
      let paramIndex = 2;

      if (type) {
        countQuery += ` AND type = $${paramIndex}`;
        countParams.push(type);
        paramIndex++;
      }
      if (status) {
        countQuery += ` AND status = $${paramIndex}`;
        countParams.push(status);
        paramIndex++;
      }
      if (startDate) {
        countQuery += ` AND created_at >= $${paramIndex}`;
        countParams.push(startDate);
        paramIndex++;
      }
      if (endDate) {
        countQuery += ` AND created_at <= $${paramIndex}`;
        countParams.push(endDate);
        paramIndex++;
      }

      const countResult = await query(countQuery, countParams);

      return {
        success: true,
        data: {
          transactions: transactions.map(tx => tx.toJSON()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].total),
            pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
          }
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PaymentService;