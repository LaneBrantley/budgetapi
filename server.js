const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

const port = process.env.port || 3000;
const app = express();
app.use(express.json());
app.use(cors());

//Pool for connections
var pool = mysql.createPool({
    connectionLimit : 10,
    host : 'sql5.freemysqlhosting.net',
    user : 'sql5666250',
    password : 'aHixxtJFHM',
    database : 'sql5666250'
});

//Encrypts passwords
async function encryptPassword(password) {
  return bcrypt.hash(password, salt);
}

//Turns signup date into sql format
function transformDate(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

function checkDuplicateUser(username) {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM User WHERE username = ?', [username], function (error, results, fields) {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        resolve(results.length);
      }
    });
  });
}

//Signup function for users
app.post('/signup', async (req, res) => {
  const { username, password } = req.body; 
  if (!username || !password) {
    res.status(400).json({ error: 'Both username and password are required' });
    return;
  }
  try {
    // Check if the username already sexist
    const count = await checkDuplicateUser(username);
    if (count > 0) {
      res.status(403).json({ error: 'Username is already taken' }); 
      return;
    }
    // If the username is unique, proceed with the insertion
    const hashedPassword = await encryptPassword(password);
    const date = transformDate(new Date());

    const insertUserQuery = 'INSERT INTO User (username, password, date) VALUES (?, ?, ?)';
    pool.query(insertUserQuery, [username, hashedPassword, date]);

    res.json({ success: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Login function
app.post('/login', async (req, res) => {

  const { username, password } = req.body;
  if (!username || !password) { //Needs both username and password
      res.status(400).json({ error: 'Both username and password are required' });
      return;
  }   

  try { //Gets connection and finds user
    pool.getConnection(function(err, connection) {

      if (err) throw err;

      connection.query(
        'SELECT * FROM User WHERE username = ?',
        [username],
        async function (error, results, fields) {
          connection.release();
          if (error) {
            console.log(error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }

          if (results.length > 0) { //If there is a user with username
            const user = results[0];
            const hashedPassword = user.password;
            const isPasswordMatch = await bcrypt.compare(password, hashedPassword);
            if (isPasswordMatch) { //If passwords match
              res.json({ success: 'Login successful' });
            } else { //If password does not match
              res.status(401).json({ error: 'Invalid password' });
          }
        } 
      }
    ); 
  })  
  } catch(err) {
    console.log(err);
  }
});

app.get('/budget', async (req, res) => {

  try {
    pool.getConnection(function(err, connection) {
      if (err) throw err;

      connection.query('SELECT * FROM Budget', function (error, results, fields) {
        connection.release();
          if (error) throw error;
          res.json(results);
      });
    })
  }
  catch(err) {console.log(err)};
});

app.listen(port, () => {
  console.log(`Server on port ${port}`)
});