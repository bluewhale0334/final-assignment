const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// Create product
router.post('/', async (req, res) => {
  try {
    const { sku, name, price, category, image, description } = req.body;

    if (!sku || !name || price === undefined || !category || !image) {
      return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
    }

    const existing = await Product.findOne({ sku });
    if (existing) {
      return res.status(409).json({ message: 'SKU가 이미 존재합니다.' });
    }

    const product = await Product.create({
      sku,
      name,
      price,
      category,
      image,
      description,
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: '상품 생성 실패', error });
  }
});

// Read all products (paginated)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 5, 1),
      50
    );
    const skip = (page - 1) * pageSize;

    const [total, products] = await Promise.all([
      Product.countDocuments(),
      Product.find().skip(skip).limit(pageSize),
    ]);

    return res.json({
      items: products,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return res.status(500).json({ message: '상품 목록 조회 실패', error });
  }
});

// Read product by id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: '상품 조회 실패', error });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { sku, name, price, category, image, description } = req.body;

    if (sku) {
      const existing = await Product.findOne({ sku });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(409).json({ message: 'SKU가 이미 존재합니다.' });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { sku, name, price, category, image, description },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    return res.json(updatedProduct);
  } catch (error) {
    return res.status(500).json({ message: '상품 수정 실패', error });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }
    return res.json({ message: '상품 삭제 완료' });
  } catch (error) {
    return res.status(500).json({ message: '상품 삭제 실패', error });
  }
});

module.exports = router;
