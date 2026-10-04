const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/config');
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = jwt.sign(
      { email: email.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Insert user (with is_verified = true for now - email verification disabled)
    // TODO: To enable email verification later, change is_verified to false and uncomment email sending code below
    const result = await pool.query(
      'INSERT INTO users (email, username, password, is_verified) VALUES ($1, $2, $3, true) RETURNING id',
      [email.toLowerCase(), username.toLowerCase(), hashedPassword]
    );

    // EMAIL VERIFICATION CODE (DISABLED FOR NOW - CAN BE ENABLED LATER)
    // To enable email verification:
    // 1. Change is_verified to false in the INSERT query above
    // 2. Uncomment the code below
    // 3. Add MAILGUN_API_KEY and MAILGUN_DOMAIN to environment variables
    /*
    const verificationToken = jwt.sign(
      { email: email.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const verificationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/verify/${verificationToken}`;
    const mailData = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: 'Verify your Torquan account',
      text: `Welcome to Torquan! Please verify your email by clicking this link: ${verificationLink}`
    };

    await mailgun.messages().send(mailData);

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
      userId: result.rows[0].id
    });
    */

    res.status(201).json({
      message: 'Account created successfully! You can now log in.',
      userId: result.rows[0].id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Update user verification status
    await pool.query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE email = $1',
      [decoded.email]
    );

    res.redirect('/login?verified=true');
  } catch (error) {
    console.error('Verification error:', error);
    res.redirect('/login?verified=false');
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // EMAIL VERIFICATION CHECK (DISABLED FOR NOW - CAN BE ENABLED LATER)
    // To enable email verification, uncomment the check below:
    /*
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email first' });
    }
    */

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bodyColor: user.body_color
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Server error during signin' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, body_color, is_verified, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
