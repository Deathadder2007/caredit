const express = require('express');
const Card = require('../models/Card');
const { authenticateToken, requireVerification, checkTransactionLimits } = require('../middleware/auth');
const { validateCardCreation, validateCardUpdate, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Obtenir toutes les cartes de l'utilisateur
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, cardType, isDefault } = req.query;
    const offset = (page - 1) * limit;

    const filter = { user_id: req.user.id };
    if (status) filter.status = status;
    if (cardType) filter.card_type = cardType;
    if (isDefault !== undefined) filter.is_default = isDefault === 'true';

    const cards = await Card.filter(filter, '-created_at', limit, offset);

    // Compter le total
    const { query } = require('../config/database');
    let countQuery = 'SELECT COUNT(*) as total FROM cards WHERE user_id = $1';
    const countParams = [req.user.id];
    let paramIndex = 2;

    if (status) {
      countQuery += ` AND status = $${paramIndex}`;
      countParams.push(status);
      paramIndex++;
    }
    if (cardType) {
      countQuery += ` AND card_type = $${paramIndex}`;
      countParams.push(cardType);
      paramIndex++;
    }
    if (isDefault !== undefined) {
      countQuery += ` AND is_default = $${paramIndex}`;
      countParams.push(isDefault === 'true');
    }

    const countResult = await query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        cards: cards.map(card => card.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cartes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir une carte spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    // Vérifier que la carte appartient à l'utilisateur
    if (card.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    res.json({
      success: true,
      data: {
        card: card.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la carte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Créer une nouvelle carte
router.post('/', authenticateToken, requireVerification, validateCardCreation, async (req, res) => {
  try {
    const {
      cardType,
      cardBrand,
      dailyLimit,
      monthlyLimit,
      isDefault
    } = req.body;

    const card = await Card.create({
      userId: req.user.id,
      cardType,
      cardBrand,
      dailyLimit,
      monthlyLimit,
      isDefault
    });

    res.status(201).json({
      success: true,
      message: 'Carte créée avec succès',
      data: {
        card: card.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la carte:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la carte'
    });
  }
});

// Mettre à jour une carte
router.put('/:id', authenticateToken, validateCardUpdate, async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    // Vérifier que la carte appartient à l'utilisateur
    if (card.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    const updatedCard = await card.update(req.body);

    res.json({
      success: true,
      message: 'Carte mise à jour avec succès',
      data: {
        card: updatedCard.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la carte:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de la carte'
    });
  }
});

// Définir le PIN d'une carte
router.post('/:id/pin', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN requis'
      });
    }

    const card = await Card.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    // Vérifier que la carte appartient à l'utilisateur
    if (card.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    await card.setPin(pin);

    res.json({
      success: true,
      message: 'PIN défini avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la définition du PIN:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la définition du PIN'
    });
  }
});

// Vérifier le PIN d'une carte
router.post('/:id/verify-pin', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'PIN requis'
      });
    }

    const card = await Card.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    // Vérifier que la carte appartient à l'utilisateur
    if (card.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    const isValid = await card.verifyPin(pin);

    res.json({
      success: true,
      data: {
        isValid
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du PIN:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification du PIN'
    });
  }
});

// Vérifier les limites d'une carte
router.post('/:id/check-limits', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant valide requis'
      });
    }

    const card = await Card.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    // Vérifier que la carte appartient à l'utilisateur
    if (card.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    const limitsCheck = await card.checkLimits(amount);

    res.json({
      success: true,
      data: {
        limitsCheck
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des limites:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir l'historique des transactions d'une carte
router.get('/:id/transactions', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const card = await Card.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    // Vérifier que la carte appartient à l'utilisateur
    if (card.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    const transactions = await Card.findByCardId(id, {
      status,
      startDate,
      endDate,
      limit,
      offset
    });

    // Compter le total
    const { query } = require('../config/database');
    let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE card_id = $1';
    const countParams = [id];
    let paramIndex = 2;

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
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Supprimer une carte
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    // Vérifier que la carte appartient à l'utilisateur
    if (card.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    await card.delete();

    res.json({
      success: true,
      message: 'Carte supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la carte:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression de la carte'
    });
  }
});

// Définir une carte comme carte par défaut
router.put('/:id/set-default', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Carte non trouvée'
      });
    }

    // Vérifier que la carte appartient à l'utilisateur
    if (card.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    // Retirer le statut par défaut de toutes les autres cartes
    const { query } = require('../config/database');
    await query(
      'UPDATE cards SET is_default = false WHERE user_id = $1 AND id != $2',
      [req.user.id, id]
    );

    // Définir cette carte comme par défaut
    const updatedCard = await card.update({ is_default: true });

    res.json({
      success: true,
      message: 'Carte définie comme carte par défaut',
      data: {
        card: updatedCard.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la définition de la carte par défaut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;