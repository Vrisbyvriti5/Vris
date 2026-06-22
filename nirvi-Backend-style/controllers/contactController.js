const ContactMessageModel = require('../models/contactMessageModel');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const createContactMessage = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    if (!subject || subject.length < 3) {
      return res.status(400).json({ success: false, message: 'Subject is required.' });
    }

    if (!message || message.length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters.' });
    }

    const saved = await ContactMessageModel.create({ name, email, subject, message });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: saved,
    });
  } catch (error) {
    console.error('Create contact message error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getContactMessages = async (_req, res) => {
  try {
    const messages = await ContactMessageModel.findAll();
    return res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error('Get contact messages error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createContactMessage,
  getContactMessages,
};
