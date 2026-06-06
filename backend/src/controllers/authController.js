const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const login = async (req, res) => {
  const { email, mot_de_passe, role } = req.body;

  try {
    let result;
    if (role === 'partenaire') {
      result = await db.query('SELECT * FROM partenaires WHERE email = $1', [email]);
    } else if (role === 'livreur') {
      result = await db.query('SELECT * FROM livreurs WHERE email = $1', [email]);
    } else {
      return res.status(400).json({ message: 'Role invalide' });
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    if (user.statut === 'suspendu') {
      return res.status(403).json({ message: 'Compte suspendu' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_SECRET || 'mayrelay_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion reussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role,
        statut: user.statut
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const register = async (req, res) => {
  const { nom, email, mot_de_passe, telephone, zone, role, vehicule } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    let result;
    if (role === 'partenaire') {
      result = await db.query(
        'INSERT INTO partenaires (nom, email, mot_de_passe, telephone, zone) VALUES ($1, $2, $3, $4, $5) RETURNING id, nom, email',
        [nom, email, hashedPassword, telephone, zone]
      );
    } else if (role === 'livreur') {
      result = await db.query(
        'INSERT INTO livreurs (nom, email, mot_de_passe, telephone, zone, vehicule) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nom, email',
        [nom, email, hashedPassword, telephone, zone, vehicule]
      );
    } else {
      return res.status(400).json({ message: 'Role invalide' });
    }

    res.status(201).json({
      message: 'Compte cree avec succes - en attente de validation',
      user: result.rows[0]
    });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email deja utilise' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { login, register };
