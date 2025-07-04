const mysql = require('mysql2');

// Crée la connexion à la base de données
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
  port: process.env.DB_PORT || 3306,
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
