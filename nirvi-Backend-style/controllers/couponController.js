const CouponModel = require('../models/couponModel');
const OrderModel = require('../models/orderModel');

const clampDiscount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  if (numeric > 95) return 95;
  return Number(numeric.toFixed(2));
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const applyCoupon = async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const orderAmount = Number(req.body?.orderAmount);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required.',
      });
    }

    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Order amount must be a positive number.',
      });
    }

    const coupon = await CouponModel.findByCode(code);
    if (!coupon || !coupon.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code.',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(coupon.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired.',
      });
    }

    const minOrderAmount = Number(coupon.min_order_amount || 0);
    if (orderAmount < minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is Rs. ${minOrderAmount.toFixed(2)}.`,
      });
    }

    if (coupon.is_first_order_only) {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'You must be logged in to use this coupon.',
        });
      }

      const hasPlacedOrder = await OrderModel.hasUserPlacedOrder(req.user.id);
      if (hasPlacedOrder) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is valid for first-time purchases only.',
        });
      }
    }

    const discountPercent = clampDiscount(coupon.discount_percent);
    let discountAmount = 0;

    if (coupon.discount_amount && Number(coupon.discount_amount) > 0) {
      discountAmount = roundMoney(coupon.discount_amount);
    } else {
      discountAmount = roundMoney((orderAmount * discountPercent) / 100);
    }

    const finalAmount = roundMoney(Math.max(orderAmount - discountAmount, 0));

    return res.json({
      success: true,
      message: 'Coupon applied successfully.',
      data: {
        code,
        discountPercent,
        discountAmount,
        orderAmount: roundMoney(orderAmount),
        finalAmount,
        minOrderAmount,
        expiryDate: coupon.expiry_date,
      },
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

module.exports = {
  applyCoupon,
};
