const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const uploadsPath = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/Uploads', express.static(uploadsPath));

app.use((req, res, next) => {
  console.log(`Requête reçue: ${req.method} ${req.url}`);
  next();
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
  port: process.env.DB_PORT || 3306,
});

db.connect(err => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    return;
  }
  console.log('Connecté à la base de données MySQL');
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsPath);
    },
    filename: (req, file, cb) => {
        const cleanFileName = file.originalname
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9.-]/g, '-')
            .replace(/-+/g, '-')
            .toLowerCase();
        cb(null, `${Date.now()}-${cleanFileName}`);
    },
});

const upload = multer({ storage: storage });

app.post('/register', async (req, res) => {
  const { prenom, nom, email, telephone, password, gender } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (prenom, nom, email, telephone, password, gender) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [prenom, nom, email, telephone, hashedPassword, gender || 'Autre'], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'inscription:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      res.status(201).json({ message: 'Utilisateur inscrit avec succès' });
    });
  } catch (error) {
    console.error('Erreur lors du hachage du mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.post('/login', (req, res) => {
  const { email, telephone, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ? OR telephone = ?';
  db.query(query, [email || null, telephone || null], async (err, results) => {
    if (err) {
      console.error('Erreur lors de la connexion:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }
    res.json({
      id: user.id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      profile_pic: user.profile_pic ? `http://localhost:400${user.profile_pic}` : null,
      created_at: user.created_at,
    });
  });
});

app.get('/users', (req, res) => {
  const query = 'SELECT id, prenom, nom, email, telephone, profile_pic, created_at FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    res.json(
      results.map(user => ({
        ...user,
        profile_pic: user.profile_pic ? `http://localhost:400${user.profile_pic}` : null,
      }))
    );
  });
});

app.get('/users/:userId', (req, res) => {
  const query = 'SELECT id, prenom, nom, email, profile_pic FROM users WHERE id = ?';
  db.query(query, [req.params.userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({
      ...results[0],
      profile_pic: results[0].profile_pic ? `http://localhost:400${results[0].profile_pic}` : null,
    });
  });
});

app.post('/upload-profile-pic/:userId', upload.single('profilePic'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier téléchargé' });
  }
  const profilePicPath = `/Uploads/${req.file.filename}`;
  const query = 'UPDATE users SET profile_pic = ? WHERE id = ?';
  db.query(query, [profilePicPath, req.params.userId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de la photo de profil:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    res.json({ profilePic: `http://localhost:400${profilePicPath}` });
  });
});

app.put('/update-profile/:userId', async (req, res) => {
  const { userId } = req.params;
  const { prenom, nom, email, telephone, password } = req.body;
  try {
    const userQuery = 'SELECT * FROM users WHERE id = ?';
    db.query(userQuery, [userId], async (err, results) => {
      if (err) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      let query = 'UPDATE users SET prenom = ?, nom = ?, email = ?, telephone = ?';
      const queryParams = [prenom, nom, email, telephone];
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ', password = ?';
        queryParams.push(hashedPassword);
      }
      query += ' WHERE id = ?';
      queryParams.push(userId);
      db.query(query, queryParams, (err, result) => {
        if (err) {
          console.error('Erreur lors de la mise à jour du profil:', err);
          return res.status(500).json({ message: 'Erreur serveur', error: err.message });
        }
        res.status(200).json({ message: 'Profil mis à jour avec succès' });
      });
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.get('/private-messages/:senderId/:receiverId', (req, res) => {
  const { senderId, receiverId } = req.params;
  const blockQuery = `
    SELECT * FROM blocked_users 
    WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)
  `;
  db.query(blockQuery, [senderId, receiverId, receiverId, senderId], (err, blockResults) => {
    if (err) {
      console.error('Erreur lors de la vérification des blocages:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (blockResults.length > 0) {
      return res.status(403).json({ message: 'Conversation bloquée entre ces utilisateurs' });
    }
    const selectQuery = `
      SELECT pm.*, u1.prenom AS sender_prenom, u1.nom AS sender_nom, u1.profile_pic AS sender_profile_pic,
             u2.prenom AS receiver_prenom, u2.nom AS receiver_nom, u2.profile_pic AS receiver_profile_pic
      FROM private_messages pm
      JOIN users u1 ON pm.sender_id = u1.id
      JOIN users u2 ON pm.receiver_id = u2.id
      WHERE ((pm.sender_id = ? AND pm.receiver_id = ?) OR (pm.sender_id = ? AND pm.receiver_id = ?))
            AND pm.is_archived = 0
      ORDER BY pm.created_at ASC
    `;
    db.query(selectQuery, [senderId, receiverId, receiverId, senderId], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération des messages:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      const messages = results.map(msg => ({
        user: {
          id: msg.sender_id,
          prenom: msg.sender_prenom,
          nom: msg.sender_nom,
          profile_pic: msg.sender_profile_pic ? `http://localhost:400${msg.sender_profile_pic}` : null,
        },
        receiver: {
          id: msg.receiver_id,
          prenom: msg.receiver_prenom,
          nom: msg.receiver_nom,
          profile_pic: msg.receiver_profile_pic ? `http://localhost:400${msg.receiver_profile_pic}` : null,
        },
        content: msg.content,
        is_sticker: msg.is_sticker,
        created_at: msg.created_at,
      }));
      res.status(200).json(messages);
    });
  });
});

app.post('/private-messages', (req, res) => {
    const { sender_id, receiver_id, content, is_sticker = false } = req.body;
    const blockQuery = `
        SELECT * FROM blocked_users 
        WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)
    `;
    db.query(blockQuery, [sender_id, receiver_id, receiver_id, sender_id], (err, blockResults) => {
        if (err) {
            console.error('Erreur lors de la vérification des blocages:', err);
            return res.status(500).json({ message: 'Erreur serveur', error: err.message });
        }
        if (blockResults.length > 0) {
            return res.status(403).json({ message: 'Vous ne pouvez pas envoyer de message à cet utilisateur' });
        }
        const insertQuery = `
            INSERT INTO private_messages (sender_id, receiver_id, content, is_sticker, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;
        db.query(insertQuery, [sender_id, receiver_id, content, is_sticker], (err, result) => {
            if (err) {
                console.error('Erreur lors de l\'enregistrement du message:', err);
                return res.status(500).json({ message: 'Erreur serveur', error: err.message });
            }
            const userQuery = 'SELECT id, prenom, nom, profile_pic FROM users WHERE id IN (?, ?)';
            db.query(userQuery, [sender_id, receiver_id], (err, users) => {
                if (err) {
                    console.error('Erreur lors de la récupération des utilisateurs:', err);
                    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
                }
                const sender = users.find(u => u.id === parseInt(sender_id));
                const receiver = users.find(u => u.id === parseInt(receiver_id));
                const messageData = {
                    user: {
                        id: sender.id,
                        prenom: sender.prenom,
                        nom: sender.nom,
                        profile_pic: sender.profile_pic ? `http://localhost:400${sender.profile_pic}` : null,
                    },
                    receiver: {
                        id: receiver.id,
                        prenom: receiver.prenom,
                        nom: receiver.nom,
                        profile_pic: receiver.profile_pic ? `http://localhost:400${receiver.profile_pic}` : null,
                    },
                    content,
                    is_sticker,
                    created_at: new Date(),
                };
                io.to(`user:${receiver_id}`).emit('private message', messageData);
                io.to(`user:${sender_id}`).emit('private message', messageData);
                res.status(201).json({ message: 'Message envoyé avec succès', messageId: result.insertId });
            });
        });
    });
});

app.delete('/private-messages/:senderId/:receiverId', (req, res) => {
  const { senderId, receiverId } = req.params;
  const deleteQuery = `
    DELETE FROM private_messages 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
  `;
  db.query(deleteQuery, [senderId, receiverId, receiverId, senderId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression des messages:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    io.to(`user:${senderId}`).emit('conversation deleted', { senderId, receiverId });
    io.to(`user:${receiverId}`).emit('conversation deleted', { senderId, receiverId });
    res.status(200).json({ message: 'Conversation supprimée avec succès' });
  });
});

app.get('/private-messages/archived/:userId', (req, res) => {
  const userId = req.params.userId;
  const selectQuery = `
    SELECT DISTINCT 
      LEAST(pm.sender_id, pm.receiver_id) AS user1_id,
      GREATEST(pm.sender_id, pm.receiver_id) AS user2_id,
      u1.prenom AS user1_prenom, u1.nom AS user1_nom, u1.profile_pic AS user1_profile_pic,
      u2.prenom AS u2_prenom, u2.nom AS u2_nom, u2.profile_pic AS u2_profile_pic
    FROM private_messages pm
    JOIN users u1 ON u1.id = LEAST(pm.sender_id, pm.receiver_id)
    JOIN users u2 ON u2.id = GREATEST(pm.sender_id, pm.receiver_id)
    WHERE pm.is_archived = 1 AND (pm.sender_id = ? OR pm.receiver_id = ?)
  `;
  db.query(selectQuery, [userId, userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des conversations archivées:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    const conversations = results.map(row => ({
      userId: row.user1_id === parseInt(userId) ? row.user2_id : row.user1_id,
      userName:
        row.user1_id === parseInt(userId)
          ? `${row.u2_prenom} ${row.u2_nom}`
          : `${row.user1_prenom} ${row.user1_nom}`,
      profile_pic:
        row.user1_id === parseInt(userId)
          ? row.u2_profile_pic
            ? `http://localhost:400${row.u2_profile_pic}`
            : null
          : row.user1_profile_pic
          ? `http://localhost:400${row.user1_profile_pic}`
          : null,
    }));
    res.status(200).json(conversations);
  });
});

app.post('/private-messages/archive/:senderId/:receiverId', (req, res) => {
  const { senderId, receiverId } = req.params;
  const { is_archived = true } = req.body;
  const updateQuery = `
    UPDATE private_messages 
    SET is_archived = ? 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
  `;
  db.query(updateQuery, [is_archived ? 1 : 0, senderId, receiverId, receiverId, senderId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de la conversation:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    const message = is_archived ? 'Conversation archivée avec succès' : 'Conversation restaurée avec succès';
    io.emit('archive conversation', { senderId, receiverId, is_archived });
    res.status(200).json({ message });
  });
});

app.get('/private-messages/archived/messages/:senderId/:receiverId', (req, res) => {
  const { senderId, receiverId } = req.params;
  const selectQuery = `
    SELECT pm.*, u1.prenom AS sender_prenom, u1.nom AS sender_nom, u1.profile_pic AS sender_profile_pic,
           u2.prenom AS receiver_prenom, u2.nom AS receiver_nom, u2.profile_pic AS receiver_profile_pic
    FROM private_messages pm
    JOIN users u1 ON pm.sender_id = u1.id
    JOIN users u2 ON pm.receiver_id = u2.id
    WHERE pm.is_archived = 1 AND 
          ((pm.sender_id = ? AND pm.receiver_id = ?) OR (pm.sender_id = ? AND pm.receiver_id = ?))
    ORDER BY pm.created_at ASC
  `;
  db.query(selectQuery, [senderId, receiverId, receiverId, senderId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des messages archivés:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    const messages = results.map(msg => ({
      user: {
        id: msg.sender_id,
        prenom: msg.sender_prenom,
        nom: msg.sender_nom,
        profile_pic: msg.sender_profile_pic ? `http://localhost:400${msg.sender_profile_pic}` : null,
      },
      receiver: {
        id: msg.receiver_id,
        prenom: msg.receiver_prenom,
        nom: msg.receiver_nom,
        profile_pic: msg.receiver_profile_pic ? `http://localhost:400${msg.receiver_profile_pic}` : null,
      },
      content: msg.content,
      created_at: msg.created_at,
    }));
    res.status(200).json(messages);
  });
});

app.get('/rooms', (req, res) => {
  const query = 'SELECT r.*, u.prenom AS creator_prenom, u.nom AS creator_nom FROM rooms r JOIN users u ON r.user_id = u.id WHERE r.is_archived = 0';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des salles:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    res.json(
      results.map(room => ({
        ...room,
        creatorName: `${room.creator_prenom} ${room.creator_nom}`,
      }))
    );
  });
});

app.get('/rooms/archived/:userId', (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT r.*, u.prenom AS creator_prenom, u.nom AS creator_nom
    FROM rooms r
    JOIN users u ON r.user_id = u.id
    JOIN room_members rm ON r.id = rm.room_id
    WHERE r.is_archived = 1 AND rm.user_id = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des salles archivées:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    res.json(
      results.map(room => ({
        ...room,
        creatorName: `${room.creator_prenom} ${room.creator_nom}`,
      }))
    );
  });
});

app.post('/rooms', (req, res) => {
  const { name, description, user_id } = req.body;
  const query = 'INSERT INTO rooms (name, description, user_id, created_at) VALUES (?, ?, ?, NOW())';
  db.query(query, [name, description, user_id], (err, result) => {
    if (err) {
      console.error('Erreur lors de la création de la salle:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    const roomId = result.insertId;
    const memberQuery = 'INSERT INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, NOW())';
    db.query(memberQuery, [roomId, user_id], (err) => {
      if (err) {
        console.error('Erreur lors de l\'adhésion du créateur:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      io.emit('room created', { id: roomId, name, description, user_id, creatorName: '' });
      res.status(201).json({ message: 'Salle créée avec succès', roomId });
    });
  });
});

app.delete('/rooms/:roomId/:userId', (req, res) => {
  const { roomId, userId } = req.params;
  const checkQuery = 'SELECT user_id FROM rooms WHERE id = ?';
  db.query(checkQuery, [roomId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de la salle:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    if (results[0].user_id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Seul le créateur peut supprimer cette salle' });
    }
    const deleteQuery = 'DELETE FROM rooms WHERE id = ?';
    db.query(deleteQuery, [roomId], (err, result) => {
      if (err) {
        console.error('Erreur lors de la suppression de la salle:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      io.emit('room delete', { roomId });
      res.status(200).json({ message: 'Salle supprimée avec succès' });
    });
  });
});

app.post('/rooms/archive/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { is_archived = true } = req.body;
  const query = 'SELECT * FROM rooms WHERE id = ?';
  db.query(query, [roomId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de la salle:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    const updateQuery = 'UPDATE rooms SET is_archived = ? WHERE id = ?';
    db.query(updateQuery, [is_archived ? 1 : 0, roomId], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'archivage de la salle:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      const message = is_archived ? 'Salle archivée avec succès' : 'Salle restaurée avec succès';
      io.emit('room archive', { roomId, is_archived });
      res.status(200).json({ message });
    });
  });
});

app.get('/room-members/:roomId', (req, res) => {
  const { roomId } = req.params;
  const query = `
    SELECT u.id, u.prenom, u.nom, u.profile_pic
    FROM room_members rm
    JOIN users u ON rm.user_id = u.id
    WHERE rm.room_id = ?
  `;
  db.query(query, [roomId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des membres:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    res.json(
      results.map(user => ({
        ...user,
        profile_pic: user.profile_pic ? `http://localhost:400${user.profile_pic}` : null,
      }))
    );
  });
});

app.post('/rooms/join/:roomId/:userId', (req, res) => {
  const { roomId, userId } = req.params;
  const query = 'SELECT * FROM rooms WHERE id = ?';
  db.query(query, [roomId], (err, rooms) => {
    if (err) {
      console.error('Erreur lors de la vérification de la salle:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    const memberQuery = 'INSERT INTO room_members (room_id, user_id, joined_at) VALUES (?, ?, NOW())';
    db.query(memberQuery, [roomId, userId], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Vous êtes déjà membre de cette salle' });
        }
        console.error('Erreur lors de l\'adhésion à la salle:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      io.to(`room:${roomId}`).emit('room membership update', { userId, roomId, joined: true });
      res.status(201).json({ message: 'Vous avez rejoint la salle avec succès' });
    });
  });
});

app.delete('/rooms/leave/:roomId/:userId', (req, res) => {
  const { roomId, userId } = req.params;
  const query = 'DELETE FROM room_members WHERE room_id = ? AND user_id = ?';
  db.query(query, [roomId, userId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la sortie de la salle:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vous n\'êtes pas membre de cette salle' });
    }
    io.to(`room:${roomId}`).emit('room membership update', { userId, roomId, joined: false });
    res.status(200).json({ message: 'Vous avez quitté la salle avec succès' });
  });
});

app.get('/room-membership/:userId/:roomId', (req, res) => {
  const { userId, roomId } = req.params;
  const query = 'SELECT * FROM room_members WHERE user_id = ? AND room_id = ?';
  db.query(query, [userId, roomId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'adhésion:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    res.json(results.length > 0);
  });
});

app.get('/room-messages/:roomId', (req, res) => {
  const { roomId } = req.params;
  const query = `
    SELECT m.*, u.id AS user_id, u.prenom, u.nom, u.profile_pic
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.room_id = ?
    ORDER BY m.created_at ASC
  `;
  db.query(query, [roomId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des messages:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    res.json(
      results.map(msg => ({
        user: {
          id: msg.user_id,
          prenom: msg.prenom,
          nom: msg.nom,
          profile_pic: msg.profile_pic ? `http://localhost:400${msg.profile_pic}` : null,
        },
        content: msg.content,
        is_sticker: msg.is_sticker,
        created_at: msg.created_at,
        roomId: msg.room_id,
      }))
    );
  });
});

app.post('/messages', (req, res) => {
  const { user_id, room_id, content, is_sticker = false } = req.body;
  const query = 'INSERT INTO messages (user_id, room_id, content, is_sticker, created_at) VALUES (?, ?, ?, ?, NOW())';
  db.query(query, [user_id, room_id, content, is_sticker], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'enregistrement du message:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    const userQuery = 'SELECT id, prenom, nom, profile_pic FROM users WHERE id = ?';
    db.query(userQuery, [user_id], (err, users) => {
      if (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      const user = users[0];
      const messageData = {
        user: {
          id: user.id,
          prenom: user.prenom,
          nom: user.nom,
          profile_pic: user.profile_pic ? `http://localhost:400${user.profile_pic}` : null,
        },
        roomId: room_id,
        content,
        is_sticker,
        created_at: new Date(),
      };
      io.to(`room:${room_id}`).emit('room message', messageData);
      res.status(201).json({ message: 'Message envoyé avec succès' });
    });
  });
});

app.post('/rooms/report/:roomId/:userId', (req, res) => {
  console.log('Using updated /rooms/report endpoint at', new Date());
  const { userId, roomId } = req.params;
  const { reason } = req.body;

  // Validate inputs
  if (!reason || reason.trim() === '') {
    console.error('Reason missing or empty:', reason);
    return res.status(400).json({ message: 'La raison du signalement est requise.' });
  }

  const userIdInt = parseInt(userId, 10);
  const roomIdInt = parseInt(roomId, 10);
  if (isNaN(userIdInt) || isNaN(roomIdInt)) {
    console.error('Invalid userId or roomId:', { userId, roomId });
    return res.status(400).json({ message: 'userId ou roomId invalide.' });
  }

  // Check user existence
  const userQuery = 'SELECT id FROM users WHERE id = ?';
  console.log('Executing userQuery:', userQuery, 'with userId:', userIdInt);
  db.query(userQuery, [userIdInt], (err, userResults) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (!userResults.length) {
      console.error('Utilisateur non trouvé:', userIdInt);
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Check room existence
    const roomQuery = 'SELECT id FROM rooms WHERE id = ?';
    console.log('Executing roomQuery:', roomQuery, 'with roomId:', roomIdInt);
    db.query(roomQuery, [roomIdInt], (err, roomResults) => {
      if (err) {
        console.error('Erreur lors de la vérification de la salle:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      if (!roomResults.length) {
        console.error('Salle non trouvée:', roomIdInt);
        return res.status(404).json({ message: 'Salle non trouvée.' });
      }

      // Check for duplicate report
      const checkReportQuery = 'SELECT id FROM reported_rooms WHERE user_id = ? AND room_id = ?';
      console.log('Executing checkReportQuery:', checkReportQuery, 'with params:', [userIdInt, roomIdInt]);
      db.query(checkReportQuery, [userIdInt, roomIdInt], (err, reportResults) => {
        if (err) {
          console.error('Erreur lors de la vérification du signalement existant:', err);
          return res.status(500).json({ message: 'Erreur serveur', error: err.message });
        }
        if (reportResults.length > 0) {
          console.log('Signalement déjà existant pour userId:', userIdInt, 'roomId:', roomIdInt);
          return res.status(400).json({ message: 'Vous avez déjà signalé cette salle.' });
        }

        // Insert the report
        const insertQuery = 'INSERT INTO reported_rooms (user_id, room_id, reason, created_at) VALUES (?, ?, ?, NOW())';
        console.log('Executing insertQuery:', insertQuery, 'with params:', [userIdInt, roomIdInt, reason]);
        db.query(insertQuery, [userIdInt, roomIdInt, reason], (err, result) => {
          if (err) {
            console.error('Erreur lors du signalement de la salle:', err);
            return res.status(500).json({ message: 'Erreur serveur', error: err.message });
          }
          console.log('Salle signalée avec succès:', { userId: userIdInt, roomId: roomIdInt, reason });
          res.status(200).json({ message: 'Salle signalée avec succès' });
        });
      });
    });
  });
});
app.get('/blocked-users/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT blocked_user_id FROM blocked_users WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des utilisateurs bloqués:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    res.json(results);
  });
});

app.post('/block-user/:userId/:blockedUserId', (req, res) => {
  const { userId, blockedUserId } = req.params;
  if (userId === blockedUserId) {
    return res.status(400).json({ message: 'Vous ne pouvez pas vous bloquer vous-même' });
  }
  const userCheckQuery = 'SELECT id FROM users WHERE id IN (?, ?)';
  db.query(userCheckQuery, [userId, blockedUserId], (err, users) => {
    if (err) {
      console.error('Erreur lors de la vérification des utilisateurs:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (users.length !== 2) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const insertQuery = `
      INSERT INTO blocked_users (user_id, blocked_user_id, created_at)
      VALUES (?, ?, NOW())
    `;
    db.query(insertQuery, [userId, blockedUserId], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Cet utilisateur est déjà bloqué' });
        }
        console.error('Erreur lors du blocage de l\'utilisateur:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      io.emit('user blocked', { userId, blockedUserId });
      res.status(200).json({ message: 'Utilisateur bloqué avec succès' });
    });
  });
});

app.post('/unblock-user/:userId/:blockedUserId', (req, res) => {
  const { userId, blockedUserId } = req.params;
  if (userId === blockedUserId) {
    return res.status(400).json({ message: 'Vous ne pouvez pas vous débloquer vous-même' });
  }
  const deleteQuery = 'DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?';
  db.query(deleteQuery, [userId, blockedUserId], (err, result) => {
    if (err) {
      console.error('Erreur lors du déblocage de l\'utilisateur:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Blocage non trouvé' });
    }
    io.emit('user unblocked', { userId, blockedUserId });
    res.status(200).json({ message: 'Utilisateur débloqué avec succès' });
  });
});

app.post('/report-user/:userId/:reportedUserId', (req, res) => {
  const { userId, reportedUserId } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ message: 'La raison du signalement est requise.' });
  }

  const checkQuery = 'SELECT id FROM users WHERE id IN (?, ?)';
  db.query(checkQuery, [userId, reportedUserId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification des utilisateurs:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    if (results.length !== 2) {
      return res.status(404).json({ message: 'Utilisateur ou utilisateur signalé non trouvé.' });
    }

    const insertQuery = 'INSERT INTO reported_users (user_id, reported_user_id, reason, created_at) VALUES (?, ?, ?, NOW())';
    db.query(insertQuery, [userId, reportedUserId, reason], (err, result) => {
      if (err) {
        console.error('Erreur lors du signalement de l\'utilisateur:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      res.status(200).json({ message: 'Utilisateur signalé avec succès' });
    });
  });
});

app.get('/stickers', (req, res) => {
  const query = 'SELECT id, name, image_url FROM stickers';
  db.query(query, [], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des stickers:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
    res.json(
      results.map(sticker => ({
        ...sticker,
        image_url: `http://localhost:400${sticker.image_url}`,
      }))
    );
  });
});

io.on('connection', socket => {
  console.log('Nouvelle connexion Socket.IO:', socket.id);

  socket.on('register user', user => {
    socket.user = user;
    socket.join(`user:${user.id}`);
    console.log(`Utilisateur ${user.id} enregistré et rejoint la room user:${user.id}`);
    io.emit('connected users', [user.id]);
  });

  socket.on('private message', ({ senderId, receiverId, content, is_sticker = false }) => {
    const blockQuery = `
      SELECT * FROM blocked_users 
      WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)
    `;
    db.query(blockQuery, [senderId, receiverId, receiverId, senderId], (err, blockResults) => {
      if (err) {
        console.error('Erreur lors de la vérification des blocages:', err);
        socket.emit('error', { message: 'Erreur serveur lors de la vérification des blocages' });
        return;
      }
      if (blockResults.length > 0) {
        socket.emit('error', { message: 'Vous ne pouvez pas envoyer de message à cet utilisateur' });
        return;
      }
      const insertQuery = `
        INSERT INTO private_messages (sender_id, receiver_id, content, is_sticker, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      db.query(insertQuery, [senderId, receiverId, content, is_sticker], (err, result) => {
        if (err) {
          console.error('Erreur lors de l\'enregistrement du message:', err);
          socket.emit('error', { message: 'Erreur serveur lors de l\'enregistrement du message' });
          return;
        }
        const userQuery = 'SELECT id, prenom, nom, profile_pic FROM users WHERE id IN (?, ?)';
        db.query(userQuery, [senderId, receiverId], (err, users) => {
          if (err) {
            console.error('Erreur lors de la récupération des utilisateurs:', err);
            socket.emit('error', { message: 'Erreur serveur lors de la récupération des utilisateurs' });
            return;
          }
          const sender = users.find(u => u.id === parseInt(senderId));
          const receiver = users.find(u => u.id === parseInt(receiverId));
          const messageData = {
            user: {
              id: sender.id,
              prenom: sender.prenom,
              nom: sender.nom,
              profile_pic: sender.profile_pic ? `http://localhost:400${sender.profile_pic}` : null,
            },
            receiver: {
              id: receiver.id,
              prenom: receiver.prenom,
              nom: receiver.nom,
              profile_pic: receiver.profile_pic ? `http://localhost:400${receiver.profile_pic}` : null,
            },
            content,
            is_sticker,
            created_at: new Date(),
          };
          io.to(`user:${receiverId}`).emit('private message', messageData);
          io.to(`user:${senderId}`).emit('private message', messageData);
        });
      });
    });
  });

  socket.on('room message', ({ user, room_id, content, is_sticker = false }) => {
    const memberQuery = 'SELECT * FROM room_members WHERE user_id = ? AND room_id = ?';
    db.query(memberQuery, [user.id, room_id], (err, results) => {
      if (err) {
        console.error('Erreur lors de la vérification de l\'adhésion:', err);
        socket.emit('error', { message: 'Erreur serveur lors de la vérification de votre adhésion' });
        return;
      }
      if (results.length === 0) {
        socket.emit('error', { message: 'Vous devez rejoindre la salle pour envoyer des messages' });
        return;
      }
      const insertQuery = 'INSERT INTO messages (user_id, room_id, content, is_sticker, created_at) VALUES (?, ?, ?, ?, NOW())';
      db.query(insertQuery, [user.id, room_id, content, is_sticker], (err, result) => {
        if (err) {
          console.error('Erreur lors de l\'enregistrement du message de salle:', err);
          socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
          return;
        }
        const messageData = {
          user: {
            id: user.id,
            prenom: user.prenom,
            nom: user.nom,
            profile_pic: user.profile_pic ? `http://localhost:400${user.profile_pic}` : null,
          },
          roomId: room_id,
          content,
          is_sticker,
          created_at: new Date(),
        };
        io.to(`room:${room_id}`).emit('room message', messageData);
      });
    });
  });

  socket.on('join room', ({ user_id, room_id }) => {
    socket.join(`room:${room_id}`);
    console.log(`Utilisateur ${user_id} a rejoint la salle room:${room_id}`);
  });

  socket.on('leave room', ({ user_id, room_id }) => {
    socket.leave(`room:${room_id}`);
    console.log(`Utilisateur ${user_id} a quitté la salle room:${room_id}`);
  });

  socket.on('disconnect', () => {
    console.log('Déconnexion Socket.IO:', socket.id);
    if (socket.user) {
      io.emit('connected users', [socket.user.id]);
    }
  });
});

const PORT = 400;
server.listen(PORT, () => {
  console.log(`✅ Serveur Node.js avec Socket.IO lancé sur http://localhost:${PORT}`);
});