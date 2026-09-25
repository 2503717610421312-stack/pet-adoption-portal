const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// Register a new Adopter (User)
async function register(req, res) {
  try {
    const { full_name, email, phone, address, password } = req.body;

    // 1. Validation
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email, and Password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // 2. Check if email already exists
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insert user and return new ID
    const insertResult = await query(
      `INSERT INTO users (full_name, email, phone, address, password, role)
       VALUES ($1, $2, $3, $4, $5, 'User')
       RETURNING user_id`,
      [full_name.trim(), email.toLowerCase().trim(), phone || null, address || null, hashedPassword]
    );

    const newUserId = insertResult[0].user_id;

    // 5. Create initial welcome notification
    await query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'info')`,
      [newUserId, `Welcome to PawHaven, ${full_name}! Browse our adorable pets and start your adoption journey today.`]
    );

    // 6. Generate JWT token
    const token = jwt.sign(
      {
        userId: newUserId,
        email: email.toLowerCase().trim(),
        role: 'User',
        fullName: full_name.trim()
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        userId: newUserId,
        fullName: full_name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        address: address || null,
        role: 'User'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
}

// User / Admin Login
async function login(req, res) {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // 1. Find user by email
    const users = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // 2. Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 3. Optional check if logging into specific portal (e.g. Admin portal)
    if (expectedRole && expectedRole === 'Admin' && user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have Administrator privileges.'
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
}

// Get current profile
async function getMe(req, res) {
  try {
    const users = await query(
      'SELECT user_id, full_name, email, phone, address, role, created_at FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];
    return res.status(200).json({
      success: true,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile.' });
  }
}

// Update profile
async function updateProfile(req, res) {
  try {
    const { full_name, phone, address, current_password, new_password } = req.body;
    const userId = req.user.userId;

    if (!full_name) {
      return res.status(400).json({ success: false, message: 'Full name cannot be empty.' });
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
      }
      const [u] = await query('SELECT password FROM users WHERE user_id = $1', [userId]);
      const isMatch = await bcrypt.compare(current_password, u.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      await query('UPDATE users SET password = $1 WHERE user_id = $2', [hashedPassword, userId]);
    }

    await query(
      'UPDATE users SET full_name = $1, phone = $2, address = $3 WHERE user_id = $4',
      [full_name.trim(), phone || null, address || null, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
