var mysql = require('mysql2')
const config = require('./config.json');

let connection = mysql.createConnection({
  host: config.host || 'localhost',
  port: 3306,
  user: config.username,
  password: config.password,
  database: config.database,
});

connection.connect((err) => {
  if (err) return console.error(err.message);

  let sql = `SELECT * FROM Lore LIMIT 100`;

  connection.query(sql, [true], (error, results, fields) => {
    if (error) return console.error(error.message);
    console.log(results);
  });

  // close the database connection
  connection.end();
});
