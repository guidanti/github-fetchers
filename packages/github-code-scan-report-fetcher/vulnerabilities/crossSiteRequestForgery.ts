import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/update-email', (req, res) => {
  const { email } = req.body;
  // Vulnerable to CSRF
  // Assume user authentication is handled elsewhere
  updateUserEmail(req.user.id, email);
  res.send('Email updated');
});

function updateUserEmail(userId: string, email: string) {
  // Update user's email in the database
}
