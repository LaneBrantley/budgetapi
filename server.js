const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const port = process.env.port || 3000;
const app = express();
app.use(express.json());

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
    const { username, password } = req.query; //Did this so that it can be done through url params
    if (!username || !password) {
        res.status(400).json({ error: 'Both username and password are required' });
        return;
    }    
    const pwd = await encryptPassword(password); 
    const date = transformDate(new Date());
    connection.connect();
    console.log(pwd);
    console.log(username);
    connection.query('INSERT INTO User (username, password, date) VALUES (?, ?, ?)', [username, pwd, date], function (error, results, fields) {
        connection.end();
        if (error) throw error;
        res.json(results);
    });
});

app.get('/budget', async (req, res) => {
    connection.connect();

    connection.query('SELECT * FROM Budget', function (error, results, fields) {
        connection.end();
        if (error) throw error;
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server on port ${port}`)
});