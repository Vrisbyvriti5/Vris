export const formatCurrency = (value) => `Rs. ${new Intl.NumberFormat('en-IN').format(value)}`;

export const formatDate = (value) => new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date(value));
