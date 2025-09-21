const express = require('express');
const Transaction = require('../models/Transaction');
const Card = require('../models/Card');
const User = require('../models/User');
const { authenticateToken, requireVerification, checkTransactionLimits } = require('../middleware/auth');
const { validateTransaction, validateTransfer, validateBillPayment, validatePagination } = require('../middleware/validation');
const { transferLimiter } = require('../middleware/security');

const router = express.Router();

// Obtenir toutes les transactions de l'utilisateur
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status, 
      startDate, 
      endDate,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;
    const offset = (page - 1) * limit;

    let transactions;
    let totalCount;

    if (search) {
      // Recherche de transactions
      transactions = await Transaction.search(req.user.id, search, { limit, offset });
      
      // Compter les résultats de recherche
      const { query } = require('../config/database');
      const countResult = await query(
        `SELECT COUNT(*) as total FROM transactions 
         WHERE user_id = $1 
         AND (
           reference ILIKE $2 
           OR recipient ILIKE $2 
           OR description ILIKE $2
           OR service_type ILIKE $2
         )`,
        [req.user.id, `%${search}%`]
      );
      totalCount = parseInt(countResult.rows[0].total);
    } else {
      // Filtrage normal
      const options = {
        type,
        status,
        startDate,
        endDate,
        limit,
        offset
      };

      transactions = await Transaction.findByUserId(req.user.id, options);

      // Compter le total
      const { query } = require('../config/database');
      let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = $1';
      const countParams = [req.user.id];
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
      totalCount = parseInt(countResult.rows[0].total);
    }

    res.json({
      success: true,
      data: {
        transactions: transactions.map(tx => tx.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir une transaction spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    // Vérifier que la transaction appartient à l'utilisateur
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    res.json({
      success: true,
      data: {
        transaction: transaction.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Créer une nouvelle transaction
router.post('/', authenticateToken, requireVerification, checkTransactionLimits, validateTransaction, async (req, res) => {
  try {
    const {
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
    } = req.body;

    // Vérifier que la carte appartient à l'utilisateur si fournie
    if (cardId) {
      const card = await Card.findById(cardId);
      if (!card || card.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Carte non trouvée ou accès refusé'
        });
      }

      // Vérifier les limites de la carte
      const limitsCheck = await card.checkLimits(amount);
      if (!limitsCheck.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Limites de carte dépassées',
          errors: limitsCheck.errors
        });
      }
    }

    // Vérifier le solde de l'utilisateur
    const user = await User.findById(req.user.id);
    const totalAmount = amount + fees;
    
    if (user.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Solde insuffisant'
      });
    }

    // Créer la transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      cardId,
      type,
      amount,
      currency,
      recipient,
      recipientPhone,
      description,
      serviceType,
      provider,
      location,
      fees
    });

    // Débiter le solde de l'utilisateur
    await user.updateBalance(totalAmount, 'subtract');

    // Confirmer la transaction
    await transaction.confirm();

    res.status(201).json({
      success: true,
      message: 'Transaction créée avec succès',
      data: {
        transaction: transaction.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la transaction:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la transaction'
    });
  }
});

// Effectuer un transfert
router.post('/transfer', authenticateToken, requireVerification, transferLimiter, checkTransactionLimits, validateTransfer, async (req, res) => {
  try {
    const {
      recipient,
      recipientPhone,
      amount,
      provider,
      description
    } = req.body;

    const transferFee = parseInt(process.env.TRANSFER_FEE) || 50;
    const totalAmount = amount + transferFee;

    // Vérifier le solde de l'utilisateur
    const user = await User.findById(req.user.id);
    
    if (user.balance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Solde insuffisant. Montant requis: ${totalAmount} CFA (${amount} + ${transferFee} de frais)`
      });
    }

    // Créer la transaction de transfert
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'transfer',
      amount,
      currency: 'CFA',
      recipient,
      recipientPhone,
      description: description || `Transfert vers ${recipient}`,
      provider,
      fees: transferFee
    });

    // Débiter le solde de l'utilisateur
    await user.updateBalance(totalAmount, 'subtract');

    // Confirmer la transaction
    await transaction.confirm();

    res.status(201).json({
      success: true,
      message: 'Transfert effectué avec succès',
      data: {
        transaction: transaction.toJSON(),
        fees: transferFee,
        totalAmount
      }
    });
  } catch (error) {
    console.error('Erreur lors du transfert:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors du transfert'
    });
  }
});

// Payer une facture
router.post('/bill-payment', authenticateToken, requireVerification, checkTransactionLimits, validateBillPayment, async (req, res) => {
  try {
    const {
      serviceType,
      provider,
      accountNumber,
      amount,
      description
    } = req.body;

    // Vérifier le solde de l'utilisateur
    const user = await User.findById(req.user.id);
    
    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Solde insuffisant'
      });
    }

    // Créer la transaction de paiement de facture
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'bill_payment',
      amount,
      currency: 'CFA',
      description: description || `Paiement ${serviceType} - ${accountNumber}`,
      serviceType,
      provider,
      fees: 0 // Pas de frais pour les paiements de factures
    });

    // Débiter le solde de l'utilisateur
    await user.updateBalance(amount, 'subtract');

    // Confirmer la transaction
    await transaction.confirm();

    res.status(201).json({
      success: true,
      message: 'Paiement de facture effectué avec succès',
      data: {
        transaction: transaction.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors du paiement de facture:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors du paiement de facture'
    });
  }
});

// Annuler une transaction
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée'
      });
    }

    // Vérifier que la transaction appartient à l'utilisateur
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    // Annuler la transaction
    const cancelledTransaction = await transaction.cancel(reason);

    // Rembourser le montant si la transaction était complétée
    if (transaction.status === 'completed') {
      const user = await User.findById(req.user.id);
      const totalAmount = transaction.amount + transaction.fees;
      await user.updateBalance(totalAmount, 'add');
    }

    res.json({
      success: true,
      message: 'Transaction annulée avec succès',
      data: {
        transaction: cancelledTransaction.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la transaction:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de l\'annulation de la transaction'
    });
  }
});

// Obtenir les statistiques des transactions
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const stats = await Transaction.getStats(req.user.id, {
      startDate,
      endDate,
      type
    });

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir les transactions récentes
router.get('/recent/list', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const transactions = await Transaction.getRecent(req.user.id, limit);

    res.json({
      success: true,
      data: {
        transactions: transactions.map(tx => tx.toJSON())
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions récentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Rechercher des transactions
router.get('/search/:term', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { term } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const transactions = await Transaction.search(req.user.id, term, { limit, offset });

    // Compter les résultats
    const { query } = require('../config/database');
    const countResult = await query(
      `SELECT COUNT(*) as total FROM transactions 
       WHERE user_id = $1 
       AND (
         reference ILIKE $2 
         OR recipient ILIKE $2 
         OR description ILIKE $2
         OR service_type ILIKE $2
       )`,
      [req.user.id, `%${term}%`]
    );

    res.json({
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
    });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;