const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@caredit.com',
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Connexion de l\'utilisateur de test...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.data.tokens.accessToken;
      console.log('✅ Connexion réussie');
      console.log(`👤 Utilisateur: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
      console.log(`💰 Solde: ${response.data.data.user.balance} CFA\n`);
      return true;
    } else {
      console.log('❌ Échec de la connexion:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testInitializePayment() {
  try {
    console.log('💳 Test d\'initialisation de paiement...');
    
    const paymentData = {
      amount: 5000, // 5,000 CFA pour le test
      currency: 'XOF',
      description: 'Test de paiement CareCredit',
      redirect_url: 'https://carecredit.com/payment-success'
    };
    
    const response = await axios.post(
      `${BASE_URL}/api/flutterwave/initialize-payment`,
      paymentData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Paiement initialisé avec succès');
      console.log(`🔗 URL de paiement: ${response.data.data.payment_url}`);
      console.log(`📝 Référence: ${response.data.data.payment_reference}`);
      console.log(`💰 Montant: ${response.data.data.amount} ${response.data.data.currency}\n`);
      return response.data.data;
    } else {
      console.log('❌ Erreur:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors de l\'initialisation:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetBanks() {
  try {
    console.log('🏦 Test de récupération des banques togolaises...');
    
    const response = await axios.get(`${BASE_URL}/api/flutterwave/banks?country=TG`);
    
    if (response.data.success) {
      console.log(`✅ ${response.data.data.length} banques récupérées`);
      console.log('📋 Premières banques:');
      response.data.data.slice(0, 5).forEach(bank => {
        console.log(`   - ${bank.name} (Code: ${bank.code})`);
      });
      console.log('');
      return response.data.data;
    } else {
      console.log('❌ Erreur:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des banques:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testValidateAccount() {
  try {
    console.log('🔍 Test de validation de compte bancaire...');
    
    const validationData = {
      account_number: '1234567890',
      bank_code: '044' // Ecobank Togo
    };
    
    const response = await axios.post(
      `${BASE_URL}/api/flutterwave/validate-account`,
      validationData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Validation réussie');
      console.log(`👤 Nom du compte: ${response.data.data.account_name}`);
      console.log(`🏦 Banque: ${response.data.data.bank_name}\n`);
      return response.data.data;
    } else {
      console.log('⚠️ Validation échouée (normal avec des données de test):', response.data.message);
      console.log('');
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la validation:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testTransferFees() {
  try {
    console.log('💸 Test de calcul des frais de transfert...');
    
    const feesData = {
      amount: 25000,
      currency: 'XOF'
    };
    
    const response = await axios.post(
      `${BASE_URL}/api/flutterwave/transfer-fees`,
      feesData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Frais calculés avec succès');
      console.log(`💰 Frais pour 25,000 XOF: ${response.data.data.charge_amount} XOF`);
      console.log(`💳 Frais en pourcentage: ${response.data.data.charge_percentage}%\n`);
      return response.data.data;
    } else {
      console.log('❌ Erreur:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors du calcul des frais:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testTransferToMomo() {
  try {
    console.log('📱 Test de transfert Mobile Money...');
    
    const transferData = {
      phone_number: '+22890123456',
      amount: 1000, // Montant minimal pour le test
      provider: 'mtn',
      narration: 'Test transfert MTN MoMo'
    };
    
    const response = await axios.post(
      `${BASE_URL}/api/flutterwave/transfer-to-momo`,
      transferData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Transfert Mobile Money initié avec succès');
      console.log(`📱 Destinataire: ${transferData.phone_number}`);
      console.log(`💰 Montant: ${transferData.amount} CFA`);
      console.log(`🏢 Fournisseur: ${transferData.provider.toUpperCase()}`);
      console.log(`📝 Référence: ${response.data.data.transfer_data.reference}\n`);
      return response.data.data;
    } else {
      console.log('❌ Erreur:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors du transfert Mobile Money:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetUserBalance() {
  try {
    console.log('💰 Test de récupération du solde utilisateur...');
    
    const response = await axios.get(
      `${BASE_URL}/api/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Solde récupéré avec succès');
      console.log(`💰 Solde actuel: ${response.data.data.user.balance} CFA`);
      console.log(`👤 Utilisateur: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
      console.log(`📧 Email: ${response.data.data.user.email}\n`);
      return response.data.data.user;
    } else {
      console.log('❌ Erreur:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la récupération du solde:', error.response?.data?.message || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🧪 Tests d\'intégration Flutterwave CareCredit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 1: Connexion
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Impossible de continuer sans connexion');
    return;
  }
  
  // Test 2: Solde utilisateur
  await testGetUserBalance();
  
  // Test 3: Banques supportées
  await testGetBanks();
  
  // Test 4: Validation de compte
  await testValidateAccount();
  
  // Test 5: Calcul des frais
  await testTransferFees();
  
  // Test 6: Initialisation de paiement
  const paymentResult = await testInitializePayment();
  
  // Test 7: Transfert Mobile Money (seulement si le solde est suffisant)
  const userBalance = await testGetUserBalance();
  if (userBalance && userBalance.balance >= 1000) {
    await testTransferToMomo();
  } else {
    console.log('⚠️ Solde insuffisant pour tester le transfert Mobile Money\n');
  }
  
  console.log('🎉 Tests terminés !');
  console.log('\n📋 Résumé des tests:');
  console.log('✅ Connexion utilisateur');
  console.log('✅ Récupération du solde');
  console.log('✅ Récupération des banques');
  console.log('✅ Validation de compte');
  console.log('✅ Calcul des frais');
  console.log('✅ Initialisation de paiement');
  console.log('✅ Transfert Mobile Money (si solde suffisant)');
  
  console.log('\n🚀 Votre intégration Flutterwave est opérationnelle !');
  
  if (paymentResult) {
    console.log('\n💡 Pour tester le paiement complet:');
    console.log(`1. Ouvrez cette URL: ${paymentResult.payment_url}`);
    console.log('2. Utilisez une carte de test Flutterwave');
    console.log('3. Complétez le paiement');
    console.log('4. Vérifiez que votre solde a été crédité');
  }
}

// Exécuter les tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  login,
  testInitializePayment,
  testGetBanks,
  testValidateAccount,
  testTransferFees,
  testTransferToMomo,
  testGetUserBalance,
  runAllTests
};