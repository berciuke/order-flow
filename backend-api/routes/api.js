const express = require('express');
const axios = require('axios');
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



async function getAdminToken() {
  try {
    const tokenResponse = await axios.post(
      `${process.env.KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli',
        username: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
        password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('Failed to get admin token:', error.response?.data || error.message);
    throw new Error('Admin token retrieval failed');
  }
}

router.get('/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const adminToken = await getAdminToken();
    
    const usersResponse = await axios.get(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json' 
        },
        params: {
          first: req.query.first || 0,
          max: req.query.max || 100
        }
      }
    );

    const usersWithRoles = await Promise.all(
      usersResponse.data.map(async (user) => {
        try {
          const roleMappingsResponse = await axios.get(
            `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${user.id}/role-mappings/realm`,
            {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            }
          );
          
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            enabled: user.enabled,
            emailVerified: user.emailVerified,
            created: new Date(user.createdTimestamp).toISOString().split('T')[0],
            roles: roleMappingsResponse.data.map(role => role.name)
          };
        } catch (roleError) {
          console.error(`Failed to get roles for user ${user.id}:`, roleError.message);
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            enabled: user.enabled,
            emailVerified: user.emailVerified,
            created: new Date(user.createdTimestamp).toISOString().split('T')[0],
            roles: []
          };
        }
      })
    );

    res.json({
      success: true,
      users: usersWithRoles,
      total: usersWithRoles.length,
      message: 'Lista użytkowników z Keycloak'
    });

  } catch (error) {
    console.error('Failed to get users from Keycloak:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Błąd pobierania użytkowników z Keycloak',
      details: error.response?.data || error.message
    });
  }
});

router.get('/admin/roles', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const adminToken = await getAdminToken();
    
    const rolesResponse = await axios.get(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles`,
      {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json' 
        }
      }
    );

    const rolesWithUserCount = await Promise.all(
      rolesResponse.data.map(async (role) => {
        try {
          const usersResponse = await axios.get(
            `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles/${role.name}/users`,
            {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            }
          );
          
          return {
            name: role.name,
            description: role.description || `Rola ${role.name}`,
            users: usersResponse.data.length
          };
        } catch (userCountError) {
          console.error(`Failed to count users for role ${role.name}:`, userCountError.message);
          return {
            name: role.name,
            description: role.description || `Rola ${role.name}`,
            users: 0
          };
        }
      })
    );

    res.json({
      success: true,
      roles: rolesWithUserCount,
      total: rolesWithUserCount.length,
      message: 'Lista ról z Keycloak'
    });

  } catch (error) {
    console.error('Failed to get roles from Keycloak:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Błąd pobierania ról z Keycloak',
      details: error.response?.data || error.message
    });
  }
});

router.post('/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, roles = ['user'] } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Wymagane pola: username, email, password'
      });
    }

    const adminToken = await getAdminToken();
    
    const userData = {
      username,
      email,
      enabled: true,
      emailVerified: true,
      credentials: [{
        type: "password",
        value: password,
        temporary: false
      }]
    };

    const createResponse = await axios.post(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      userData,
      {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json' 
        }
      }
    );

    const locationHeader = createResponse.headers.location;
    const userId = locationHeader ? locationHeader.split('/').pop() : null;

    if (roles.length > 0 && userId) {
      try {
        const rolesResponse = await axios.get(
          `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles`,
          {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          }
        );

        const availableRoles = rolesResponse.data;
        const rolesToAssign = availableRoles.filter(role => roles.includes(role.name));

        if (rolesToAssign.length > 0) {
          await axios.post(
            `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
            rolesToAssign,
            {
              headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json' 
              }
            }
          );
        }
      } catch (roleError) {
        console.error('Role assignment failed:', roleError.response?.data);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Użytkownik utworzony w Keycloak',
      userId: userId,
      username: username,
      email: email,
      roles: roles
    });

  } catch (error) {
    console.error('Keycloak user creation error:', error.response?.data || error.message);
    
    if (error.response?.status === 409) {
      return res.status(409).json({
        success: false,
        error: 'Użytkownik już istnieje'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Błąd tworzenia użytkownika',
      details: error.response?.data || error.message
    });
  }
});

router.put('/admin/users/:id/roles', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    
    const adminToken = await getAdminToken();
    
    const currentRolesResponse = await axios.get(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${id}/role-mappings/realm`,
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );

    if (currentRolesResponse.data.length > 0) {
      await axios.delete(
        `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${id}/role-mappings/realm`,
        {
          headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          data: currentRolesResponse.data
        }
      );
    }

    if (roles && roles.length > 0) {
      const rolesResponse = await axios.get(
        `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/roles`,
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );

      const availableRoles = rolesResponse.data;
      const rolesToAssign = availableRoles.filter(role => roles.includes(role.name));

      if (rolesToAssign.length > 0) {
        await axios.post(
          `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${id}/role-mappings/realm`,
          rolesToAssign,
          {
            headers: { 
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json' 
            }
          }
        );
      }
    }

    res.json({
      success: true,
      message: 'Role użytkownika zostały zaktualizowane w Keycloak',
      userId: id,
      roles: roles
    });

  } catch (error) {
    console.error('Failed to update user roles in Keycloak:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Błąd aktualizacji ról użytkownika w Keycloak',
      details: error.response?.data || error.message
    });
  }
});

router.put('/admin/users/:id/toggle', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const adminToken = await getAdminToken();
    
    const userResponse = await axios.get(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${id}`,
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );

    const user = userResponse.data;
    const newEnabledState = !user.enabled;

    await axios.put(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${id}`,
      { ...user, enabled: newEnabledState },
      {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json' 
        }
      }
    );

    res.json({
      success: true,
      message: `Użytkownik został ${newEnabledState ? 'aktywowany' : 'deaktywowany'} w Keycloak`,
      userId: id,
      enabled: newEnabledState
    });

  } catch (error) {
    console.error('Failed to toggle user status in Keycloak:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Błąd zmiany stanu użytkownika w Keycloak',
      details: error.response?.data || error.message
    });
  }
});

router.get('/protected', verifyToken, (req, res) => {
  res.json({
    message: "🔒 Protected endpoint accessed successfully!",
    user: {
      id: req.user.sub,
      username: req.user.preferred_username,
      email: req.user.email,
      roles: req.user.realm_access?.roles || []
    },
    timestamp: new Date().toISOString(),
    scope: req.user.scope || "N/A"
  });
});

// Google OAuth2
const externalRoutes = require('./external');
router.use('/external', externalRoutes);

module.exports = router; 