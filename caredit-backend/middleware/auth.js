const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { verifyToken } = require('../config/jwt');

// Middleware d'authentification
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    // Vérifier le token
    const decoded = verifyToken(token);
    
    // Vérifier que l'utilisateur existe et est actif
    const userResult = await query(
      'SELECT id, email, first_name, last_name, is_active, is_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isVerified: user.is_verified
    };

    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

// Middleware pour vérifier si l'utilisateur est vérifié
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Compte non vérifié. Veuillez vérifier votre email.'
    });
  }
  next();
};

// Middleware pour vérifier les permissions (pour les admins)
const requireAdmin = async (req, res, next) => {
  try {
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Privilèges administrateur requis.'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur de vérification des permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Middleware pour vérifier les limites de transaction
const checkTransactionLimits = async (req, res, next) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant invalide'
      });
    }

    // Vérifier les limites de transaction
    const limitsResult = await query(
      'SELECT daily_limit, monthly_limit, single_transaction_limit FROM transaction_limits WHERE user_id = $1',
      [req.user.id]
    );

    if (limitsResult.rows.length === 0) {
      // Créer des limites par défaut si elles n'existent pas
      await query(
        'INSERT INTO transaction_limits (user_id, daily_limit, monthly_limit, single_transaction_limit) VALUES ($1, $2, $3, $4)',
        [req.user.id, 1000000, 5000000, 500000]
      );
    }

    const limits = limitsResult.rows[0] || {
      daily_limit: 1000000,
      monthly_limit: 5000000,
      single_transaction_limit: 500000
    };

    // Vérifier la limite de transaction unique
    if (amount > limits.single_transaction_limit) {
      return res.status(400).json({
        success: false,
        message: `Montant supérieur à la limite autorisée (${limits.single_transaction_limit} CFA)`
      });
    }

    // Vérifier la limite quotidienne
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailyUsageResult = await query(
      'SELECT COALESCE(SUM(amount), 0) as daily_usage FROM transactions WHERE user_id = $1 AND created_at >= $2 AND status = $3',
      [req.user.id, todayStart, 'completed']
    );

    const dailyUsage = parseFloat(dailyUsageResult.rows[0].daily_usage);
    
    if (dailyUsage + amount > limits.daily_limit) {
      return res.status(400).json({
        success: false,
        message: `Limite quotidienne dépassée. Usage: ${dailyUsage} CFA, Limite: ${limits.daily_limit} CFA`
      });
    }

    // Vérifier la limite mensuelle
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyUsageResult = await query(
      'SELECT COALESCE(SUM(amount), 0) as monthly_usage FROM transactions WHERE user_id = $1 AND created_at >= $2 AND status = $3',
      [req.user.id, monthStart, 'completed']
    );

    const monthlyUsage = parseFloat(monthlyUsageResult.rows[0].monthly_usage);
    
    if (monthlyUsage + amount > limits.monthly_limit) {
      return res.status(400).json({
        success: false,
        message: `Limite mensuelle dépassée. Usage: ${monthlyUsage} CFA, Limite: ${limits.monthly_limit} CFA`
      });
    }

    req.transactionLimits = limits;
    next();
  } catch (error) {
    console.error('Erreur de vérification des limites:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  authenticateToken,
  requireVerification,
  requireAdmin,
  checkTransactionLimits
};