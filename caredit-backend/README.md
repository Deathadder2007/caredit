# CareCredit Backend API

API REST complète pour l'application de banque digitale CareCredit.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 16+
- PostgreSQL 12+
- npm ou yarn

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd caredit-backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
cp .env.example .env
# Modifier les variables dans .env selon votre configuration
```

4. **Configuration de la base de données**
```bash
# Créer la base de données PostgreSQL
createdb caredit

# Exécuter les migrations
npm run migrate

# Ajouter des données de test
npm run seed
```

5. **Démarrer le serveur**
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

Le serveur sera accessible sur `http://localhost:5000`

## 📚 Documentation API

### Authentification

#### POST /api/auth/register
Inscription d'un nouvel utilisateur

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phoneNumber": "+228 90 12 34 56"
}
```

#### POST /api/auth/login
Connexion d'un utilisateur

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": "7d"
    }
  }
}
```

### Utilisateurs

#### GET /api/users/me
Obtenir les informations de l'utilisateur courant

**Headers:** `Authorization: Bearer <token>`

#### PUT /api/users/me
Mettre à jour le profil utilisateur

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phoneNumber": "+228 90 12 34 56",
  "address": "123 Rue de la Paix",
  "city": "Lomé"
}
```

### Cartes

#### GET /api/cards
Obtenir toutes les cartes de l'utilisateur

**Headers:** `Authorization: Bearer <token>`

#### POST /api/cards
Créer une nouvelle carte

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "cardType": "virtual",
  "cardBrand": "visa",
  "dailyLimit": 500000,
  "monthlyLimit": 2000000
}
```

#### PUT /api/cards/:id
Mettre à jour une carte

**Headers:** `Authorization: Bearer <token>`

#### POST /api/cards/:id/pin
Définir le PIN d'une carte

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "pin": "1234"
}
```

### Transactions

#### GET /api/transactions
Obtenir l'historique des transactions

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 20)
- `type`: Type de transaction (transfer, payment, withdrawal, etc.)
- `status`: Statut de la transaction (pending, completed, failed, cancelled)
- `startDate`: Date de début (ISO 8601)
- `endDate`: Date de fin (ISO 8601)

#### POST /api/transactions/transfer
Effectuer un transfert

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "recipient": "Marie Kouakou",
  "recipientPhone": "+228 90 98 76 54",
  "amount": 25000,
  "provider": "myfeda",
  "description": "Transfert pour les courses"
}
```

#### POST /api/transactions/bill-payment
Payer une facture

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "serviceType": "Électricité",
  "provider": "CEET",
  "accountNumber": "123456789",
  "amount": 15000,
  "description": "Paiement facture électricité"
}
```

### Services

#### GET /api/services
Obtenir la liste des services de paiement disponibles

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Électricité",
      "category": "utilities",
      "description": "Paiement des factures d'électricité",
      "icon": "zap",
      "providers": ["CEET", "Togo Electricité"]
    }
  ]
}
```

## 🔧 Configuration

### Variables d'environnement

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=caredit
DB_USER=winner
DB_PASSWORD=winner2007

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Serveur
PORT=5000
NODE_ENV=development

# Sécurité
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000

# Limites
DEFAULT_DAILY_LIMIT=1000000
DEFAULT_MONTHLY_LIMIT=5000000
DEFAULT_SINGLE_TRANSACTION_LIMIT=500000

# Frais
TRANSFER_FEE=50
WITHDRAWAL_FEE=100
```

## 🛡️ Sécurité

- **Authentification JWT** avec tokens d'accès et de rafraîchissement
- **Chiffrement des mots de passe** avec bcrypt
- **Rate limiting** pour prévenir les attaques par force brute
- **Validation des données** avec express-validator
- **Protection CORS** configurée
- **Headers de sécurité** avec Helmet
- **Logging des tentatives de connexion**

## 📊 Base de Données

### Tables principales

- **users**: Informations des utilisateurs
- **cards**: Cartes bancaires
- **transactions**: Historique des transactions
- **contacts**: Contacts des utilisateurs
- **notifications**: Notifications système
- **payment_services**: Services de paiement disponibles
- **service_providers**: Fournisseurs de services
- **transaction_limits**: Limites de transaction par utilisateur

### Migrations

```bash
# Exécuter les migrations
npm run migrate

# Ajouter des données de test
npm run seed
```

## 🧪 Tests

```bash
# Exécuter les tests
npm test

# Tests avec couverture
npm run test:coverage
```

## 📝 Scripts Disponibles

```bash
npm start          # Démarrer en production
npm run dev        # Démarrer en développement avec nodemon
npm test           # Exécuter les tests
npm run migrate    # Exécuter les migrations
npm run seed       # Ajouter des données de test
```

## 🚀 Déploiement

### Docker

```bash
# Construire l'image
docker build -t caredit-backend .

# Exécuter le conteneur
docker run -p 5000:5000 --env-file .env caredit-backend
```

### PM2

```bash
# Installer PM2
npm install -g pm2

# Démarrer avec PM2
pm2 start server.js --name "caredit-backend"

# Monitoring
pm2 monit
```

## 📈 Monitoring

- **Health Check**: `GET /health`
- **Logs**: Winston pour le logging structuré
- **Métriques**: Prêtes pour l'intégration avec Prometheus/Grafana

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub ou contacter l'équipe de développement.

---

**CareCredit Backend API** - Votre solution bancaire digitale complète 🏦💳