const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendMail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('Mailer not configured. EMAIL_USER/EMAIL_PASS missing. Skipping email send.');
    return { sent: false, skipped: true };
  }

  await transporter.verify();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });

  return { sent: true };
};

module.exports = { sendMail };
