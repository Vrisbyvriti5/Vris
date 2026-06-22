const ContactRequestModel = require('../models/contactRequestModel');

const CONTACT_REQUEST_STATUSES = ['New', 'In Progress', 'Resolved'];

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'new') return 'New';
  if (normalized === 'in progress' || normalized === 'in_progress' || normalized === 'in-progress') return 'In Progress';
  if (normalized === 'resolved') return 'Resolved';
  return null;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const createContactRequest = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!name || name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!subject || subject.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a subject.',
      });
    }

    if (!message || message.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed message (at least 10 characters).',
      });
    }

    const contactRequest = await ContactRequestModel.create({
      name,
      email,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully. Our team will contact you soon.',
      data: contactRequest,
    });
  } catch (error) {
    console.error('Create contact request error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getAllContactRequests = async (_req, res) => {
  try {
    const requests = await ContactRequestModel.findAll();
    return res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error('Get contact requests error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateContactRequestStatus = async (req, res) => {
  try {
    const normalizedStatus = normalizeStatus(req.body?.status);

    if (!normalizedStatus || !CONTACT_REQUEST_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${CONTACT_REQUEST_STATUSES.join(', ')}`,
      });
    }

    const updated = await ContactRequestModel.updateStatus(req.params.id, normalizedStatus);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    return res.json({
      success: true,
      message: `Request status updated to "${normalizedStatus}".`,
      data: updated,
    });
  } catch (error) {
    console.error('Update contact request status error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createContactRequest,
  getAllContactRequests,
  updateContactRequestStatus,
};
