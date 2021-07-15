// Worker address filter test
const isInPaymentAmounts = (address) => (payment) => {
  if (!address || address.length === 0) return true;
  return Object.keys(payment.totals.amounts).includes(address);
};

// Collect Current Payments Data
const collectPaymentsData = ({ stats, address }) => {
  const poolEntries = {
    pool: stats.name,
    symbol: stats.symbol,
    algorithm: stats.algorithm
  };
  const payments = stats.payments.map((p) => JSON.parse(p))
    .map((entries) => ({ ...poolEntries, ...entries }))
    .filter(isInPaymentAmounts(address));
  return { payments };
};

module.exports = { collectPaymentsData };
