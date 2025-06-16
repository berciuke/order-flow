const express = require('express');
const { callResourceAPI } = require('../utils');
const router = express.Router();

router.get('/dashboard', async (req, res) => {
  if (!req.session.user?.realm_access?.roles?.includes('coach')) {
    return res.status(403).send('<h1>Access Denied - Coach role required</h1>');
  }

  try {
    const coachData = await callResourceAPI('/api/coach-panel', req.session.access_token);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Coach Dashboard</title>
        <style>
          body { font-family: Arial; margin: 40px; }
          .card { border: 1px solid #ddd; padding: 20px; margin: 10px 0; }
          .stats { display: flex; gap: 20px; }
          .stat { text-align: center; padding: 10px; background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>Coach Dashboard - ${req.session.user.preferred_username}</h1>
        
        <div class="stats">
          <div class="stat">
            <h3>${coachData.stats.total_athletes}</h3>
            <p>Total Athletes</p>
          </div>
          <div class="stat">
            <h3>${coachData.stats.active_programs}</h3>
            <p>Active Programs</p>
          </div>
          <div class="stat">
            <h3>${coachData.stats.avg_completion}</h3>
            <p>Avg Completion</p>
          </div>
        </div>

        <div class="card">
          <h2>My Athletes</h2>
          ${coachData.athletes.map(athlete => `
            <div class="card">
              <h3>${athlete.name}</h3>
              <p>Level: ${athlete.level}</p>
              <p>Workouts Completed: ${athlete.workouts_completed}</p>
            </div>
          `).join('')}
        </div>

        <p><a href="/">← Back to Home</a></p>
      </body>
      </html>
    `);
  } catch (error) {
    res.send(`<h1>Error loading coach data: ${error.message}</h1>`);
  }
});

router.post('/create-plan', async (req, res) => {
  res.json({
    success: true,
    message: "Workout plan created successfully",
    plan_id: Math.floor(Math.random() * 1000)
  });
});

module.exports = router; 