import express from 'express';

const app = express();

app.get('/greet', (req, res) => {
  const name = req.query.name;
  // Vulnerable to XSS
  res.send(`Hello, ${name}`);
});
