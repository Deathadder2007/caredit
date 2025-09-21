const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authLimiter, logLoginAttempt, checkLoginAttempts, logSuccessfulLogin } = require('../middleware/security');

const router = express.Router();

// Inscription d'un nouvel utilisateur
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      address,
      city,
      country
    } = req.body;

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      address,
      city,
      country
    });

    // Générer les tokens
    const tokens = require('../config/jwt').generateTokenPair(user);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: user.toJSON(),
        tokens
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de l\'inscription'
    });
  }
});

// Connexion d'un utilisateur
router.post('/login', 
  authLimiter, 
  logLoginAttempt, 
  checkLoginAttempts, 
  validateLogin, 
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Authentifier l'utilisateur
      const authResult = await User.authenticate(email, password);

      // Enregistrer la connexion réussie
      await logSuccessfulLogin(req, res, () => {});

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: authResult
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Erreur lors de la connexion'
      });
    }
  }
);

// Rafraîchir le token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement requis'
      });
    }

    const { verifyToken, generateAccessToken } = require('../config/jwt');
    const decoded = verifyToken(refreshToken);

    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // Générer un nouveau token d'accès
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: 'user'
    });

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(401).json({
      success: false,
      message: 'Token de rafraîchissement invalide'
    });
  }
});

// Déconnexion
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Ici, vous pourriez ajouter le token à une liste noire
    // ou supprimer la session de la base de données
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
});

// Changer le mot de passe
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    const user = await User.findById(req.user.id);
    await user.changePassword(currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors du changement de mot de passe'
    });
  }
});

// Vérifier le token (pour vérifier si l'utilisateur est connecté)
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      message: 'Token valide',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
});

// Demander une réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    const user = await User.findByEmail(email);
    
    if (!user) {
      // Pour des raisons de sécurité, ne pas révéler si l'email existe
      return res.json({
        success: true,
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation'
      });
    }

    // Ici, vous pourriez envoyer un email avec un lien de réinitialisation
    // Pour l'instant, on retourne juste un message de succès

    res.json({
      success: true,
      message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation'
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation'
    });
  }
});

// Réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token et nouveau mot de passe requis'
      });
    }

    // Ici, vous devriez vérifier le token de réinitialisation
    // et mettre à jour le mot de passe
    
    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
});

module.exports = router;