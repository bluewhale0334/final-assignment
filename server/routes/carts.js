const express = require('express');
const Cart = require('../models/Cart');

const router = express.Router();

// Create cart
router.post('/', async (req, res) => {
  try {
    const { user, items } = req.body;

    if (!user) {
      return res.status(400).json({ message: '유저 정보가 필요합니다.' });
    }

    const existing = await Cart.findOne({ user });
    if (existing) {
      return res.status(409).json({ message: '이미 장바구니가 존재합니다.' });
    }

    const cart = await Cart.create({ user, items: items || [] });
    return res.status(201).json(cart);
  } catch (error) {
    return res.status(500).json({ message: '장바구니 생성 실패', error });
  }
});

// Read all carts
router.get('/', async (req, res) => {
  try {
    const carts = await Cart.find().populate('user').populate('items.product');
    return res.json(carts);
  } catch (error) {
    return res.status(500).json({ message: '장바구니 목록 조회 실패', error });
  }
});

// Read cart by id
router.get('/:id', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id)
      .populate('user')
      .populate('items.product');
    if (!cart) {
      return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });
    }
    return res.json(cart);
  } catch (error) {
    return res.status(500).json({ message: '장바구니 조회 실패', error });
  }
});

// Read cart by user id
router.get('/user/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate('user')
      .populate('items.product');
    if (!cart) {
      return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });
    }
    return res.json(cart);
  } catch (error) {
    return res.status(500).json({ message: '장바구니 조회 실패', error });
  }
});

// Update cart
router.put('/:id', async (req, res) => {
  try {
    const { user, items } = req.body;

    const updatedCart = await Cart.findByIdAndUpdate(
      req.params.id,
      { user, items },
      { new: true, runValidators: true }
    )
      .populate('user')
      .populate('items.product');

    if (!updatedCart) {
      return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });
    }

    return res.json(updatedCart);
  } catch (error) {
    return res.status(500).json({ message: '장바구니 수정 실패', error });
  }
});

// Delete cart
router.delete('/:id', async (req, res) => {
  try {
    const deletedCart = await Cart.findByIdAndDelete(req.params.id);
    if (!deletedCart) {
      return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });
    }
    return res.json({ message: '장바구니 삭제 완료' });
  } catch (error) {
    return res.status(500).json({ message: '장바구니 삭제 실패', error });
  }
});

module.exports = router;
