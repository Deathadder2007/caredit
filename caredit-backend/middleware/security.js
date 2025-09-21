const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { query } = require('../config/database');

// Configuration Helmet pour la sécurité
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// Rate limiting général
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limite de 100 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 tentatives de connexion par fenêtre
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting pour les transferts
const transferLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limite de 3 transferts par minute
  message: {
    success: false,
    message: 'Trop de transferts, veuillez attendre avant de réessayer.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware pour enregistrer les tentatives de connexion
const logLoginAttempt = async (req, res, next) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Enregistrer la tentative de connexion
    await query(
      'INSERT INTO login_attempts (email, ip_address, success, user_agent) VALUES ($1, $2, $3, $4)',
      [email, ip, false, userAgent]
    );

    next();
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la tentative de connexion:', error);
    next(); // Continuer même en cas d'erreur
  }
};

// Middleware pour vérifier les tentatives de connexion échouées
const checkLoginAttempts = async (req, res, next) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000; // 15 minutes

    // Compter les tentatives échouées dans les dernières 15 minutes
    const failedAttempts = await query(
      'SELECT COUNT(*) as count FROM login_attempts WHERE email = $1 AND ip_address = $2 AND success = false AND created_at > NOW() - INTERVAL \'15 minutes\'',
      [email, ip]
    );

    const attemptCount = parseInt(failedAttempts.rows[0].count);

    if (attemptCount >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Trop de tentatives de connexion échouées. Veuillez réessayer dans ${Math.ceil(lockoutTime / 60000)} minutes.`
      });
    }

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification des tentatives de connexion:', error);
    next(); // Continuer même en cas d'erreur
  }
};

// Middleware pour enregistrer les connexions réussies
const logSuccessfulLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Enregistrer la connexion réussie
    await query(
      'INSERT INTO login_attempts (email, ip_address, success, user_agent) VALUES ($1, $2, $3, $4)',
      [email, ip, true, userAgent]
    );

    // Mettre à jour la dernière connexion de l'utilisateur
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1',
      [email]
    );

    next();
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la connexion réussie:', error);
    next(); // Continuer même en cas d'erreur
  }
};

// Middleware pour vérifier la sécurité des mots de passe
const validatePasswordSecurity = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Mot de passe requis'
    });
  }

  // Vérifications de sécurité du mot de passe
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
  }
  if (!hasUpperCase) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  if (!hasLowerCase) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  if (!hasNumbers) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  if (!hasSpecialChar) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Mot de passe non conforme',
      errors: errors
    });
  }

  next();
};

// Middleware pour nettoyer les données d'entrée
const sanitizeInput = (req, res, next) => {
  // Fonction pour nettoyer les chaînes
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
  };

  // Nettoyer les données du body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Nettoyer les paramètres de requête
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  next();
};

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  transferLimiter,
  logLoginAttempt,
  checkLoginAttempts,
  logSuccessfulLogin,
  validatePasswordSecurity,
  sanitizeInput
};