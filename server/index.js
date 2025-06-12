import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'formatrack_secret_key';

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'formatrack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

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
    
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
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
    const [rows] = await pool.execute('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erreur récupération clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
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

    const [result] = await pool.execute(
      `INSERT INTO clients (
        nom, prenom, localite, telephone_parent, niveau_scolaire,
        domaine_etude, duree_formation, type_formation, statut_formation,
        prix_formation, montant_verse
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, prenom, localite, telephone_parent, niveau_scolaire,
       domaine_etude, duree_formation, type_formation, statut_formation,
       prix_formation, montant_verse]
    );

    const [newClient] = await pool.execute('SELECT * FROM clients WHERE id = ?', [result.insertId]);
    res.status(201).json(newClient[0]);
  } catch (error) {
    console.error('Erreur création client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    await pool.execute(
      `UPDATE clients SET ${setClause} WHERE id = ?`,
      values
    );

    const [updatedClient] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id]);
    res.json(updatedClient[0]);
  } catch (error) {
    console.error('Erreur mise à jour client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    await pool.execute('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les cours
app.get('/api/cours', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, 
        GROUP_CONCAT(CONCAT(cl.nom, ' ', cl.prenom) SEPARATOR ', ') as clients_noms,
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

    const [result] = await pool.execute(
      'INSERT INTO cours (intitule, enseignant) VALUES (?, ?)',
      [intitule, enseignant]
    );

    const coursId = result.insertId;

    // Ajouter les clients au cours
    if (clients && clients.length > 0) {
      const values = clients.map(clientId => [coursId, clientId]);
      await pool.execute(
        'INSERT INTO cours_clients (cours_id, client_id) VALUES ?',
        [values]
      );
    }

    const [newCours] = await pool.execute('SELECT * FROM cours WHERE id = ?', [coursId]);
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

    await pool.execute(
      'UPDATE cours SET intitule = ?, enseignant = ? WHERE id = ?',
      [intitule, enseignant, id]
    );

    // Mettre à jour les clients du cours
    await pool.execute('DELETE FROM cours_clients WHERE cours_id = ?', [id]);
    
    if (clients && clients.length > 0) {
      const values = clients.map(clientId => [id, clientId]);
      await pool.execute(
        'INSERT INTO cours_clients (cours_id, client_id) VALUES ?',
        [values]
      );
    }

    const [updatedCours] = await pool.execute('SELECT * FROM cours WHERE id = ?', [id]);
    res.json(updatedCours[0]);
  } catch (error) {
    console.error('Erreur mise à jour cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/cours/:id', authenticateToken, async (req, res) => {
  try {
    await pool.execute('DELETE FROM cours WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cours supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les présences
app.get('/api/presences', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
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
    const [rows] = await pool.execute(`
      SELECT c.* FROM clients c
      JOIN cours_clients cc ON c.id = cc.client_id
      WHERE cc.cours_id = ?
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

    const [result] = await pool.execute(
      'INSERT INTO presences (client_id, cours_id, date_presence, heure_presence, etat) VALUES (?, ?, ?, ?, ?)',
      [client_id, cours_id, date_presence, heure_presence, etat]
    );

    // Vérifier si c'est un retard ou une absence
    if (etat === 'absent') {
      await pool.execute(
        'INSERT INTO absences_retards (client_id, cours_id, date, type) VALUES (?, ?, ?, ?)',
        [client_id, cours_id, date_presence, 'absence']
      );
    } else if (etat === 'present') {
      const [hours, minutes] = heure_presence.split(':').map(Number);
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        await pool.execute(
          'INSERT INTO absences_retards (client_id, cours_id, date, heure_presence, type) VALUES (?, ?, ?, ?, ?)',
          [client_id, cours_id, date_presence, heure_presence, 'retard']
        );
      }
    }

    const [newPresence] = await pool.execute('SELECT * FROM presences WHERE id = ?', [result.insertId]);
    res.status(201).json(newPresence[0]);
  } catch (error) {
    console.error('Erreur enregistrement présence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les paiements
app.get('/api/paiements', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, c.nom, c.prenom, u.username
      FROM paiements p
      JOIN clients c ON p.client_id = c.id
      JOIN users u ON p.utilisateur_id = u.id
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
    const [rows] = await pool.execute(`
      SELECT p.*, u.username
      FROM paiements p
      JOIN users u ON p.utilisateur_id = u.id
      WHERE p.client_id = ?
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

    const [result] = await pool.execute(
      'INSERT INTO paiements (client_id, montant, utilisateur_id) VALUES (?, ?, ?)',
      [client_id, montant, utilisateur_id]
    );

    // Mettre à jour le montant versé du client
    await pool.execute(
      'UPDATE clients SET montant_verse = montant_verse + ? WHERE id = ?',
      [montant, client_id]
    );

    const [newPaiement] = await pool.execute(`
      SELECT p.*, c.nom, c.prenom, u.username
      FROM paiements p
      JOIN clients c ON p.client_id = c.id
      JOIN users u ON p.utilisateur_id = u.id
      WHERE p.id = ?
    `, [result.insertId]);

    res.status(201).json(newPaiement[0]);
  } catch (error) {
    console.error('Erreur enregistrement paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les absences et retards
app.get('/api/absences-retards', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
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
    const [rows] = await pool.execute(`
      SELECT ar.*, co.intitule as cours_nom
      FROM absences_retards ar
      JOIN cours co ON ar.cours_id = co.id
      WHERE ar.client_id = ?
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
    await pool.execute('DELETE FROM absences_retards WHERE id = ?', [req.params.id]);
    res.json({ message: 'Absence/Retard supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression absence/retard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes pour les utilisateurs
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, username, created_at FROM users ORDER BY created_at DESC');
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

    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hashedPassword]
    );

    const [newUser] = await pool.execute(
      'SELECT id, username, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newUser[0]);
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

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
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

    const [clientsStats] = await pool.execute('SELECT COUNT(*) as total, COUNT(CASE WHEN statut_formation = "en_cours" THEN 1 END) as actifs FROM clients');
    const [coursStats] = await pool.execute('SELECT COUNT(*) as total FROM cours');
    const [paiementsToday] = await pool.execute('SELECT COALESCE(SUM(montant), 0) as total FROM paiements WHERE DATE(date_paiement) = ?', [today]);
    const [absentsToday] = await pool.execute('SELECT COUNT(*) as total FROM absences_retards WHERE date = ? AND type = "absence"', [today]);
    const [totalRecettes] = await pool.execute('SELECT COALESCE(SUM(montant), 0) as total FROM paiements');

    res.json({
      totalClients: clientsStats[0].total,
      clientsActifs: clientsStats[0].actifs,
      totalCours: coursStats[0].total,
      paiementsAujourdhui: paiementsToday[0].total,
      absentsAujourdhui: absentsToday[0].total,
      totalRecettes: totalRecettes[0].total
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Initialisation de la base de données
async function initializeDatabase() {
  try {
    // Créer un utilisateur admin par défaut
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (users[6].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        ['admin', hashedPassword]
      );
      console.log('Utilisateur admin créé avec succès');
    }
  } catch (error) {
    console.error('Erreur initialisation base de données:', error);
  }
}

// Démarrage du serveur
app.listen(PORT, async () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  await initializeDatabase();
});