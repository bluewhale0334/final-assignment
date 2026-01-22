const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7).trim();
};

const authenticateToken = (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    res.status(401).json({ message: '토큰이 필요합니다.' });
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  } catch (error) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    return null;
  }
};

// Create user
router.post('/', async (req, res) => {
  try {
    const { email, name, password, user_type, address } = req.body;

    if (!email || !name || !password || !user_type) {
      return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      user_type,
      address,
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ message: '유저 생성 실패', error });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호가 필요합니다.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        address: user.address,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: '로그인 실패', error });
  }
});

// Read user info by token
router.get('/me', async (req, res) => {
  const decoded = authenticateToken(req, res);
  if (!decoded) {
    return;
  }

  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: '유저 조회 실패', error });
  }
});

// Read all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: '유저 목록 조회 실패', error });
  }
});

// Read user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: '유저 조회 실패', error });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { email, name, password, user_type, address } = req.body;

    const updateData = { email, name, user_type, address };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: '유저 수정 실패', error });
  }
});
// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }
    return res.json({ message: '유저 삭제 완료' });
  } catch (error) {
    return res.status(500).json({ message: '유저 삭제 실패', error });
  }
});

module.exports = router;
