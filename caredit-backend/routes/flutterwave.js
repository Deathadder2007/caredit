const express = require('express');
const FlutterwaveService = require('../services/flutterwaveService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateToken, requireVerification, checkTransactionLimits } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Initialiser un paiement Flutterwave
router.post('/initialize-payment', authenticateToken, requireVerification, [
  body('amount').isFloat({ min: 1 }).withMessage('Montant invalide'),
  body('currency').optional().isIn(['XOF', 'XAF', 'NGN', 'USD']).withMessage('Devise invalide'),
  body('redirect_url').optional().isURL().withMessage('URL de redirection invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { amount, currency = 'XOF', redirect_url, description } = req.body;
    const user = await User.findById(req.user.id);

    const flutterwave = new FlutterwaveService();
    const tx_ref = `CAREDIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créer une transaction en attente
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'deposit',
      amount,
      currency,
      description: description || 'Recharge de compte via Flutterwave',
      reference: tx_ref,
      status: 'pending'
    });

    const paymentData = {
      amount,
      currency,
      email: user.email,
      phone_number: user.phoneNumber,
      name: `${user.firstName} ${user.lastName}`,
      tx_ref,
      redirect_url: redirect_url || `${process.env.FRONTEND_URL}/payment-success`,
      meta: {
        user_id: user.id,
        transaction_id: transaction.id
      }
    };

    const result = await flutterwave.initializePayment(paymentData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Paiement initialisé avec succès',
        data: {
          transaction: transaction.toJSON(),
          payment_url: result.data.data.link,
          payment_reference: tx_ref
        }
      });
    } else {
      await transaction.fail(result.error);
      res.status(400).json({
        success: false,
        message: 'Erreur lors de l\'initialisation du paiement',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Vérifier le statut d'un paiement
router.post('/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { transaction_id } = req.body;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de transaction requis'
      });
    }

    const transaction = await Transaction.findById(transaction_id);

    if (!transaction || transaction.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    const flutterwave = new FlutterwaveService();
    const result = await flutterwave.verifyPayment(transaction.reference);

    if (result.success && result.data.data.status === 'successful') {
      // Confirmer la transaction
      await transaction.confirm();
      
      // Créditer le solde de l'utilisateur
      const user = await User.findById(req.user.id);
      await user.updateBalance(transaction.amount, 'add');

      res.json({
        success: true,
        message: 'Paiement vérifié avec succès',
        data: {
          transaction: transaction.toJSON(),
          payment_data: result.data.data
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Paiement non confirmé',
        data: result.data
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Effectuer un transfert vers un compte bancaire
router.post('/transfer-to-bank', authenticateToken, requireVerification, checkTransactionLimits, [
  body('account_bank').notEmpty().withMessage('Code banque requis'),
  body('account_number').notEmpty().withMessage('Numéro de compte requis'),
  body('amount').isFloat({ min: 1 }).withMessage('Montant invalide'),
  body('beneficiary_name').notEmpty().withMessage('Nom du bénéficiaire requis'),
  body('narration').optional().isLength({ max: 200 }).withMessage('Description trop longue')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      account_bank,
      account_number,
      amount,
      beneficiary_name,
      narration
    } = req.body;

    const user = await User.findById(req.user.id);

    // Vérifier le solde
    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Solde insuffisant'
      });
    }

    const flutterwave = new FlutterwaveService();
    const reference = `TRF_BANK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créer une transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'transfer',
      amount,
      currency: 'XOF',
      recipient: beneficiary_name,
      description: narration || `Transfert vers ${beneficiary_name}`,
      reference,
      provider: 'flutterwave',
      status: 'pending'
    });

    const transferData = {
      account_bank,
      account_number,
      amount,
      narration: narration || `Transfert CareCredit vers ${beneficiary_name}`,
      beneficiary_name,
      reference
    };

    const result = await flutterwave.transferToBank(transferData);

    if (result.success) {
      // Débiter le solde de l'utilisateur
      await user.updateBalance(amount, 'subtract');
      
      // Confirmer la transaction
      await transaction.confirm();

      res.json({
        success: true,
        message: 'Transfert initié avec succès',
        data: {
          transaction: transaction.toJSON(),
          transfer_data: result.data.data
        }
      });
    } else {
      await transaction.fail(result.error);
      res.status(400).json({
        success: false,
        message: 'Erreur lors du transfert',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors du transfert bancaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Effectuer un transfert vers mobile money
router.post('/transfer-to-momo', authenticateToken, requireVerification, checkTransactionLimits, [
  body('phone_number').isMobilePhone().withMessage('Numéro de téléphone invalide'),
  body('amount').isFloat({ min: 1 }).withMessage('Montant invalide'),
  body('provider').isIn(['mtn', 'moov', 'orange']).withMessage('Fournisseur invalide'),
  body('narration').optional().isLength({ max: 200 }).withMessage('Description trop longue')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const {
      phone_number,
      amount,
      provider,
      narration
    } = req.body;

    const user = await User.findById(req.user.id);

    // Vérifier le solde
    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Solde insuffisant'
      });
    }

    const flutterwave = new FlutterwaveService();
    const reference = `TRF_MOMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Créer une transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'transfer',
      amount,
      currency: 'XOF',
      recipient: phone_number,
      recipientPhone: phone_number,
      description: narration || `Transfert Mobile Money vers ${phone_number}`,
      reference,
      provider: provider,
      status: 'pending'
    });

    const transferData = {
      account_bank: provider === 'mtn' ? 'MTN' : provider === 'moov' ? 'MOOV' : 'ORANGE',
      account_number: phone_number,
      amount,
      narration: narration || `Transfert CareCredit vers ${phone_number}`,
      beneficiary_name: phone_number,
      reference
    };

    const result = await flutterwave.transferToMobileMoney(transferData);

    if (result.success) {
      // Débiter le solde de l'utilisateur
      await user.updateBalance(amount, 'subtract');
      
      // Confirmer la transaction
      await transaction.confirm();

      res.json({
        success: true,
        message: 'Transfert Mobile Money initié avec succès',
        data: {
          transaction: transaction.toJSON(),
          transfer_data: result.data.data
        }
      });
    } else {
      await transaction.fail(result.error);
      res.status(400).json({
        success: false,
        message: 'Erreur lors du transfert Mobile Money',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors du transfert Mobile Money:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir les banques supportées
router.get('/banks', async (req, res) => {
  try {
    const { country = 'TG' } = req.query;
    const flutterwave = new FlutterwaveService();
    
    const result = await flutterwave.getSupportedBanks(country);

    if (result.success) {
      res.json({
        success: true,
        data: result.data.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la récupération des banques',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des banques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Valider un numéro de compte bancaire
router.post('/validate-account', authenticateToken, [
  body('account_number').notEmpty().withMessage('Numéro de compte requis'),
  body('bank_code').notEmpty().withMessage('Code banque requis')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { account_number, bank_code } = req.body;
    const flutterwave = new FlutterwaveService();
    
    const result = await flutterwave.validateBankAccount(account_number, bank_code);

    if (result.success) {
      res.json({
        success: true,
        data: result.data.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la validation du compte',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors de la validation du compte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir les frais de transfert
router.post('/transfer-fees', authenticateToken, [
  body('amount').isFloat({ min: 1 }).withMessage('Montant invalide'),
  body('currency').optional().isIn(['XOF', 'XAF', 'NGN']).withMessage('Devise invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { amount, currency = 'XOF' } = req.body;
    const flutterwave = new FlutterwaveService();
    
    const result = await flutterwave.getTransferFees(amount, currency);

    if (result.success) {
      res.json({
        success: true,
        data: result.data.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la récupération des frais',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des frais:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Webhook Flutterwave
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    const payload = req.body.toString();

    const flutterwave = new FlutterwaveService();
    
    // Vérifier la signature du webhook
    if (!flutterwave.verifyWebhookSignature(payload, signature)) {
      return res.status(400).json({
        success: false,
        message: 'Signature webhook invalide'
      });
    }

    const webhookData = JSON.parse(payload);
    const result = await flutterwave.processWebhook(webhookData);

    res.json({
      success: true,
      message: 'Webhook traité avec succès',
      data: result
    });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir le solde Flutterwave (pour les admins)
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    const flutterwave = new FlutterwaveService();
    const result = await flutterwave.getBalance();

    if (result.success) {
      res.json({
        success: true,
        data: result.data.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la récupération du solde',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du solde:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;