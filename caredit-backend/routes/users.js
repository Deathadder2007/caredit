const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { validateUserUpdate, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Obtenir les informations de l'utilisateur courant
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Mettre à jour les informations de l'utilisateur courant
router.put('/me', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const updatedUser = await user.update(req.body);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du profil'
    });
  }
});

// Obtenir les statistiques de l'utilisateur
router.get('/me/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const stats = await user.getStats();

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

// Obtenir les limites de transaction de l'utilisateur
router.get('/me/limits', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const limits = await user.getTransactionLimits();

    res.json({
      success: true,
      data: {
        limits
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des limites:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Mettre à jour les limites de transaction
router.put('/me/limits', authenticateToken, requireVerification, async (req, res) => {
  try {
    const { dailyLimit, monthlyLimit, singleTransactionLimit } = req.body;

    if (!dailyLimit && !monthlyLimit && !singleTransactionLimit) {
      return res.status(400).json({
        success: false,
        message: 'Au moins une limite doit être fournie'
      });
    }

    const { query } = require('../config/database');
    
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (dailyLimit !== undefined) {
      updateFields.push(`daily_limit = $${paramIndex}`);
      values.push(dailyLimit);
      paramIndex++;
    }

    if (monthlyLimit !== undefined) {
      updateFields.push(`monthly_limit = $${paramIndex}`);
      values.push(monthlyLimit);
      paramIndex++;
    }

    if (singleTransactionLimit !== undefined) {
      updateFields.push(`single_transaction_limit = $${paramIndex}`);
      values.push(singleTransactionLimit);
      paramIndex++;
    }

    values.push(req.user.id);

    const result = await query(
      `UPDATE transaction_limits SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Limites mises à jour avec succès',
      data: {
        limits: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des limites:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour des limites'
    });
  }
});

// Supprimer le compte utilisateur
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis pour supprimer le compte'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.verifyPassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Vérifier s'il y a des transactions en cours
    const { query } = require('../config/database');
    const pendingTransactions = await query(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = $1 AND status = $2',
      [req.user.id, 'pending']
    );

    if (parseInt(pendingTransactions.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer le compte avec des transactions en cours'
      });
    }

    // Désactiver le compte au lieu de le supprimer
    await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir l'historique des connexions
router.get('/me/login-history', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { query } = require('../config/database');
    
    const result = await query(
      `SELECT ip_address, success, user_agent, created_at 
       FROM login_attempts 
       WHERE email = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.email, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM login_attempts WHERE email = $1',
      [req.user.email]
    );

    res.json({
      success: true,
      data: {
        loginHistory: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des connexions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Obtenir les notifications de l'utilisateur
router.get('/me/notifications', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    const { query } = require('../config/database');
    
    let queryText = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (unreadOnly === 'true') {
      queryText += ` AND is_read = false`;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    const countQuery = unreadOnly === 'true' 
      ? 'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1 AND is_read = false'
      : 'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1';
    
    const countResult = await query(countQuery, [req.user.id]);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Marquer une notification comme lue
router.put('/me/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { query } = require('../config/database');
    
    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Notification marquée comme lue',
      data: {
        notification: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Marquer toutes les notifications comme lues
router.put('/me/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;