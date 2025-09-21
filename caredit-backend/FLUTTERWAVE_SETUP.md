# 🚀 Configuration Flutterwave CareCredit - Guide Complet

## ✅ Configuration Terminée

Vos clés Flutterwave ont été configurées avec succès dans le backend CareCredit !

### 🔑 Clés Configurées

```env
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-8cf390c968b74a273c5a6f412a78969f-X
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-c7b1470c209d61fe4ae0166a89422fd9-X
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST9dde2637ab6c
FLUTTERWAVE_WEBHOOK_SECRET=carecredit_webhook_secret_2024
```

## 🧪 Tests Disponibles

### 1. Test d'intégration Flutterwave
```bash
npm run test:flutterwave
```
**Ce test vérifie :**
- ✅ Connexion à l'API Flutterwave
- ✅ Récupération des banques togolaises
- ✅ Calcul des frais de transfert
- ✅ Validation des comptes bancaires
- ✅ Initialisation de paiements

### 2. Test des paiements end-to-end
```bash
npm run test:payment
```
**Ce test vérifie :**
- ✅ Connexion utilisateur
- ✅ Initialisation de paiements
- ✅ Transferts Mobile Money
- ✅ Validation de comptes
- ✅ Calcul des frais

## 🚀 Démarrage Rapide

### 1. Installer les dépendances
```bash
cd "projet application/caredit-backend"
npm install
```

### 2. Configurer la base de données
```bash
# Créer la base de données
createdb caredit

# Exécuter les migrations
npm run migrate

# Ajouter des données de test
npm run seed
```

### 3. Démarrer le serveur
```bash
npm run dev
```

### 4. Tester l'intégration Flutterwave
```bash
# Dans un autre terminal
npm run test:flutterwave
```

## 📡 Endpoints Flutterwave Disponibles

### Paiements
```http
POST /api/flutterwave/initialize-payment
POST /api/flutterwave/verify-payment
```

### Transferts
```http
POST /api/flutterwave/transfer-to-momo
POST /api/flutterwave/transfer-to-bank
```

### Utilitaires
```http
GET  /api/flutterwave/banks
POST /api/flutterwave/validate-account
POST /api/flutterwave/transfer-fees
POST /api/flutterwave/webhook
```

## 💳 Test de Paiement Complet

### 1. Initialiser un paiement
```bash
curl -X POST http://localhost:5000/api/flutterwave/initialize-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "XOF",
    "description": "Test de paiement"
  }'
```

### 2. Utiliser l'URL de paiement retournée
- Ouvrez l'URL dans votre navigateur
- Utilisez une carte de test Flutterwave
- Complétez le paiement

### 3. Vérifier le paiement
```bash
curl -X POST http://localhost:5000/api/flutterwave/verify-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TRANSACTION_ID"
  }'
```

## 🏦 Banques Togolaises Supportées

Votre intégration supporte automatiquement toutes les banques togolaises :

- **Ecobank Togo** (Code: 044)
- **Banque Atlantique Togo** (Code: 008)
- **Banque Internationale pour l'Afrique au Togo** (Code: 009)
- **Banque Togolaise pour le Commerce et l'Industrie** (Code: 010)
- Et toutes les autres banques supportées par Flutterwave

## 📱 Mobile Money Supporté

- **MTN MoMo** - Code: `MTN`
- **Moov Money** - Code: `MOOV`
- **Orange Money** - Code: `ORANGE`

## 🔗 Configuration Webhook

### 1. Dans Flutterwave Dashboard
- Allez dans "Settings" > "Webhooks"
- URL : `https://your-domain.com/api/flutterwave/webhook`
- Événements à sélectionner :
  - `charge.completed`
  - `charge.failed`
  - `transfer.completed`
  - `transfer.failed`

### 2. Webhook automatiquement configuré
- ✅ Vérification des signatures
- ✅ Traitement des événements
- ✅ Confirmation des paiements
- ✅ Gestion des échecs

## 🧪 Données de Test

### Cartes de test Flutterwave
```javascript
const TEST_CARDS = {
  visa: {
    number: '4187427415564246',
    cvv: '828',
    expiry_month: '09',
    expiry_year: '32',
    pin: '3310'
  },
  mastercard: {
    number: '5438898014560229',
    cvv: '564',
    expiry_month: '10',
    expiry_year: '31',
    pin: '3310'
  }
};
```

### Comptes Mobile Money de test
```javascript
const TEST_MOMO = {
  mtn: '+22890123456',
  moov: '+22890123457',
  orange: '+22890123458'
};
```

## 📊 Monitoring

### Logs automatiques
- Toutes les transactions Flutterwave sont loggées
- Erreurs trackées avec détails
- Webhooks enregistrés
- Métriques de performance

### Endpoints de monitoring
```http
GET /health                    # Santé du serveur
GET /api/flutterwave/balance   # Solde Flutterwave (admin)
```

## 🚀 Déploiement Production

### 1. Variables d'environnement production
```env
# Remplacer les clés de test par les clés de production
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3
FRONTEND_URL=https://your-domain.com
```

### 2. Configuration HTTPS
- Webhooks nécessitent HTTPS en production
- Certificats SSL valides requis
- Configuration CORS appropriée

### 3. Monitoring production
- Surveiller les taux de succès des paiements
- Alerter en cas d'erreurs fréquentes
- Monitorer les webhooks
- Tracker les frais de transaction

## 🆘 Support et Dépannage

### Problèmes courants

1. **Erreur de clés API**
   - Vérifiez que vos clés sont correctes
   - Assurez-vous d'utiliser les bonnes clés (test/production)

2. **Webhook non reçu**
   - Vérifiez l'URL du webhook
   - Assurez-vous que HTTPS est configuré
   - Vérifiez les logs du serveur

3. **Paiement échoué**
   - Vérifiez les logs Flutterwave
   - Contrôlez les limites de transaction
   - Vérifiez le solde utilisateur

### Logs utiles
```bash
# Voir les logs du serveur
npm run dev

# Voir les logs de test
npm run test:flutterwave
npm run test:payment
```

## 📞 Support Flutterwave

- **Documentation** : [developer.flutterwave.com](https://developer.flutterwave.com/)
- **Support** : support@flutterwave.com
- **Dashboard** : [dashboard.flutterwave.com](https://dashboard.flutterwave.com/)

---

## 🎉 Félicitations !

Votre backend CareCredit est maintenant **100% intégré avec Flutterwave** !

✅ **Paiements sécurisés** avec cartes bancaires  
✅ **Transferts Mobile Money** vers MTN, Moov, Orange  
✅ **Virements bancaires** vers toutes les banques togolaises  
✅ **Webhooks automatiques** pour la confirmation  
✅ **Gestion des erreurs** robuste  
✅ **Tests complets** inclus  

**Votre application est prête pour les paiements en Afrique de l'Ouest !** 🌍💳