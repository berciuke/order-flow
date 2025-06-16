const express = require('express');
const { verifyToken, requireRole } = require('../auth');
const router = express.Router();

const exercises = [
  { id: 1, name: "Pompki", muscle_group: "chest", difficulty: "beginner", calories: 8 },
  { id: 2, name: "Przysiady", muscle_group: "legs", difficulty: "beginner", calories: 12 },
  { id: 3, name: "Martwy ciąg", muscle_group: "back", difficulty: "advanced", calories: 15 },
  { id: 4, name: "Burpees", muscle_group: "full body", difficulty: "intermediate", calories: 20 }
];

const workouts = [
  { id: 1, name: "Trening całego ciała dla początkujących", duration: 30, exercises: ["Pompki", "Przysiady"], level: "beginner" },
  { id: 2, name: "HIIT – intensywny trening cardio", duration: 20, exercises: ["Burpees", "Wspinaczka górska"], level: "intermediate" },
  { id: 3, name: "Sesja powerliftingu", duration: 60, exercises: ["Martwy ciąg", "Wyciskanie sztangi na ławce"], level: "advanced" }
];

router.get('/exercises', (req, res) => {
  res.json(exercises);
});

router.get('/workouts', verifyToken, (req, res) => {
  res.json({
    user: req.user.username,
    workouts: workouts.filter(w => 
      req.user.roles.includes('admin') || 
      w.level === 'beginner' || 
      req.user.roles.includes('coach')
    )
  });
});

router.get('/coach-panel', verifyToken, requireRole('coach'), (req, res) => {
  res.json({
    message: "Panel Trenera",
    athletes: [
      { id: 1, name: "Jan Kowalski", level: "beginner", workouts_completed: 12 },
      { id: 2, name: "Anna Nowak", level: "intermediate", workouts_completed: 25 }
    ],
    stats: {
      total_athletes: 15,
      active_programs: 8,
      avg_completion: "78%"
    }
  });
});

router.get('/admin', verifyToken, requireRole('admin'), (req, res) => {
  res.json({
    message: "Panel Administratora",
    platform_stats: {
      total_users: 1250,
      coaches: 45,
      active_workouts: 320,
      revenue: "$15,240"
    },
    recent_activity: [
      "New user registration: athlete@example.com",
      "Workout completed: HIIT – intensywny trening cardio",
      "Coach certification: coach@example.com"
    ]
  });
});

module.exports = router; 