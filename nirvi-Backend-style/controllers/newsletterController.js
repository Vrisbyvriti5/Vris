const NewsletterSubscriberModel = require('../models/newsletterSubscriberModel');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const subscribeNewsletter = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const existing = await NewsletterSubscriberModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'This email is already subscribed.' });
    }

    const subscriber = await NewsletterSubscriberModel.create(email);

    return res.status(201).json({
      success: true,
      message: 'Subscribed successfully.',
      data: subscriber,
    });
  } catch (error) {
    console.error('Subscribe newsletter error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getNewsletterSubscribers = async (_req, res) => {
  try {
    const subscribers = await NewsletterSubscriberModel.findAll();
    return res.json({ success: true, count: subscribers.length, data: subscribers });
  } catch (error) {
    console.error('Get newsletter subscribers error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  subscribeNewsletter,
  getNewsletterSubscribers,
};
