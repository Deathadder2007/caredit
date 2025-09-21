const { body, param, query, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }
  next();
};

// Validations pour l'authentification
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis'),
  handleValidationErrors
];

// Validations pour les cartes
const validateCardCreation = [
  body('cardType')
    .isIn(['virtual', 'physical'])
    .withMessage('Type de carte invalide'),
  body('cardBrand')
    .isIn(['visa', 'mastercard', 'amex'])
    .withMessage('Marque de carte invalide'),
  body('dailyLimit')
    .optional()
    .isFloat({ min: 0, max: 10000000 })
    .withMessage('Limite quotidienne invalide'),
  body('monthlyLimit')
    .optional()
    .isFloat({ min: 0, max: 50000000 })
    .withMessage('Limite mensuelle invalide'),
  handleValidationErrors
];

const validateCardUpdate = [
  param('id')
    .isUUID()
    .withMessage('ID de carte invalide'),
  body('status')
    .optional()
    .isIn(['active', 'blocked', 'cancelled'])
    .withMessage('Statut de carte invalide'),
  body('dailyLimit')
    .optional()
    .isFloat({ min: 0, max: 10000000 })
    .withMessage('Limite quotidienne invalide'),
  body('monthlyLimit')
    .optional()
    .isFloat({ min: 0, max: 50000000 })
    .withMessage('Limite mensuelle invalide'),
  handleValidationErrors
];

// Validations pour les transactions
const validateTransaction = [
  body('type')
    .isIn(['transfer', 'payment', 'withdrawal', 'deposit', 'recharge', 'bill_payment'])
    .withMessage('Type de transaction invalide'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Montant invalide (minimum 1 CFA)'),
  body('recipient')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nom du destinataire invalide'),
  body('recipientPhone')
    .optional()
    .isMobilePhone()
    .withMessage('Numéro de téléphone du destinataire invalide'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description trop longue'),
  body('serviceType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Type de service invalide'),
  body('provider')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Fournisseur invalide'),
  handleValidationErrors
];

const validateTransfer = [
  body('recipient')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nom du destinataire requis'),
  body('recipientPhone')
    .isMobilePhone()
    .withMessage('Numéro de téléphone du destinataire invalide'),
  body('amount')
    .isFloat({ min: 100 })
    .withMessage('Montant minimum de 100 CFA'),
  body('provider')
    .isIn(['myfeda', 'mtn', 'moov', 'orange'])
    .withMessage('Fournisseur invalide'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description trop longue'),
  handleValidationErrors
];

// Validations pour les paiements de factures
const validateBillPayment = [
  body('serviceType')
    .trim()
    .notEmpty()
    .withMessage('Type de service requis'),
  body('provider')
    .trim()
    .notEmpty()
    .withMessage('Fournisseur requis'),
  body('accountNumber')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Numéro de compte invalide'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Montant invalide'),
  handleValidationErrors
];

// Validations pour les contacts
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nom du contact requis'),
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  handleValidationErrors
];

// Validations pour les paramètres utilisateur
const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Prénom invalide'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nom invalide'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Adresse trop longue'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Ville invalide'),
  handleValidationErrors
];

// Validations pour les paramètres de requête
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'amount', 'status', 'type'])
    .withMessage('Critère de tri invalide'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCardCreation,
  validateCardUpdate,
  validateTransaction,
  validateTransfer,
  validateBillPayment,
  validateContact,
  validateUserUpdate,
  validatePagination
};