const express = require('express');
const User = require('../models/User');
const router = express.Router();

// GET /api/users - Lấy tất cả user
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    });
  }
});

// POST /api/users - Tạo user mới
router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = new User({
      username,
      email,
      password, // Trong thực tế nên hash password
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create user',
      message: error.message,
    });
  }
});

// GET /api/users/:id - Lấy thông tin user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message,
    });
  }
});

module.exports = router;
