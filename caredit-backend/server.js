const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import des configurations
const { testConnection } = require('./config/database');
const { helmetConfig, generalLimiter } = require('./middleware/security');

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cardRoutes = require('./routes/cards');
const transactionRoutes = require('./routes/transactions');
const flutterwaveRoutes = require('./routes/flutterwave');

// Import des modèles (pour compatibilité avec l'ancien code)
const User = require('./models/User');
const Card = require('./models/Card');
const Transaction = require('./models/Transaction');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares de sécurité
app.use(helmetConfig);
app.use(generalLimiter);

// Middlewares de base
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Routes de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/flutterwave', flutterwaveRoutes);

// Routes de compatibilité avec l'ancien code
app.get('/api/user/me', async (req, res) => {
  try {
    const user = await User.me();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/me', async (req, res) => {
  try {
    const user = await User.updateMyUserData(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cards', async (req, res) => {
  try {
    const cards = await Card.filter({});
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    const card = await Card.create(req.body);
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.filter({});
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const tx = await Transaction.create(req.body);
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes pour les services de paiement
app.get('/api/services', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const result = await query(`
      SELECT ps.*, 
             array_agg(sp.name) as providers
      FROM payment_services ps
      LEFT JOIN service_providers sp ON ps.id = sp.service_id
      WHERE ps.is_active = true
      GROUP BY ps.id
      ORDER BY ps.name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route pour vérifier une facture
app.get('/api/bills/verify', async (req, res) => {
  try {
    const { provider, accountNumber, serviceType } = req.query;
    
    // Simulation de vérification de facture
    // Dans un vrai système, vous feriez un appel API au fournisseur
    const mockBillInfo = {
      customerName: `Client ${accountNumber}`,
      amount: Math.floor(Math.random() * 50000) + 5000, // Entre 5000 et 55000 CFA
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billNumber: `BILL${Date.now()}`,
      provider,
      serviceType
    };
    
    res.json({
      success: true,
      data: mockBillInfo
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la facture'
    });
  }
});

// Route pour payer une facture
app.post('/api/bills/pay', async (req, res) => {
  try {
    const { provider, accountNumber, serviceType, amount, description, reference } = req.body;
    
    // Simulation de paiement de facture
    // Dans un vrai système, vous feriez un appel API au fournisseur
    const mockPaymentResult = {
      success: true,
      transactionId: `PAY${Date.now()}`,
      amount,
      provider,
      accountNumber,
      serviceType,
      reference,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Paiement de facture effectué avec succès',
      data: mockPaymentResult
    });
  } catch (error) {
    console.error('Erreur lors du paiement de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du paiement de la facture'
    });
  }
});

// Route pour les transferts
app.post('/api/transactions/transfer', async (req, res) => {
  try {
    const { recipient, recipientPhone, amount, provider, description, reference } = req.body;
    
    // Simulation de transfert
    const mockTransferResult = {
      success: true,
      transactionId: `TRF${Date.now()}`,
      amount,
      recipient,
      recipientPhone,
      provider,
      description,
      reference,
      fees: 50,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Transfert effectué avec succès',
      data: mockTransferResult
    });
  } catch (error) {
    console.error('Erreur lors du transfert:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du transfert'
    });
  }
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Fonction de démarrage du serveur
async function startServer() {
  try {
    // Tester la connexion à la base de données
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log('🚀 Serveur CareCredit démarré avec succès!');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log('✅ Backend running on port ' + PORT);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu. Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu. Arrêt du serveur...');
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  process.exit(1);
});

// Démarrer le serveur
startServer();

module.exports = app;