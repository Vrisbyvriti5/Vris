const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'Vrisbyvriti5@gmail.com', pass: 'dtdwctbefpqgmrdi' }
});

transporter.sendMail({
  from: '"VRIS" <Vrisbyvriti5@gmail.com>',
  to: 'rithikavardhan7@gmail.com',
  subject: 'Your VRIS Order #20 is Confirmed',
  html: `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px">
      <h2 style="color:#111">Order Confirmed!</h2>
      <p>Hi Rithika,</p>
      <p>We sincerely apologise for the confusion — your payment was received and your order is now confirmed and visible in your account at <a href="https://vrisbyvriti.com/orders">vrisbyvriti.com/orders</a>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr style="background:#f9fafb">
          <td style="padding:12px;border:1px solid #e5e7eb"><strong>Order #20</strong></td>
          <td style="padding:12px;border:1px solid #e5e7eb">Nazakat &times; 1</td>
          <td style="padding:12px;border:1px solid #e5e7eb"><strong>&#8377;3,960</strong></td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:13px">Payment ID: pay_TZcwCdZOfhIczS (UPI)</p>
      <p>We will process your order shortly. Please reach out to us at <a href="mailto:Vrisbyvriti5@gmail.com">Vrisbyvriti5@gmail.com</a> if you have any questions.</p>
      <p style="margin-top:32px">Warm regards,<br><strong>VRIS Team</strong></p>
    </div>
  `
}, (err, info) => {
  if (err) { console.error('Email error:', err.message); }
  else { console.log('Confirmation email sent to rithikavardhan7@gmail.com | ID:', info.messageId); }
});
