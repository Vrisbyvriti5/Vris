const OrderModel = require('../models/orderModel');
const CartModel = require('../models/cartModel');
const UserModel = require('../models/userModel');
const crypto = require('crypto');
const { createRazorpayClient } = require('../utils/razorpay');
const { sendOrderConfirmationEmail } = require('../utils/orderEmail');

const isValidAmount = (amount) => Number.isFinite(Number(amount)) && Number(amount) > 0;
const ORDER_STATUS_FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const normalizeOrderStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  const statusLookup = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    confirmed: 'Processing',
  };
  return statusLookup[normalized] || null;
};

const normalizeGiftingPayload = (gifting) => {
  if (!gifting || !gifting.enabled) {
    return null;
  }

  const amount = Number(gifting.amount || 35);
  const normalizedAmount = Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : 35;
  const message = String(gifting.message || '').trim().slice(0, 240);

  return {
    enabled: true,
    amount: normalizedAmount,
    message,
  };
};

const normalizeDonationPayload = (donation) => {
  if (!donation || !donation.enabled) {
    return null;
  }

  const amount = Number(donation.amount || 10);
  const normalizedAmount = Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : 10;

  return {
    enabled: true,
    amount: normalizedAmount,
  };
};

const buildOrderPayload = (payload) => {
  const { items, totalPrice, deliveryCharge, paymentMethod, paymentStatus, paymentId, razorpayOrderId, address, gifting, donation } = payload;
  return {
    items,
    totalPrice,
    deliveryCharge: deliveryCharge || 0,
    gifting: normalizeGiftingPayload(gifting),
    donation: normalizeDonationPayload(donation),
    paymentMethod: paymentMethod || 'razorpay',
    paymentStatus: paymentStatus || 'Pending',
    paymentId: paymentId || null,
    razorpayOrderId: razorpayOrderId || null,
    address,
  };
};

const sendOrderConfirmationNotification = async ({ userId, fallbackEmail, order, orderPayload }) => {
  try {
    const user = await UserModel.findById(userId);
    const recipientEmail = String(user?.email || fallbackEmail || '').trim().toLowerCase();

    if (!recipientEmail) {
      console.warn(`[OrderEmail] Recipient email missing. Skipping confirmation for order ${order?.id || 'N/A'}.`);
      return;
    }

    const clientUrl = String(process.env.CLIENT_URL || '').trim().replace(/\/$/, '');
    const trackOrderUrl = clientUrl ? `${clientUrl}/orders` : '';

    const mailResult = await sendOrderConfirmationEmail({
      to: recipientEmail,
      customerName: user?.name || orderPayload?.address?.fullName || 'Customer',
      orderId: order?.id,
      items: orderPayload?.items || [],
      totalAmount: orderPayload?.totalPrice,
      shippingAddress: orderPayload?.address || {},
      orderStatus: 'Placed',
      estimatedDeliveryText: 'Estimated delivery: 5-7 business days.',
      trackOrderUrl,
    });

    if (mailResult?.sent) {
      console.log(`[OrderEmail] Confirmation sent for order ${order?.id} to ${recipientEmail}`);
      return;
    }

    if (mailResult?.skipped) {
      console.warn(`[OrderEmail] Confirmation skipped for order ${order?.id}: mailer not configured.`);
      return;
    }

    console.warn(`[OrderEmail] Confirmation not sent for order ${order?.id}.`);
  } catch (mailError) {
    console.error(`[OrderEmail] Failed for order ${order?.id}:`, mailError.message);
  }
};

// ── Place order ──────────────────────────────────────────────────────────────
const placeOrder = async (req, res) => {
  try {
    const { items, totalPrice, paymentMethod = 'razorpay', paymentStatus = 'Pending', address } = req.body;

    // Validation
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.',
      });
    }

    if (!address || !address.fullName || !address.mobile || !address.city) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required (fullName, mobile, city).',
      });
    }

    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total price must be a positive number.',
      });
    }

    if (paymentMethod === 'razorpay' && paymentStatus !== 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Razorpay orders can be placed only after successful payment verification.',
      });
    }

    const orderPayload = buildOrderPayload(req.body);
    const order = await OrderModel.create(req.user.id, orderPayload);

    // Clear the user's cart after successful order placement
    await CartModel.clearCart(req.user.id);

    // Reward System Logic: Add +100 VRIS reward points for successful purchase
    try {
      const { pool } = require('../config/db');
      // NOTE: This requires 'reward_points' column to be added to the users table
      await pool.query('UPDATE vris_users SET reward_points = COALESCE(reward_points, 0) + 100 WHERE id = ?', [req.user.id]);
      
      // Refer & Earn Logic Placeholder: Check if user has a 'referred_by' id and it's their first order
      const [orderCountRes] = await pool.query('SELECT COUNT(id) as count FROM vris_orders WHERE user_id = ?', [req.user.id]);
      if (orderCountRes[0].count === 1) {
        const [userRes] = await pool.query('SELECT referred_by FROM vris_users WHERE id = ?', [req.user.id]);
        const referrerId = userRes[0]?.referred_by;
        if (referrerId) {
          await pool.query('UPDATE vris_users SET vris_credits = COALESCE(vris_credits, 0) + 200 WHERE id = ?', [referrerId]);
          console.log(`[Referral] Added 200 credits to user ${referrerId} for referring user ${req.user.id}`);
        }
      }
    } catch (rewardError) {
      console.error('[RewardSystem] Failed to process rewards:', rewardError.message);
    }

    // Send confirmation email after successful order creation.
    await sendOrderConfirmationNotification({
      userId: req.user.id,
      fallbackEmail: req.user.email,
      order,
      orderPayload,
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: order,
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Create Razorpay order ────────────────────────────────────────────────────
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!isValidAmount(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number.',
      });
    }

    const razorpay = createRazorpayClient();
    const amountInPaise = Math.round(Number(amount) * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `vris_${req.user.id}_${Date.now()}`,
    });

    return res.status(201).json({
      success: true,
      data: {
        order,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay order.',
    });
  }
};

// ── Verify Razorpay payment signature ────────────────────────────────────────
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay payment details.',
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      data: {
        paymentStatus: 'Paid',
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      },
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment.',
    });
  }
};

// ── Get my orders ────────────────────────────────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const orders = await OrderModel.findByUserId(req.user.id);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Get single order ─────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Non-admin users can only view their own orders
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Get all orders (admin) ───────────────────────────────────────────────────
const getAllOrders = async (_req, res) => {
  try {
    const orders = await OrderModel.findAll();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Update order status (admin) ──────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus = normalizeOrderStatus(status);

    if (!normalizedStatus || !ORDER_STATUS_FLOW.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ORDER_STATUS_FLOW.join(', ')}`,
      });
    }

    const updated = await OrderModel.updateStatus(req.params.id, normalizedStatus);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const latest = await OrderModel.findById(req.params.id);

    res.json({
      success: true,
      message: `Order status updated to "${normalizedStatus}".`,
      data: latest,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  placeOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
