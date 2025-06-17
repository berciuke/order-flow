const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const { verifyToken } = require('../auth');
const router = express.Router();

const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID ,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/external/google-callback'
};

console.log('Google OAuth2 Config:', {
  clientId: GOOGLE_CONFIG.clientId.substring(0, 10) + '...',
  redirectUri: GOOGLE_CONFIG.redirectUri
});

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CONFIG.clientId,
  GOOGLE_CONFIG.clientSecret,
  GOOGLE_CONFIG.redirectUri
);

// Zamiast bazy danych/redis
const userTokens = new Map();

router.get('/google-auth', verifyToken, (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    
    const state = req.user.id;
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state
    });
    
    console.log(`Starting Google OAuth for user: ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Redirect to Google for authorization',
      authUrl: authUrl,
      state: state
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Google auth URL',
      details: error.message
    });
  }
});

router.get('/google-callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Google OAuth error:', error);
    return res.redirect(`http://localhost:3000?google_error=${error}`);
  }

  if (!code || !state) {
    return res.redirect('http://localhost:3000?google_error=missing_code_or_state');
  }

  try {   
    const { tokens } = await oauth2Client.getToken(code);
    
    userTokens.set(state, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      userId: state
    });

    console.log(`Google tokens stored for user: ${state}`);

    res.redirect('http://localhost:3000?google_auth=success');
    
  } catch (error) {
    console.error('Google token exchange error:', error);
    res.redirect(`http://localhost:3000?google_error=token_exchange_failed`);
  }
});

router.get('/google-profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tokenData = userTokens.get(userId);

    if (!tokenData) {
      return res.status(401).json({
        success: false,
        error: 'Google not authorized',
        message: 'Please authorize Google first'
      });
    }

    oauth2Client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken
    });

    const people = google.people({ version: 'v1', auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos'
    });

    res.json({
      success: true,
      user: {
        id: profile.data.resourceName,
        name: profile.data.names?.[0]?.displayName || 'N/A',
        email: profile.data.emailAddresses?.[0]?.value || 'N/A',
        photo: profile.data.photos?.[0]?.url || null
      }
    });

  } catch (error) {
    console.error('Google profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Google profile',
      details: error.message
    });
  }
});

router.get('/google-books', async (req, res) => {
  try {
    const query = req.query.q || 'fitness';
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Google API Key not configured'
      });
    }

    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}&maxResults=10`);

    res.json({
      success: true,
      message: 'Google Books API (public access)',
      books: response.data.items?.map(book => ({
        id: book.id,
        title: book.volumeInfo.title,
        authors: book.volumeInfo.authors,
        description: book.volumeInfo.description?.substring(0, 200) + '...',
        thumbnail: book.volumeInfo.imageLinks?.thumbnail
      })) || [],
      authFlow: 'API Key (public data)'
    });

  } catch (error) {
    console.error('Google Books error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Google Books',
      details: error.message
    });
  }
});

router.get('/google-status', verifyToken, (req, res) => {
  const userId = req.user.id;
  const tokenData = userTokens.get(userId);
  
  if (!tokenData) {
    return res.json({
      success: true,
      authorized: false,
      message: 'Google not connected'
    });
  }

  const isExpired = Date.now() >= tokenData.expiryDate;
  
  res.json({
    success: true,
    authorized: !isExpired,
    expiresAt: tokenData.expiryDate,
    message: isExpired ? 'Token expired, re-authorization needed' : 'Google connected'
  });
});

router.delete('/google-disconnect', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  if (userTokens.has(userId)) {
    userTokens.delete(userId);
    console.log(`Google tokens removed for user: ${userId}`);
  }
  
  res.json({
    success: true,
    message: 'Google account disconnected successfully'
  });
});

module.exports = router; 