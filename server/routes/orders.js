const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

const REQUIRED_SNAPSHOT_FIELDS = ['sku', 'name', 'price', 'category', 'image'];
const ALLOWED_PAYMENT_METHODS = [
  '카드결제',
  '계좌이체',
  '카카오페이',
  '네이버페이',
];

const getPortOneToken = async () => {
  const apiKey = process.env.IMP_REST_API_KEY;
  const apiSecret = process.env.IMP_REST_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error('PORTONE_ENV_MISSING');
  }

  const response = await fetch('https://api.iamport.kr/users/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imp_key: apiKey, imp_secret: apiSecret }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.code !== 0) {
    throw new Error('PORTONE_TOKEN_FAILED');
  }

  return payload.response?.access_token;
};

const verifyPortOnePayment = async (impUid, expectedAmount) => {
  const token = await getPortOneToken();
  const response = await fetch(
    `https://api.iamport.kr/payments/${encodeURIComponent(impUid)}`,
    {
      headers: { Authorization: token },
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.code !== 0) {
    throw new Error('PORTONE_VERIFY_FAILED');
  }

  const payment = payload.response || {};
  const paidAmount = Number(payment.amount);
  if (payment.status !== 'paid') {
    throw new Error('PORTONE_NOT_PAID');
  }
  if (paidAmount !== Number(expectedAmount)) {
    throw new Error('PORTONE_AMOUNT_MISMATCH');
  }

  return payment;
};

const validateOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return '주문 항목이 필요합니다.';
  }

  for (const [index, item] of items.entries()) {
    if (!item.product) {
      return `items[${index}].product가 필요합니다.`;
    }
    if (!item.productSnapshot) {
      return `items[${index}].productSnapshot이 필요합니다.`;
    }
    for (const field of REQUIRED_SNAPSHOT_FIELDS) {
      if (
        item.productSnapshot[field] === undefined ||
        item.productSnapshot[field] === null ||
        item.productSnapshot[field] === ''
      ) {
        return `items[${index}].productSnapshot.${field}가 필요합니다.`;
      }
    }
    if (item.quantity === undefined || item.quantity === null) {
      return `items[${index}].quantity가 필요합니다.`;
    }
    if (Number(item.quantity) < 1) {
      return `items[${index}].quantity는 1 이상이어야 합니다.`;
    }
  }

  return null;
};

const normalizeOrderItems = (items) => {
  return items.map((item) => {
    const quantity = Number(item.quantity);
    const price = Number(item.productSnapshot.price);
    const lineTotal = price * quantity;
    return {
      ...item,
      quantity,
      lineTotal,
    };
  });
};

// Create order
router.post('/', async (req, res) => {
  try {
    const {
      user,
      items,
      status,
      payment,
      note,
      customerName,
      customerPhone,
    } = req.body;

    if (!user) {
      return res.status(400).json({ message: '유저 정보가 필요합니다.' });
    }
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ message: '주문자 이름이 필요합니다.' });
    }
    if (!customerPhone || !customerPhone.trim()) {
      return res.status(400).json({ message: '주문자 전화번호가 필요합니다.' });
    }
    if (!payment || typeof payment !== 'object') {
      return res.status(400).json({ message: '결제 정보가 필요합니다.' });
    }
    if (!payment.method || !payment.method.trim()) {
      return res.status(400).json({ message: '결제 방식이 필요합니다.' });
    }
    const trimmedMethod = payment.method.trim();
    if (!ALLOWED_PAYMENT_METHODS.includes(trimmedMethod)) {
      return res.status(400).json({ message: '지원하지 않는 결제 방식입니다.' });
    }
    if (!payment.transactionId || !payment.transactionId.trim()) {
      return res.status(400).json({ message: '결제 식별값이 필요합니다.' });
    }

    const validationError = validateOrderItems(items);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedItems = normalizeOrderItems(items);
    const totalAmount = normalizedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );

    try {
      await verifyPortOnePayment(payment.transactionId.trim(), totalAmount);
    } catch (error) {
      if (error.message === 'PORTONE_ENV_MISSING') {
        return res
          .status(500)
          .json({ message: '결제 검증 환경변수가 설정되지 않았습니다.' });
      }
      if (error.message === 'PORTONE_AMOUNT_MISMATCH') {
        return res
          .status(400)
          .json({ message: '결제 금액이 주문 금액과 일치하지 않습니다.' });
      }
      if (error.message === 'PORTONE_NOT_PAID') {
        return res.status(400).json({ message: '결제가 완료되지 않았습니다.' });
      }
      return res
        .status(400)
        .json({ message: '결제 검증에 실패했습니다.' });
    }

    const order = await Order.create({
      user,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: normalizedItems,
      totalAmount,
      status,
      payment: {
        ...payment,
        method: trimmedMethod,
        provider: payment.provider?.trim(),
        merchantUid: payment.merchantUid?.trim(),
        transactionId: payment.transactionId?.trim(),
      },
      note,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('user')
      .populate('items.product');

    return res.status(201).json(populatedOrder);
  } catch (error) {
    return res.status(500).json({ message: '주문 생성 실패', error });
  }
});

// Read all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user')
      .populate('items.product');
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: '주문 목록 조회 실패', error });
  }
});

// Read orders by user id
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate('user')
      .populate('items.product');
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: '주문 목록 조회 실패', error });
  }
});

// Read order by id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .populate('items.product');
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: '주문 조회 실패', error });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const {
      user,
      items,
      status,
      payment,
      note,
      customerName,
      customerPhone,
    } = req.body;

    const updateData = {};
    if (user) {
      updateData.user = user;
    }
    if (customerName !== undefined) {
      if (!customerName || !customerName.trim()) {
        return res
          .status(400)
          .json({ message: '주문자 이름이 필요합니다.' });
      }
      updateData.customerName = customerName.trim();
    }
    if (customerPhone !== undefined) {
      if (!customerPhone || !customerPhone.trim()) {
        return res
          .status(400)
          .json({ message: '주문자 전화번호가 필요합니다.' });
      }
      updateData.customerPhone = customerPhone.trim();
    }

    if (items !== undefined) {
      const validationError = validateOrderItems(items);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
      const normalizedItems = normalizeOrderItems(items);
      updateData.items = normalizedItems;
      updateData.totalAmount = normalizedItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0
      );
    }

    if (status) {
      updateData.status = status;
    }
    if (payment !== undefined) {
      if (!payment || typeof payment !== 'object') {
        return res.status(400).json({ message: '결제 정보가 필요합니다.' });
      }
      if (!payment.method || !payment.method.trim()) {
        return res.status(400).json({ message: '결제 방식이 필요합니다.' });
      }
      const trimmedMethod = payment.method.trim();
      if (!ALLOWED_PAYMENT_METHODS.includes(trimmedMethod)) {
        return res.status(400).json({ message: '지원하지 않는 결제 방식입니다.' });
      }
      if (!payment.transactionId || !payment.transactionId.trim()) {
        return res.status(400).json({ message: '결제 식별값이 필요합니다.' });
      }
      updateData.payment = {
        ...payment,
        method: trimmedMethod,
        provider: payment.provider?.trim(),
        merchantUid: payment.merchantUid?.trim(),
        transactionId: payment.transactionId?.trim(),
      };
    }
    if (note !== undefined) {
      updateData.note = note;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user')
      .populate('items.product');

    if (!updatedOrder) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: '주문 수정 실패', error });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }
    return res.json({ message: '주문 삭제 완료' });
  } catch (error) {
    return res.status(500).json({ message: '주문 삭제 실패', error });
  }
});

module.exports = router;
