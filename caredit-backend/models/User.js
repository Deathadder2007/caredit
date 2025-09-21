const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateTokenPair } = require('../config/jwt');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.phoneNumber = data.phone_number;
    this.dateOfBirth = data.date_of_birth;
    this.address = data.address;
    this.city = data.city;
    this.country = data.country;
    this.balance = parseFloat(data.balance || 0);
    this.isVerified = data.is_verified;
    this.isActive = data.is_active;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Créer un nouvel utilisateur
  static async create(userData) {
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
        country = 'Togo'
      } = userData;

      // Vérifier si l'email existe déjà
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      // Hasher le mot de passe
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insérer l'utilisateur
      const result = await query(
        `INSERT INTO users (
          email, password_hash, first_name, last_name, phone_number,
          date_of_birth, address, city, country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          email, passwordHash, firstName, lastName, phoneNumber,
          dateOfBirth, address, city, country
        ]
      );

      const user = new User(result.rows[0]);

      // Créer les limites de transaction par défaut
      await query(
        'INSERT INTO transaction_limits (user_id, daily_limit, monthly_limit, single_transaction_limit) VALUES ($1, $2, $3, $4)',
        [user.id, 1000000, 5000000, 500000]
      );

      return user;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', error);
      throw error;
    }
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', error);
      throw error;
    }
  }

  // Authentifier un utilisateur
  static async authenticate(email, password) {
    try {
      const user = await User.findByEmail(email);
      
      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      if (!user.isActive) {
        throw new Error('Compte désactivé');
      }

      // Récupérer le hash du mot de passe
      const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id]
      );

      const passwordHash = result.rows[0].password_hash;
      const isValidPassword = await bcrypt.compare(password, passwordHash);

      if (!isValidPassword) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Générer les tokens
      const tokens = generateTokenPair(user);

      return {
        user: user.toJSON(),
        tokens
      };
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      throw error;
    }
  }

  // Mettre à jour les informations utilisateur
  async update(updateData) {
    try {
      const allowedFields = [
        'first_name', 'last_name', 'phone_number', 'date_of_birth',
        'address', 'city', 'country'
      ];

      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (allowedFields.includes(dbField) && value !== undefined) {
          fields.push(`${dbField} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      values.push(this.id);

      const result = await query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      return new User(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  // Mettre à jour le solde
  async updateBalance(amount, operation = 'add') {
    try {
      const newBalance = operation === 'add' 
        ? this.balance + amount 
        : this.balance - amount;

      if (newBalance < 0) {
        throw new Error('Solde insuffisant');
      }

      const result = await query(
        'UPDATE users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [newBalance, this.id]
      );

      this.balance = parseFloat(result.rows[0].balance);
      return this;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du solde:', error);
      throw error;
    }
  }

  // Vérifier le mot de passe
  async verifyPassword(password) {
    try {
      const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [this.id]
      );

      const passwordHash = result.rows[0].password_hash;
      return await bcrypt.compare(password, passwordHash);
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      throw error;
    }
  }

  // Changer le mot de passe
  async changePassword(currentPassword, newPassword) {
    try {
      const isValidPassword = await this.verifyPassword(currentPassword);
      
      if (!isValidPassword) {
        throw new Error('Mot de passe actuel incorrect');
      }

      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, this.id]
      );

      return true;
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  }

  // Obtenir les statistiques de l'utilisateur
  async getStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(DISTINCT c.id) as total_cards,
          COUNT(DISTINCT t.id) as total_transactions,
          COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END), 0) as total_spent,
          COALESCE(AVG(CASE WHEN t.status = 'completed' THEN t.amount ELSE NULL END), 0) as avg_transaction_amount
        FROM users u
        LEFT JOIN cards c ON u.id = c.user_id
        LEFT JOIN transactions t ON u.id = t.user_id
        WHERE u.id = $1
      `, [this.id]);

      return stats.rows[0];
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Obtenir les limites de transaction
  async getTransactionLimits() {
    try {
      const result = await query(
        'SELECT * FROM transaction_limits WHERE user_id = $1',
        [this.id]
      );

      if (result.rows.length === 0) {
        // Créer des limites par défaut
        await query(
          'INSERT INTO transaction_limits (user_id, daily_limit, monthly_limit, single_transaction_limit) VALUES ($1, $2, $3, $4)',
          [this.id, 1000000, 5000000, 500000]
        );

        return {
          daily_limit: 1000000,
          monthly_limit: 5000000,
          single_transaction_limit: 500000
        };
      }

      return result.rows[0];
    } catch (error) {
      console.error('Erreur lors de la récupération des limites:', error);
      throw error;
    }
  }

  // Convertir en JSON (sans données sensibles)
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phoneNumber: this.phoneNumber,
      dateOfBirth: this.dateOfBirth,
      address: this.address,
      city: this.city,
      country: this.country,
      balance: this.balance,
      isVerified: this.isVerified,
      isActive: this.isActive,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Méthode statique pour obtenir les informations de l'utilisateur courant (mock)
  static async me() {
    try {
      const result = await query('SELECT * FROM users LIMIT 1');
      if (result.rows.length === 0) {
        throw new Error('Aucun utilisateur trouvé');
      }
      return new User(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur courant:', error);
      throw error;
    }
  }

  // Méthode statique pour mettre à jour les données de l'utilisateur courant (mock)
  static async updateMyUserData(data) {
    try {
      const fields = [];
      const values = [];
      let i = 1;

      for (const key in data) {
        fields.push(`${key}=$${i}`);
        values.push(data[key]);
        i++;
      }

      const queryText = `UPDATE users SET ${fields.join(", ")} WHERE id=1 RETURNING *`;
      const result = await query(queryText, values);
      
      if (result.rows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }
}

module.exports = User;