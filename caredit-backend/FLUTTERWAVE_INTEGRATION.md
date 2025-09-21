# Intégration Flutterwave - CareCredit Backend

## 🚀 Configuration Flutterwave

### 1. Variables d'environnement

Ajoutez vos clés Flutterwave dans le fichier `.env` :

```env
# Flutterwave Configuration
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret_here
FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3

# Frontend URL (pour les redirections)
FRONTEND_URL=http://localhost:3000
```

### 2. Obtenir vos clés Flutterwave

1. **Créez un compte** sur [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. **Activez votre compte** et complétez la vérification
3. **Récupérez vos clés** dans la section "Settings" > "API Keys"
4. **Configurez les webhooks** dans "Settings" > "Webhooks"

## 📡 Endpoints API Flutterwave

### Initialiser un paiement

```http
POST /api/flutterwave/initialize-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "currency": "XOF",
  "description": "Recharge de compte",
  "redirect_url": "https://your-app.com/payment-success"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Paiement initialisé avec succès",
  "data": {
    "transaction": { ... },
    "payment_url": "https://checkout.flutterwave.com/v3/hosted/pay/...",
    "payment_reference": "CAREDIT_1234567890_abc123"
  }
}
```

### Vérifier un paiement

```http
POST /api/flutterwave/verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "transaction_id": "uuid-of-transaction"
}
```

### Transfert vers Mobile Money

```http
POST /api/flutterwave/transfer-to-momo
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone_number": "+22890123456",
  "amount": 25000,
  "provider": "mtn",
  "narration": "Transfert vers MTN MoMo"
}
```

### Transfert vers compte bancaire

```http
POST /api/flutterwave/transfer-to-bank
Authorization: Bearer <token>
Content-Type: application/json

{
  "account_bank": "044",
  "account_number": "1234567890",
  "amount": 100000,
  "beneficiary_name": "Jean Dupont",
  "narration": "Transfert vers compte bancaire"
}
```

### Obtenir les banques supportées

```http
GET /api/flutterwave/banks?country=TG
```

### Valider un compte bancaire

```http
POST /api/flutterwave/validate-account
Authorization: Bearer <token>
Content-Type: application/json

{
  "account_number": "1234567890",
  "bank_code": "044"
}
```

### Obtenir les frais de transfert

```http
POST /api/flutterwave/transfer-fees
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "currency": "XOF"
}
```

## 🔗 Webhook Flutterwave

### Configuration du webhook

1. **Dans Flutterwave Dashboard** :
   - Allez dans "Settings" > "Webhooks"
   - Ajoutez l'URL : `https://your-domain.com/api/flutterwave/webhook`
   - Sélectionnez les événements :
     - `charge.completed`
     - `charge.failed`
     - `transfer.completed`
     - `transfer.failed`

2. **Dans votre backend** :
   - Le webhook est automatiquement configuré
   - Vérification de signature incluse
   - Traitement automatique des événements

### Événements webhook traités

- **`charge.completed`** : Paiement réussi → Confirme la transaction et crédite le solde
- **`charge.failed`** : Paiement échoué → Marque la transaction comme échouée
- **`transfer.completed`** : Transfert réussi → Confirme la transaction
- **`transfer.failed`** : Transfert échoué → Annule et rembourse

## 💳 Méthodes de paiement supportées

### 1. Cartes bancaires
- Visa
- Mastercard
- American Express

### 2. Mobile Money (Togo)
- **MTN MoMo** : Code banque `MTN`
- **Moov Money** : Code banque `MOOV`
- **Orange Money** : Code banque `ORANGE`

### 3. Virements bancaires
- Toutes les banques togolaises supportées par Flutterwave
- Validation automatique des comptes

## 🔧 Codes banques populaires (Togo)

```javascript
const BANK_CODES = {
  '044': 'Ecobank Togo',
  '008': 'Banque Atlantique Togo',
  '009': 'Banque Internationale pour l\'Afrique au Togo',
  '010': 'Banque Togolaise pour le Commerce et l\'Industrie',
  '011': 'Banque Sahélo-Saharienne pour l\'Investissement et le Commerce',
  '012': 'Banque Populaire pour l\'Épargne et le Crédit',
  '013': 'Banque Régionale de Solidarité',
  '014': 'Banque de l\'Habitat du Togo',
  '015': 'Banque Commerciale du Togo',
  '016': 'Banque de Développement des États de l\'Afrique Centrale',
  '017': 'Banque Ouest-Africaine de Développement',
  '018': 'Banque Centrale des États de l\'Afrique de l\'Ouest',
  '019': 'Banque Islamique du Sénégal',
  '020': 'Banque de l\'Agriculture et du Développement Rural',
  '021': 'Banque de l\'Industrie et du Commerce',
  '022': 'Banque de l\'Épargne et du Crédit',
  '023': 'Banque de l\'Habitat',
  '024': 'Banque de l\'Artisanat',
  '025': 'Banque de la Jeunesse',
  '026': 'Banque de la Femme',
  '027': 'Banque de l\'Environnement',
  '028': 'Banque de l\'Innovation',
  '029': 'Banque du Numérique',
  '030': 'Banque de la Transition'
};
```

## 🛡️ Sécurité

### 1. Vérification des signatures webhook
```javascript
// Automatiquement géré par le service
const isValid = flutterwave.verifyWebhookSignature(payload, signature);
```

### 2. Chiffrement des données sensibles
```javascript
// Chiffrement automatique des données sensibles
const encryptedData = flutterwave.encryptData(sensitiveData);
```

### 3. Validation des montants
- Montant minimum : 1 CFA
- Montant maximum : Selon les limites Flutterwave
- Validation côté client et serveur

## 📊 Gestion des erreurs

### Codes d'erreur courants

```javascript
const ERROR_CODES = {
  'INSUFFICIENT_FUNDS': 'Solde insuffisant',
  'INVALID_ACCOUNT': 'Compte invalide',
  'TRANSACTION_FAILED': 'Transaction échouée',
  'NETWORK_ERROR': 'Erreur réseau',
  'INVALID_AMOUNT': 'Montant invalide',
  'ACCOUNT_BLOCKED': 'Compte bloqué',
  'DAILY_LIMIT_EXCEEDED': 'Limite quotidienne dépassée',
  'MONTHLY_LIMIT_EXCEEDED': 'Limite mensuelle dépassée'
};
```

### Gestion des erreurs dans le frontend

```javascript
// Exemple de gestion d'erreur
try {
  const response = await fetch('/api/flutterwave/initialize-payment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Rediriger vers la page de paiement
    window.location.href = result.data.payment_url;
  } else {
    // Afficher l'erreur
    showError(result.message);
  }
} catch (error) {
  showError('Erreur de connexion');
}
```

## 🧪 Tests

### Test en mode sandbox

```bash
# Utilisez les clés de test Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Données de test

```javascript
// Carte de test
const TEST_CARD = {
  number: '4187427415564246',
  cvv: '828',
  expiry_month: '09',
  expiry_year: '32',
  pin: '3310'
};

// Compte mobile money de test
const TEST_MOMO = {
  phone: '+22890123456',
  provider: 'mtn'
};
```

## 📈 Monitoring et logs

### Logs automatiques
- Toutes les transactions sont loggées
- Erreurs Flutterwave trackées
- Webhooks enregistrés
- Métriques de performance

### Monitoring recommandé
- Surveiller les taux de succès des paiements
- Alerter en cas d'erreurs fréquentes
- Monitorer les webhooks
- Tracker les frais de transaction

## 🚀 Déploiement

### Variables d'environnement production

```env
# Production
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
FRONTEND_URL=https://your-domain.com
```

### Configuration HTTPS
- Webhooks nécessitent HTTPS en production
- Certificats SSL valides requis
- Configuration CORS appropriée

## 📞 Support

### Documentation Flutterwave
- [Documentation officielle](https://developer.flutterwave.com/)
- [API Reference](https://developer.flutterwave.com/reference)
- [Webhooks Guide](https://developer.flutterwave.com/docs/integration-guides/webhooks)

### Support technique
- Email : support@flutterwave.com
- Chat : Disponible sur le dashboard
- Documentation : Centre d'aide Flutterwave

---

**Intégration Flutterwave CareCredit** - Paiements sécurisés pour l'Afrique de l'Ouest 🌍💳