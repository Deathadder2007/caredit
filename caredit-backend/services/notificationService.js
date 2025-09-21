const { query } = require('../config/database');

class NotificationService {
  // Créer une notification
  static async create(userId, title, message, type = 'info') {
    try {
      const result = await query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, title, message, type]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  // Envoyer une notification de transaction
  static async sendTransactionNotification(userId, transaction) {
    try {
      let title, message;

      switch (transaction.type) {
        case 'transfer':
          title = 'Transfert effectué';
          message = `Transfert de ${transaction.amount} CFA vers ${transaction.recipient} effectué avec succès.`;
          break;
        case 'payment':
          title = 'Paiement effectué';
          message = `Paiement de ${transaction.amount} CFA pour ${transaction.serviceType} effectué avec succès.`;
          break;
        case 'withdrawal':
          title = 'Retrait effectué';
          message = `Retrait de ${transaction.amount} CFA effectué avec succès.`;
          break;
        case 'deposit':
          title = 'Dépôt reçu';
          message = `Dépôt de ${transaction.amount} CFA reçu avec succès.`;
          break;
        case 'recharge':
          title = 'Recharge effectuée';
          message = `Recharge de ${transaction.amount} CFA effectuée avec succès.`;
          break;
        case 'bill_payment':
          title = 'Facture payée';
          message = `Paiement de facture ${transaction.serviceType} de ${transaction.amount} CFA effectué avec succès.`;
          break;
        default:
          title = 'Transaction effectuée';
          message = `Transaction de ${transaction.amount} CFA effectuée avec succès.`;
      }

      return await this.create(userId, title, message, 'success');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de transaction:', error);
      throw error;
    }
  }

  // Envoyer une notification de sécurité
  static async sendSecurityNotification(userId, event, details = {}) {
    try {
      let title, message;

      switch (event) {
        case 'login':
          title = 'Nouvelle connexion';
          message = `Connexion détectée depuis ${details.ipAddress || 'un appareil inconnu'}.`;
          break;
        case 'password_change':
          title = 'Mot de passe modifié';
          message = 'Votre mot de passe a été modifié avec succès.';
          break;
        case 'pin_set':
          title = 'PIN défini';
          message = 'Un nouveau PIN a été défini pour votre carte.';
          break;
        case 'card_blocked':
          title = 'Carte bloquée';
          message = `Votre carte ${details.cardNumber || 'XXXX'} a été bloquée.`;
          break;
        case 'card_unblocked':
          title = 'Carte débloquée';
          message = `Votre carte ${details.cardNumber || 'XXXX'} a été débloquée.`;
          break;
        case 'suspicious_activity':
          title = 'Activité suspecte détectée';
          message = 'Une activité suspecte a été détectée sur votre compte. Veuillez vérifier vos transactions.';
          break;
        default:
          title = 'Notification de sécurité';
          message = 'Une activité de sécurité a été détectée sur votre compte.';
      }

      return await this.create(userId, title, message, 'warning');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de sécurité:', error);
      throw error;
    }
  }

  // Envoyer une notification de limite
  static async sendLimitNotification(userId, limitType, currentUsage, limit) {
    try {
      const percentage = (currentUsage / limit) * 100;
      let title, message, type;

      if (percentage >= 90) {
        title = 'Limite presque atteinte';
        message = `Vous avez utilisé ${percentage.toFixed(1)}% de votre limite ${limitType}. Usage: ${currentUsage} CFA / ${limit} CFA`;
        type = 'warning';
      } else if (percentage >= 100) {
        title = 'Limite dépassée';
        message = `Vous avez dépassé votre limite ${limitType}. Usage: ${currentUsage} CFA / ${limit} CFA`;
        type = 'error';
      } else {
        return null; // Pas de notification si la limite n'est pas proche
      }

      return await this.create(userId, title, message, type);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de limite:', error);
      throw error;
    }
  }

  // Envoyer une notification de maintenance
  static async sendMaintenanceNotification(userId, maintenanceDetails) {
    try {
      const { startTime, endTime, description } = maintenanceDetails;
      
      const title = 'Maintenance programmée';
      const message = `Une maintenance est programmée du ${startTime} au ${endTime}. ${description || 'Le service pourrait être temporairement indisponible.'}`;

      return await this.create(userId, title, message, 'info');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de maintenance:', error);
      throw error;
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId, userId) {
    try {
      const result = await query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [notificationId, userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      throw error;
    }
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(userId) {
    try {
      const result = await query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING COUNT(*) as updated_count',
        [userId]
      );

      return parseInt(result.rows[0].updated_count);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      throw error;
    }
  }

  // Obtenir les notifications non lues
  static async getUnreadCount(userId) {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
      throw error;
    }
  }

  // Supprimer les anciennes notifications
  static async cleanupOldNotifications(daysOld = 30) {
    try {
      const result = await query(
        'DELETE FROM notifications WHERE created_at < NOW() - INTERVAL \'$1 days\' AND is_read = true',
        [daysOld]
      );

      return result.rowCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage des anciennes notifications:', error);
      throw error;
    }
  }

  // Envoyer une notification en masse
  static async sendBulkNotification(userIds, title, message, type = 'info') {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.create(userId, title, message, type);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notifications en masse:', error);
      throw error;
    }
  }

  // Obtenir les statistiques des notifications
  static async getNotificationStats(userId) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
          COUNT(CASE WHEN type = 'info' THEN 1 END) as info_count,
          COUNT(CASE WHEN type = 'success' THEN 1 END) as success_count,
          COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning_count,
          COUNT(CASE WHEN type = 'error' THEN 1 END) as error_count
        FROM notifications 
        WHERE user_id = $1
      `, [userId]);

      return result.rows[0];
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;