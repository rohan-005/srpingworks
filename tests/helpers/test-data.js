/**
 * Independent helper calculations and constants for testing.
 * DO NOT copy buggy implementation formulas from server.js.
 */

const SEED_CATALOG = [
  { id: "IDENTITY", name: "Identity Check", price: 299 },
  { id: "EDUCATION", name: "Education Check", price: 499 },
  { id: "EMPLOYMENT", name: "Employment Check", price: 999 },
  { id: "ADDRESS", name: "Address Check", price: 349 },
  { id: "CRIMINAL", name: "Criminal Record Check", price: 599 },
  { id: "CREDIT", name: "Credit Check", price: 249 }
];

const GST_RATE = 0.18;

function calculateExpectedQuote(checkPrices, discountPercent = 0) {
  const subtotal = checkPrices.reduce((acc, p) => acc + p, 0);
  const discount = subtotal * (discountPercent / 100);
  const gst = subtotal * GST_RATE;
  const total = subtotal - discount + gst;
  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    total: Number(total.toFixed(2))
  };
}

function formatINR(amount) {
  return `₹${Number(amount).toFixed(2)}`;
}

module.exports = {
  SEED_CATALOG,
  GST_RATE,
  calculateExpectedQuote,
  formatINR
};
