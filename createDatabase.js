// createDatabase.js
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS
});

connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`, (err, results) => {
  if (err) {
    console.error('Erro ao criar o banco de dados:', err);
    return;
  }
  console.log('Banco de dados criado ou já existe.');

  connection.changeUser({database: process.env.DB_NAME}, (err) => {
    if (err) {
      console.error('Erro ao selecionar o banco de dados:', err);
      return;
    }
    console.log('Banco de dados selecionado.');

    connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        sobrenome VARCHAR(255) NOT NULL,
        cpf VARCHAR(11) NOT NULL UNIQUE,
        usuario VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL
      );
    `, (err, results) => {
      if (err) {
        console.error('Erro ao criar a tabela:', err);
        return;
      }
      console.log('Tabela de usuários criada com sucesso.');
      connection.end();
    });
  });
});
