require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { verifyToken, requireRole, debugToken } = require('./auth');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'FitTrack Workout API' });
});

app.get('/api/data', verifyToken, (req, res) => {
  res.json({ 
    message: 'Dane fitness chronione',
    user: req.user.username,
    roles: req.user.roles 
  });
});

app.get('/api/exercises', (req, res) => {
  res.json([
    { id: 1, name: 'Push-ups', muscle_group: 'chest', difficulty: 'beginner', calories: 5 },
    { id: 2, name: 'Squats', muscle_group: 'legs', difficulty: 'beginner', calories: 8 },
    { id: 3, name: 'Deadlift', muscle_group: 'back', difficulty: 'advanced', calories: 12 },
    { id: 4, name: 'Burpees', muscle_group: 'full-body', difficulty: 'intermediate', calories: 15 }
  ]);
});

app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ 
    message: 'Protected fitness endpoint', 
    user: req.user.username 
  });
});

app.get('/api/coach-panel', verifyToken, requireRole('coach'), (req, res) => {
  res.json({ 
    message: 'Panel Trenera',
    athletes: [
      { id: 1, name: 'Jan Kowalski', level: 'beginner' },
      { id: 2, name: 'Anna Nowak', level: 'intermediate' }
    ]
  });
});

app.get('/api/admin', verifyToken, requireRole('admin'), (req, res) => {
  res.json({ 
    message: 'Panel Administratora FitTrack',
    stats: { total_users: 150, total_workouts: 450 }
  });
});

app.get('/api/workouts', verifyToken, (req, res) => {
  res.json([
    { id: 1, name: 'Morning Cardio', duration: 30, exercises: [1, 2], user: req.user.username },
    { id: 2, name: 'Strength Training', duration: 60, exercises: [2, 3], user: req.user.username }
  ]);
});

app.post('/api/workouts', verifyToken, (req, res) => {
  console.log('New workout plan from:', req.user.username); 
  res.json({ 
    message: 'Workout plan created', 
    workout: req.body,
    user: req.user.username 
  });
});

// testowy endpoint do sprawdzania tokenu
app.get('/api/debug/token', verifyToken, debugToken);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Resource Server na porcie ${PORT}`); 
}); 