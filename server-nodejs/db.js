const mysql = require('mysql2');

// Crée la connexion à la base de données
const db = mysql.createConnection({
  host: 'localhost',        // ou l'adresse de ton serveur
  user: 'root',             // ton utilisateur MySQL
  password: '',             // ton mot de passe MySQL
  database: 'chat_app'      // le nom de ta base de données
});

// Connexion à la base
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à MySQL :', err.message);
  } else {
    console.log('Connexion à la base de données réussie ✅');
  }
});

module.exports = db;
