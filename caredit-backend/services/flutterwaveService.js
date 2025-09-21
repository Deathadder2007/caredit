const axios = require('axios');
const crypto = require('crypto');

class FlutterwaveService {
  constructor() {
    this.baseURL = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    this.encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
    
    if (!this.secretKey || !this.publicKey) {
      throw new Error('Flutterwave API keys not configured');
    }
  }

  // Générer les headers pour les requêtes Flutterwave
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Chiffrer les données sensibles
  encryptData(data) {
    if (!this.encryptionKey) return data;
    
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      client: encrypted,
      iv: iv.toString('hex')
    };
  }

  // Vérifier la signature webhook
  verifyWebhookSignature(payload, signature) {
    const hash = crypto
      .createHmac('sha256', process.env.FLUTTERWAVE_WEBHOOK_SECRET || this.secretKey)
      .update(payload)
      .digest('hex');
    
    return hash === signature;
  }

  // Initialiser un paiement
  async initializePayment(paymentData) {
    try {
      const {
        amount,
        currency = 'XOF',
        email,
        phone_number,
        name,
        tx_ref,
        redirect_url,
        meta = {}
      } = paymentData;

      const payload = {
        tx_ref,
        amount: amount.toString(),
        currency,
        redirect_url,
        payment_options: 'card,mobilemoney,banktransfer',
        customer: {
          email,
          phone_number,
          name
        },
        customizations: {
          title: 'CareCredit Payment',
          description: 'Payment for CareCredit services',
          logo: 'https://your-domain.com/logo.png'
        },
        meta
      };

      const response = await axios.post(
        `${this.baseURL}/payments`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement Flutterwave:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Vérifier le statut d'un paiement
  async verifyPayment(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transactions/${transactionId}/verify`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du paiement:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Effectuer un transfert vers un compte bancaire
  async transferToBank(transferData) {
    try {
      const {
        account_bank,
        account_number,
        amount,
        narration,
        beneficiary_name,
        reference
      } = transferData;

      const payload = {
        account_bank,
        account_number,
        amount: amount.toString(),
        narration,
        beneficiary_name,
        reference
      };

      const response = await axios.post(
        `${this.baseURL}/transfers`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors du transfert bancaire:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Effectuer un transfert vers un mobile money
  async transferToMobileMoney(transferData) {
    try {
      const {
        account_bank,
        account_number,
        amount,
        narration,
        beneficiary_name,
        reference
      } = transferData;

      const payload = {
        account_bank,
        account_number,
        amount: amount.toString(),
        narration,
        beneficiary_name,
        reference
      };

      const response = await axios.post(
        `${this.baseURL}/transfers`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors du transfert mobile money:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Obtenir les banques supportées
  async getSupportedBanks(country = 'TG') {
    try {
      const response = await axios.get(
        `${this.baseURL}/banks/${country}`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des banques:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Valider un numéro de compte bancaire
  async validateBankAccount(accountNumber, bankCode) {
    try {
      const response = await axios.post(
        `${this.baseURL}/accounts/resolve`,
        {
          account_number: accountNumber,
          account_bank: bankCode
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la validation du compte:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Obtenir le solde du compte Flutterwave
  async getBalance() {
    try {
      const response = await axios.get(
        `${this.baseURL}/balances`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du solde:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Obtenir l'historique des transactions
  async getTransactionHistory(options = {}) {
    try {
      const {
        from,
        to,
        page = 1,
        per_page = 20,
        status,
        tx_ref
      } = options;

      let url = `${this.baseURL}/transactions?page=${page}&per_page=${per_page}`;
      
      if (from) url += `&from=${from}`;
      if (to) url += `&to=${to}`;
      if (status) url += `&status=${status}`;
      if (tx_ref) url += `&tx_ref=${tx_ref}`;

      const response = await axios.get(url, { headers: this.getHeaders() });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Annuler un transfert
  async cancelTransfer(transferId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/transfers/${transferId}/cancel`,
        {},
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de l\'annulation du transfert:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Obtenir les frais de transfert
  async getTransferFees(amount, currency = 'XOF') {
    try {
      const response = await axios.post(
        `${this.baseURL}/transfers/fee`,
        {
          amount: amount.toString(),
          currency
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des frais:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Créer un lien de paiement récurrent
  async createPaymentLink(paymentData) {
    try {
      const {
        title,
        description,
        amount,
        currency = 'XOF',
        redirect_url,
        expiry_date
      } = paymentData;

      const payload = {
        title,
        description,
        amount: amount.toString(),
        currency,
        redirect_url,
        expiry_date
      };

      const response = await axios.post(
        `${this.baseURL}/payment-plans`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la création du lien de paiement:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Traiter le webhook de Flutterwave
  async processWebhook(webhookData) {
    try {
      const {
        event,
        data
      } = webhookData;

      switch (event) {
        case 'charge.completed':
          return await this.handlePaymentSuccess(data);
        case 'charge.failed':
          return await this.handlePaymentFailure(data);
        case 'transfer.completed':
          return await this.handleTransferSuccess(data);
        case 'transfer.failed':
          return await this.handleTransferFailure(data);
        default:
          console.log('Événement webhook non géré:', event);
          return { success: true, message: 'Événement non géré' };
      }
    } catch (error) {
      console.error('Erreur lors du traitement du webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gérer le succès d'un paiement
  async handlePaymentSuccess(paymentData) {
    try {
      const { Transaction } = require('../models/Transaction');
      const { User } = require('../models/User');
      const NotificationService = require('./notificationService');

      // Trouver la transaction dans notre base
      const transaction = await Transaction.findByReference(paymentData.tx_ref);
      
      if (transaction) {
        // Confirmer la transaction
        await transaction.confirm();
        
        // Créditer le solde de l'utilisateur
        const user = await User.findById(transaction.userId);
        await user.updateBalance(transaction.amount, 'add');
        
        // Envoyer une notification
        await NotificationService.sendTransactionNotification(
          transaction.userId,
          transaction
        );
      }

      return { success: true, message: 'Paiement traité avec succès' };
    } catch (error) {
      console.error('Erreur lors du traitement du paiement réussi:', error);
      return { success: false, error: error.message };
    }
  }

  // Gérer l'échec d'un paiement
  async handlePaymentFailure(paymentData) {
    try {
      const { Transaction } = require('../models/Transaction');
      const NotificationService = require('./notificationService');

      const transaction = await Transaction.findByReference(paymentData.tx_ref);
      
      if (transaction) {
        await transaction.fail(paymentData.failure_reason || 'Paiement échoué');
        
        await NotificationService.create(
          transaction.userId,
          'Paiement échoué',
          `Votre paiement de ${transaction.amount} CFA a échoué. Raison: ${paymentData.failure_reason || 'Non spécifiée'}`,
          'error'
        );
      }

      return { success: true, message: 'Échec de paiement traité' };
    } catch (error) {
      console.error('Erreur lors du traitement de l\'échec de paiement:', error);
      return { success: false, error: error.message };
    }
  }

  // Gérer le succès d'un transfert
  async handleTransferSuccess(transferData) {
    try {
      const { Transaction } = require('../models/Transaction');
      const NotificationService = require('./notificationService');

      const transaction = await Transaction.findByReference(transferData.reference);
      
      if (transaction) {
        await transaction.confirm();
        
        await NotificationService.create(
          transaction.userId,
          'Transfert effectué',
          `Votre transfert de ${transaction.amount} CFA vers ${transaction.recipient} a été effectué avec succès.`,
          'success'
        );
      }

      return { success: true, message: 'Transfert traité avec succès' };
    } catch (error) {
      console.error('Erreur lors du traitement du transfert réussi:', error);
      return { success: false, error: error.message };
    }
  }

  // Gérer l'échec d'un transfert
  async handleTransferFailure(transferData) {
    try {
      const { Transaction } = require('../models/Transaction');
      const NotificationService = require('./notificationService');

      const transaction = await Transaction.findByReference(transferData.reference);
      
      if (transaction) {
        await transaction.fail(transferData.failure_reason || 'Transfert échoué');
        
        // Rembourser le montant
        const { User } = require('../models/User');
        const user = await User.findById(transaction.userId);
        await user.updateBalance(transaction.amount + transaction.fees, 'add');
        
        await NotificationService.create(
          transaction.userId,
          'Transfert échoué',
          `Votre transfert de ${transaction.amount} CFA a échoué. Le montant a été remboursé.`,
          'error'
        );
      }

      return { success: true, message: 'Échec de transfert traité' };
    } catch (error) {
      console.error('Erreur lors du traitement de l\'échec de transfert:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = FlutterwaveService;