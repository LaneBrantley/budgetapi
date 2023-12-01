const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcrypt-nodejs');
const saltRounds = 10;

const port = process.env.port || 3000;
const app = express();
app.use(express.json());
app.use(cors());

var connection = mysql.createConnection({
    host : 'sql5.freemysqlhosting.net',
    user : 'sql5666250',
    password : 'aHixxtJFHM',
    database : 'sql5666250'
});

async function encryptPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

function transformDate(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

app.post('/signup', async (req, res) => {
    const { username, password } = req.body; 
    if (!username || !password) {
        res.status(400).json({ error: 'Both username and password are required' });
        return;
    }    
    const hashedPassword = await encryptPassword(password); 
    const date = transformDate(new Date());
    connection.connect();
    connection.query('INSERT INTO User (username, password, date) VALUES (?, ?, ?)', [username, hashedPassword, date], function (error, results, fields) {
        connection.end();
        if (error) throw error;
        res.json(results);
    });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
      res.status(400).json({ error: 'Both username and password are required' });
      return;
  }   

  try {
      const hashedPassword = await encryptPassword(password);
      connection.connect();

      connection.query(
          'SELECT * FROM User WHERE username = ? and password = ?',
          [username, hashedPassword],
          function (error, results, fields) {
              connection.end();
              if (error) {
                  console.log(error);
                  res.status(500).json({ error: 'Internal Server Error' });
                  return;
              }

              if (results.length > 0) {
                  res.json({ success: 'Login successful' });
              } else {
                  res.status(401).json({ error: 'Invalid username or password' });
              }
          }
      );
  } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/budget', async (req, res) => {
    connection.connect();

    connection.query('SELECT * FROM Budget', function (error, results, fields) {
        connection.end();
        if (error) throw error;
        res.json(results);
    });
});

app.get('/', async (req, res) => {
  connection.connect();

  console.log("Received");
});

app.listen(port, () => {
    console.log(`Server on port ${port}`)
});