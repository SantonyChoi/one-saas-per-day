import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  res.json({
    message: 'User registered successfully',
    user: { id: 1, email, name },
    token: 'dummy-token'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  res.json({
    message: 'Login successful',
    user: { id: 1, email, name: 'Test User' },
    token: 'dummy-token'
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    user: { id: 1, email: 'test@example.com', name: 'Test User' },
    token: 'dummy-token'
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Notes routes
app.get('/api/notes', (req, res) => {
  res.json({
    notes: [
      {
        id: 1,
        title: 'Welcome to Notion Clone',
        content: '# Welcome\n\nThis is a sample note.',
        user_id: 1,
        category: 'General',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
}); 