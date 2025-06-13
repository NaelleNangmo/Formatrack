import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 50545;
const JWT_SECRET = process.env.JWT_SECRET || 'formatrack_secret_key';

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de la base de données PostgreSQL
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes d'authentification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les clients
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur récupération client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const {
      nom, prenom, localite, telephone_parent, niveau_scolaire,
      domaine_etude, duree_formation, type_formation, statut_formation,
      prix_formation, montant_verse
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO clients (
        nom, prenom, localite, telephone_parent, niveau_scolaire,
        domaine_etude, duree_formation, type_formation, statut_formation,
        prix_formation, montant_verse
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [nom, prenom, localite, telephone_parent, niveau_scolaire,
       domaine_etude, duree_formation, type_formation, statut_formation,
       prix_formation, montant_verse]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erreur création client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    
    const values = [...Object.values(updates), id];

    await pool.query(
      `UPDATE clients SET ${setClause} WHERE id = $${values.length}`,
      values
    );

    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les cours
app.get('/api/cours', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, 
        STRING_AGG(CONCAT(cl.nom, ' ', cl.prenom), ', ') as clients_noms,
        COUNT(cc.client_id) as nombre_clients
      FROM cours c
      LEFT JOIN cours_clients cc ON c.id = cc.cours_id
      LEFT JOIN clients cl ON cc.client_id = cl.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/cours', authenticateToken, async (req, res) => {
  try {
    const { intitule, enseignant, clients } = req.body;

    const { rows } = await pool.query(
      'INSERT INTO cours (intitule, enseignant) VALUES ($1, $2) RETURNING id',
      [intitule, enseignant]
    );

    const coursId = rows[0].id;

    // Ajouter les clients au cours
    if (clients && clients.length > 0) {
      const values = clients.map(clientId => [coursId, clientId]);
      await pool.query(
        'INSERT INTO cours_clients (cours_id, client_id) VALUES ' +
        values.map((_, i) => `($${2*i + 1}, $${2*i + 2})`).join(', '),
        values.flat()
      );
    }

    const { rows: newCours } = await pool.query('SELECT * FROM cours WHERE id = $1', [coursId]);
    res.status(201).json(newCours[0]);
  } catch (error) {
    console.error('Erreur création cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/cours/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { intitule, enseignant, clients } = req.body;

    await pool.query(
      'UPDATE cours SET intitule = $1, enseignant = $2 WHERE id = $3',
      [intitule, enseignant, id]
    );

    // Mettre à jour les clients du cours
    await pool.query('DELETE FROM cours_clients WHERE cours_id = $1', [id]);
    
    if (clients && clients.length > 0) {
      const values = clients.map(clientId => [id, clientId]);
      await pool.query(
        'INSERT INTO cours_clients (cours_id, client_id) VALUES ' +
        values.map((_, i) => `($${2*i + 1}, $${2*i + 2})`).join(', '),
        values.flat()
      );
    }

    const { rows } = await pool.query('SELECT * FROM cours WHERE id = $1', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/cours/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM cours WHERE id = $1', [req.params.id]);
    res.json({ message: 'Cours supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les présences
app.get('/api/presences', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.nom, c.prenom, co.intitule as cours_nom
      FROM presences p
      JOIN clients c ON p.client_id = c.id
      JOIN cours co ON p.cours_id = co.id
      ORDER BY p.date_presence DESC, p.heure_presence DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération présences:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/cours/:id/clients', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.* FROM clients c
      JOIN cours_clients cc ON c.id = cc.client_id
      WHERE cc.cours_id = $1
      ORDER BY c.nom, c.prenom
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération clients du cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/presences', authenticateToken, async (req, res) => {
  try {
    const { client_id, cours_id, etat, heure_presence } = req.body;
    const date_presence = new Date().toISOString().split('T')[0];

    const { rows } = await pool.query(
      `INSERT INTO presences 
        (client_id, cours_id, date_presence, heure_presence, etat) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
      [client_id, cours_id, date_presence, heure_presence, etat]
    );

    // Vérifier si c'est un retard ou une absence
    if (etat === 'absent') {
      await pool.query(
        `INSERT INTO absences_retards 
          (client_id, cours_id, date, type) 
          VALUES ($1, $2, $3, 'absence')`,
        [client_id, cours_id, date_presence]
      );
    } else if (etat === 'present') {
      const [hours, minutes] = heure_presence.split(':').map(Number);
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        await pool.query(
          `INSERT INTO absences_retards 
            (client_id, cours_id, date, heure_presence, type) 
            VALUES ($1, $2, $3, $4, 'retard')`,
          [client_id, cours_id, date_presence, heure_presence]
        );
      }
    }

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erreur enregistrement présence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les paiements
app.get('/api/paiements', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.nom, c.prenom, u.username
      FROM paiements p
      JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.utilisateur_id = u.id
      ORDER BY p.date_paiement DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération paiements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/clients/:id/paiements', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.username
      FROM paiements p
      LEFT JOIN users u ON p.utilisateur_id = u.id
      WHERE p.client_id = $1
      ORDER BY p.date_paiement DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération paiements client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/paiements', authenticateToken, async (req, res) => {
  try {
    const { client_id, montant } = req.body;
    const utilisateur_id = req.user.id;

    const { rows } = await pool.query(
      `INSERT INTO paiements 
        (client_id, montant, utilisateur_id) 
        VALUES ($1, $2, $3)
        RETURNING *`,
      [client_id, montant, utilisateur_id]
    );

    // Mettre à jour le montant versé du client
    await pool.query(
      'UPDATE clients SET montant_verse = montant_verse + $1 WHERE id = $2',
      [montant, client_id]
    );

    const { rows: newPaiement } = await pool.query(`
      SELECT p.*, c.nom, c.prenom, u.username
      FROM paiements p
      JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.utilisateur_id = u.id
      WHERE p.id = $1
    `, [rows[0].id]);

    res.status(201).json(newPaiement[0]);
  } catch (error) {
    console.error('Erreur enregistrement paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les absences et retards
app.get('/api/absences-retards', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ar.*, c.nom, c.prenom, co.intitule as cours_nom
      FROM absences_retards ar
      JOIN clients c ON ar.client_id = c.id
      JOIN cours co ON ar.cours_id = co.id
      ORDER BY ar.date DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération absences/retards:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/clients/:id/absences-retards', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ar.*, co.intitule as cours_nom
      FROM absences_retards ar
      JOIN cours co ON ar.cours_id = co.id
      WHERE ar.client_id = $1
      ORDER BY ar.date DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération absences/retards client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/absences-retards/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM absences_retards WHERE id = $1', [req.params.id]);
    res.json({ message: 'Absence/Retard supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression absence/retard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les utilisateurs
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash) 
       VALUES ($1, $2)
       RETURNING id, username, created_at`,
      [username, hashedPassword]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Empêcher la suppression de son propre compte
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les statistiques du dashboard
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const clientsStats = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        COUNT(CASE WHEN statut_formation = 'en_cours' THEN 1 END) as actifs 
      FROM clients
    `);
    
    const coursStats = await pool.query('SELECT COUNT(*) as total FROM cours');
    const paiementsToday = await pool.query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements 
      WHERE DATE(date_paiement) = $1
    `, [today]);
    
    const absentsToday = await pool.query(`
      SELECT COUNT(*) as total 
      FROM absences_retards 
      WHERE date = $1 AND type = 'absence'
    `, [today]);
    
    const totalRecettes = await pool.query(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM paiements
    `);

    res.json({
      totalClients: clientsStats.rows[0].total,
      clientsActifs: clientsStats.rows[0].actifs,
      totalCours: coursStats.rows[0].total,
      paiementsAujourdhui: paiementsToday.rows[0].total,
      absentsAujourdhui: absentsToday.rows[0].total,
      totalRecettes: totalRecettes.rows[0].total
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});








// Fonction d'initialisation de la base de données PostgreSQL
async function initializeDatabase() {
  let client;
  
    client = await pool.connect();

    const queries = [
      `DROP VIEW IF EXISTS v_absences_retards_stats`,
      `DROP VIEW IF EXISTS v_suivi_financier`,
      `DROP TABLE IF EXISTS absences_retards`,
      `DROP TABLE IF EXISTS presences`,
      `DROP TABLE IF EXISTS paiements`,
      `DROP TABLE IF EXISTS cours_clients`,
      `DROP TABLE IF EXISTS clients`,
      `DROP TABLE IF EXISTS cours`,
      `DROP TABLE IF EXISTS users`,

      `DO $$ BEGIN
         CREATE TYPE type_formation_enum AS ENUM ('stagiaire', 'apprenant');
       EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN
         CREATE TYPE statut_formation_enum AS ENUM ('en_cours', 'suspendu', 'termine');
       EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN
         CREATE TYPE presence_etat_enum AS ENUM ('present', 'absent');
       EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN
         CREATE TYPE absence_type_enum AS ENUM ('absence', 'retard');
       EXCEPTION WHEN duplicate_object THEN null; END $$`,

      `CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE clients (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        localite VARCHAR(100),
        telephone_parent VARCHAR(20) NOT NULL,
        niveau_scolaire VARCHAR(50),
        domaine_etude VARCHAR(100),
        date_inscription DATE DEFAULT CURRENT_DATE,
        duree_formation INT NOT NULL,
        type_formation type_formation_enum NOT NULL,
        statut_formation statut_formation_enum NOT NULL DEFAULT 'en_cours',
        date_statut_modifie TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        prix_formation INT NOT NULL,
        montant_verse INT NOT NULL DEFAULT 0,
        montant_restant INT GENERATED ALWAYS AS (prix_formation - montant_verse) STORED,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE cours (
        id SERIAL PRIMARY KEY,
        intitule VARCHAR(255) NOT NULL,
        enseignant VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE cours_clients (
        id SERIAL PRIMARY KEY,
        cours_id INT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
        client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        UNIQUE (cours_id, client_id)
      )`,

      `CREATE TABLE presences (
        id SERIAL PRIMARY KEY,
        client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        cours_id INT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
        date_presence DATE DEFAULT CURRENT_DATE,
        heure_presence TIME DEFAULT CURRENT_TIME,
        etat presence_etat_enum NOT NULL
      )`,

      `CREATE TABLE paiements (
        id SERIAL PRIMARY KEY,
        client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        montant INT NOT NULL,
        date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        utilisateur_id INT REFERENCES users(id) ON DELETE SET NULL
      )`,

      `CREATE TABLE absences_retards (
        id SERIAL PRIMARY KEY,
        client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        cours_id INT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        heure_presence TIME,
        type absence_type_enum NOT NULL,
        remarque TEXT
      )`,

      `CREATE INDEX idx_presence_client ON presences(client_id)`,
      `CREATE INDEX idx_absences_client ON absences_retards(client_id)`,
      `CREATE INDEX idx_paiements_client ON paiements(client_id)`,
      `CREATE INDEX idx_cours_clients_cours ON cours_clients(cours_id)`,

      `CREATE OR REPLACE VIEW v_suivi_financier AS
        SELECT id, nom, prenom, prix_formation, montant_verse, montant_restant
        FROM clients`,

      `CREATE OR REPLACE VIEW v_absences_retards_stats AS
        SELECT client_id,
               COUNT(*) FILTER (WHERE type = 'absence') AS total_absences,
               COUNT(*) FILTER (WHERE type = 'retard') AS total_retards
        FROM absences_retards
        GROUP BY client_id`,

      `INSERT INTO users (username, password_hash, created_at) VALUES
        ('Naelle', '$2a$10$mb0Rk5y9FbNlAG0h7dNpTuZzFLNk49.eXRV1KtO1jqQzKSlYAjZeK', '2025-06-12 08:44:57')`
    ];

    for (const q of queries) {
      await client.query(q);
    }

    console.log("✅ Base de données PostgreSQL initialisée avec succès");
  
}

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  /*try {
    await initializeDatabase();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la base de données:', error);
  }*/
});