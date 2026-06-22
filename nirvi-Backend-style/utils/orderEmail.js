const { sendMail } = require('./mailer');

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
};

const normalizeItems = (items = []) => items.map((item) => {
  const quantity = Math.max(1, Number(item.quantity || 1));
  const price = Number(item.price || 0);
  const lineTotal = quantity * price;

  return {
    name: String(item.name || 'Product'),
    quantity,
    price,
    lineTotal,
  };
});

const buildAddressLines = (shippingAddress = {}) => {
  const lineOne = [shippingAddress.fullAddress, shippingAddress.landmark]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .join(', ');

  const lineTwo = [shippingAddress.city, shippingAddress.state, shippingAddress.pincode]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .join(', ');

  const contactLine = [shippingAddress.fullName, shippingAddress.mobile]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .join(' | ');

  return [contactLine, lineOne, lineTwo].filter(Boolean);
};

const buildItemsRowsHtml = (items = []) => items
  .map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e9e9e9;color:#111;">${escapeHtml(item.name)}</td>
      <td style="padding:12px;border-bottom:1px solid #e9e9e9;color:#333;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #e9e9e9;color:#333;text-align:right;">Rs. ${formatMoney(item.price)}</td>
      <td style="padding:12px;border-bottom:1px solid #e9e9e9;color:#111;text-align:right;font-weight:600;">Rs. ${formatMoney(item.lineTotal)}</td>
    </tr>
  `)
  .join('');

const sendOrderConfirmationEmail = async ({
  to,
  customerName,
  orderId,
  items,
  totalAmount,
  shippingAddress,
  orderStatus = 'Placed',
  estimatedDeliveryText = 'Estimated delivery: 5-7 business days.',
  trackOrderUrl,
}) => {
  const normalizedTo = String(to || '').trim().toLowerCase();
  if (!normalizedTo) {
    return { sent: false, skipped: true, reason: 'Missing recipient email.' };
  }

  const normalizedItems = normalizeItems(items);
  const fallbackTotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const finalTotal = Number.isFinite(Number(totalAmount)) ? Number(totalAmount) : fallbackTotal;
  const addressLines = buildAddressLines(shippingAddress);
  const safeCustomerName = escapeHtml(customerName || shippingAddress?.fullName || 'Customer');
  const safeOrderId = escapeHtml(orderId || 'N/A');
  const safeOrderStatus = escapeHtml(orderStatus || 'Placed');
  const safeEstimatedDelivery = escapeHtml(estimatedDeliveryText);
  const safeTrackOrderUrl = String(trackOrderUrl || '').trim();

  const rowsHtml = buildItemsRowsHtml(normalizedItems);

  const html = `
    <div style="background:#f6f6f6;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
        <div style="background:#111;color:#fff;padding:18px 24px;">
          <h1 style="margin:0;font-size:22px;letter-spacing:0.04em;">VRIS</h1>
          <p style="margin:6px 0 0 0;font-size:14px;opacity:0.9;">Order Confirmation - VRIS</p>
        </div>

        <div style="padding:24px;">
          <p style="margin:0 0 14px 0;font-size:15px;">Hi ${safeCustomerName},</p>
          <p style="margin:0 0 18px 0;font-size:14px;color:#333;">Your order has been successfully placed. Thank you for shopping with VRIS.</p>

          <div style="background:#fafafa;border:1px solid #ececec;border-radius:10px;padding:14px 16px;margin-bottom:18px;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Order Details</p>
            <p style="margin:0;font-size:14px;"><strong>Order ID:</strong> ${safeOrderId}</p>
            <p style="margin:4px 0 0 0;font-size:14px;"><strong>Order Status:</strong> ${safeOrderStatus}</p>
          </div>

          <h2 style="margin:0 0 10px 0;font-size:16px;">Order Summary</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #ececec;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f3f3f3;">
                <th style="padding:12px;text-align:left;font-size:13px;color:#222;">Product</th>
                <th style="padding:12px;text-align:center;font-size:13px;color:#222;">Qty</th>
                <th style="padding:12px;text-align:right;font-size:13px;color:#222;">Price</th>
                <th style="padding:12px;text-align:right;font-size:13px;color:#222;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="4" style="padding:14px;text-align:center;color:#666;">No items found</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top:14px;padding:14px 16px;border:1px solid #ececec;border-radius:10px;background:#fffdf7;">
            <p style="margin:0;font-size:16px;font-weight:700;color:#111;">Total Amount: <span style="color:#0f766e;">Rs. ${formatMoney(finalTotal)}</span></p>
          </div>

          <div style="margin-top:18px;">
            <h3 style="margin:0 0 8px 0;font-size:15px;">Shipping Address</h3>
            ${addressLines.map((line) => `<p style="margin:0 0 4px 0;font-size:14px;color:#333;">${escapeHtml(line)}</p>`).join('')}
          </div>

          <p style="margin:18px 0 0 0;font-size:13px;color:#555;">${safeEstimatedDelivery}</p>
          ${safeTrackOrderUrl ? `
            <p style="margin:10px 0 0 0;font-size:13px;">
              <a href="${escapeHtml(safeTrackOrderUrl)}" style="color:#111;font-weight:700;text-decoration:underline;">Track Order</a>
            </p>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  const text = [
    'VRIS - Order Confirmation',
    '',
    `Hi ${customerName || shippingAddress?.fullName || 'Customer'},`,
    'Your order has been successfully placed.',
    '',
    `Order ID: ${orderId || 'N/A'}`,
    `Order Status: ${orderStatus || 'Placed'}`,
    '',
    'Items:',
    ...normalizedItems.map((item) => `- ${item.name} x ${item.quantity} @ Rs. ${formatMoney(item.price)} = Rs. ${formatMoney(item.lineTotal)}`),
    '',
    `Total Amount: Rs. ${formatMoney(finalTotal)}`,
    '',
    'Shipping Address:',
    ...addressLines,
    '',
    estimatedDeliveryText,
    safeTrackOrderUrl ? `Track Order: ${safeTrackOrderUrl}` : '',
  ].filter(Boolean).join('\n');

  return sendMail({
    to: normalizedTo,
    subject: 'Order Confirmation - VRIS',
    text,
    html,
  });
};

module.exports = {
  sendOrderConfirmationEmail,
};
