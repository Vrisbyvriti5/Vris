const CustomizationModel = require('../models/customizationModel');

const CUSTOMIZATION_STATUSES = [
  'Pending',
  'Processing',
  'Preprocessing',
  'Ready',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const normalizeCustomizationStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  const lookup = {
    pending: 'Pending',
    processing: 'Processing',
    preprocessing: 'Preprocessing',
    ready: 'Ready',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
  };
  return lookup[normalized] || null;
};

// ── Get all customization orders (admin) ─────────────────────────────────────
const getAllCustomizations = async (_req, res) => {
  try {
    const items = await CustomizationModel.findAll();
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Get all customizations error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Get single customization (admin) ─────────────────────────────────────────
const getCustomizationById = async (req, res) => {
  try {
    const item = await CustomizationModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Customization not found.' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get customization error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Update customization order status (admin) ─────────────────────────────────
const updateCustomizationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus = normalizeCustomizationStatus(status);

    if (!normalizedStatus) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${CUSTOMIZATION_STATUSES.join(', ')}`,
      });
    }

    // req.params.id here is the order_id (not item id) — passed from the admin page
    const updated = await CustomizationModel.updateStatus(req.params.id, normalizedStatus);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({
      success: true,
      message: `Customization status updated to "${normalizedStatus}".`,
      data: { orderId: req.params.id, status: normalizedStatus },
    });
  } catch (error) {
    console.error('Update customization status error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAllCustomizations,
  getCustomizationById,
  updateCustomizationStatus,
};
