const Card = require('../models/Card');
const Transaction = require('../models/Transaction');
const NotificationService = require('./notificationService');
const { query } = require('../config/database');

class CardService {
  // Créer une nouvelle carte avec validation
  static async createCard(userId, cardData) {
    try {
      const {
        cardType,
        cardBrand,
        dailyLimit,
        monthlyLimit,
        isDefault = false
      } = cardData;

      // Vérifier si l'utilisateur peut créer une nouvelle carte
      const existingCards = await Card.findByUserId(userId);
      
      // Limite de 5 cartes par utilisateur
      if (existingCards.length >= 5) {
        throw new Error('Limite de 5 cartes par utilisateur atteinte');
      }

      // Créer la carte
      const card = await Card.create({
        userId,
        cardType,
        cardBrand,
        dailyLimit,
        monthlyLimit,
        isDefault
      });

      // Envoyer une notification
      await NotificationService.create(
        userId,
        'Nouvelle carte créée',
        `Votre nouvelle carte ${card.cardBrand.toUpperCase()} ${card.cardType} a été créée avec succès.`,
        'success'
      );

      return card;
    } catch (error) {
      console.error('Erreur lors de la création de la carte:', error);
      throw error;
    }
  }

  // Bloquer/Débloquer une carte
  static async toggleCardStatus(cardId, userId) {
    try {
      const card = await Card.findById(cardId);

      if (!card) {
        throw new Error('Carte non trouvée');
      }

      if (card.userId !== userId) {
        throw new Error('Accès refusé');
      }

      const newStatus = card.status === 'active' ? 'blocked' : 'active';
      const updatedCard = await card.update({ status: newStatus });

      // Envoyer une notification
      const action = newStatus === 'blocked' ? 'bloquée' : 'débloquée';
      await NotificationService.sendSecurityNotification(userId, `card_${newStatus}`, {
        cardNumber: card.cardNumber.slice(-4)
      });

      return updatedCard;
    } catch (error) {
      console.error('Erreur lors du changement de statut de la carte:', error);
      throw error;
    }
  }

  // Définir le PIN d'une carte
  static async setCardPin(cardId, userId, pin) {
    try {
      const card = await Card.findById(cardId);

      if (!card) {
        throw new Error('Carte non trouvée');
      }

      if (card.userId !== userId) {
        throw new Error('Accès refusé');
      }

      await card.setPin(pin);

      // Envoyer une notification
      await NotificationService.sendSecurityNotification(userId, 'pin_set', {
        cardNumber: card.cardNumber.slice(-4)
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la définition du PIN:', error);
      throw error;
    }
  }

  // Mettre à jour les limites d'une carte
  static async updateCardLimits(cardId, userId, limitsData) {
    try {
      const card = await Card.findById(cardId);

      if (!card) {
        throw new Error('Carte non trouvée');
      }

      if (card.userId !== userId) {
        throw new Error('Accès refusé');
      }

      const { dailyLimit, monthlyLimit } = limitsData;

      // Vérifier que les nouvelles limites sont cohérentes
      if (dailyLimit && monthlyLimit && dailyLimit > monthlyLimit) {
        throw new Error('La limite quotidienne ne peut pas être supérieure à la limite mensuelle');
      }

      const updatedCard = await card.update({
        daily_limit: dailyLimit,
        monthly_limit: monthlyLimit
      });

      // Envoyer une notification
      await NotificationService.create(
        userId,
        'Limites de carte mises à jour',
        `Les limites de votre carte ont été mises à jour. Quotidienne: ${dailyLimit} CFA, Mensuelle: ${monthlyLimit} CFA`,
        'info'
      );

      return updatedCard;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des limites:', error);
      throw error;
    }
  }

  // Obtenir les statistiques d'une carte
  static async getCardStats(cardId, userId, period = 'month') {
    try {
      const card = await Card.findById(cardId);

      if (!card) {
        throw new Error('Carte non trouvée');
      }

      if (card.userId !== userId) {
        throw new Error('Accès refusé');
      }

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

      const stats = await query(`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(amount), 0) as total_spent,
          COALESCE(AVG(amount), 0) as avg_transaction,
          COALESCE(SUM(fees), 0) as total_fees,
          COUNT(CASE WHEN type = 'transfer' THEN 1 END) as transfer_count,
          COUNT(CASE WHEN type = 'payment' THEN 1 END) as payment_count,
          COUNT(CASE WHEN type = 'withdrawal' THEN 1 END) as withdrawal_count
        FROM transactions 
        WHERE card_id = $1 
        AND status = 'completed'
        AND created_at >= $2
      `, [cardId, startDate]);

      const usageStats = await card.checkLimits(0); // Vérifier l'usage actuel

      return {
        period,
        startDate,
        endDate: now,
        card: card.toJSON(),
        usage: usageStats,
        transactions: stats.rows[0]
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de la carte:', error);
      throw error;
    }
  }

  // Vérifier l'éligibilité pour une nouvelle carte
  static async checkCardEligibility(userId, cardType) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      if (!user.isVerified) {
        return {
          eligible: false,
          reason: 'Compte non vérifié'
        };
      }

      const existingCards = await Card.findByUserId(userId);
      
      if (existingCards.length >= 5) {
        return {
          eligible: false,
          reason: 'Limite de 5 cartes atteinte'
        };
      }

      // Vérifier s'il y a des cartes du même type
      const sameTypeCards = existingCards.filter(card => card.cardType === cardType);
      
      if (cardType === 'physical' && sameTypeCards.length >= 2) {
        return {
          eligible: false,
          reason: 'Limite de 2 cartes physiques atteinte'
        };
      }

      if (cardType === 'virtual' && sameTypeCards.length >= 3) {
        return {
          eligible: false,
          reason: 'Limite de 3 cartes virtuelles atteinte'
        };
      }

      return {
        eligible: true,
        reason: 'Éligible pour une nouvelle carte'
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'éligibilité:', error);
      throw error;
    }
  }

  // Supprimer une carte avec vérifications
  static async deleteCard(cardId, userId) {
    try {
      const card = await Card.findById(cardId);

      if (!card) {
        throw new Error('Carte non trouvée');
      }

      if (card.userId !== userId) {
        throw new Error('Accès refusé');
      }

      // Vérifier s'il y a des transactions en cours
      const pendingTransactions = await query(
        'SELECT COUNT(*) as count FROM transactions WHERE card_id = $1 AND status = $2',
        [cardId, 'pending']
      );

      if (parseInt(pendingTransactions.rows[0].count) > 0) {
        throw new Error('Impossible de supprimer une carte avec des transactions en cours');
      }

      // Vérifier s'il y a des transactions récentes (dans les 24h)
      const recentTransactions = await query(
        'SELECT COUNT(*) as count FROM transactions WHERE card_id = $1 AND created_at > NOW() - INTERVAL \'24 hours\'',
        [cardId]
      );

      if (parseInt(recentTransactions.rows[0].count) > 0) {
        throw new Error('Impossible de supprimer une carte avec des transactions récentes');
      }

      // Supprimer la carte
      await card.delete();

      // Envoyer une notification
      await NotificationService.create(
        userId,
        'Carte supprimée',
        `Votre carte ${card.cardBrand.toUpperCase()} ${card.cardNumber.slice(-4)} a été supprimée.`,
        'info'
      );

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la carte:', error);
      throw error;
    }
  }

  // Obtenir le résumé de toutes les cartes d'un utilisateur
  static async getUserCardsSummary(userId) {
    try {
      const cards = await Card.findByUserId(userId);
      
      const summary = {
        totalCards: cards.length,
        activeCards: cards.filter(card => card.status === 'active').length,
        blockedCards: cards.filter(card => card.status === 'blocked').length,
        pendingCards: cards.filter(card => card.status === 'pending').length,
        virtualCards: cards.filter(card => card.cardType === 'virtual').length,
        physicalCards: cards.filter(card => card.cardType === 'physical').length,
        totalDailyLimit: cards.reduce((sum, card) => sum + card.dailyLimit, 0),
        totalMonthlyLimit: cards.reduce((sum, card) => sum + card.monthlyLimit, 0),
        totalDailyUsage: cards.reduce((sum, card) => sum + (card.dailyUsage || 0), 0),
        totalMonthlyUsage: cards.reduce((sum, card) => sum + (card.monthlyUsage || 0), 0)
      };

      return summary;
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé des cartes:', error);
      throw error;
    }
  }

  // Vérifier les limites et envoyer des alertes
  static async checkLimitsAndAlert(userId) {
    try {
      const cards = await Card.findByUserId(userId);

      for (const card of cards) {
        if (card.status !== 'active') continue;

        const limitsCheck = await card.checkLimits(0);
        
        // Vérifier la limite quotidienne
        if (limitsCheck.dailyUsage > card.dailyLimit * 0.9) {
          await NotificationService.sendLimitNotification(
            userId,
            'quotidienne',
            limitsCheck.dailyUsage,
            card.dailyLimit
          );
        }

        // Vérifier la limite mensuelle
        if (limitsCheck.monthlyUsage > card.monthlyLimit * 0.9) {
          await NotificationService.sendLimitNotification(
            userId,
            'mensuelle',
            limitsCheck.monthlyUsage,
            card.monthlyLimit
          );
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des limites:', error);
      throw error;
    }
  }
}

module.exports = CardService;