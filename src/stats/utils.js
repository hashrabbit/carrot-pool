const algorithms = require('stratum-pool/scripts/algorithms.js');

const shareMultiplier = (algorithm) => {
  // We "lookup" the multiplier for our coin's algorithm. However, the multiplier
  // for every algorithm is set to 1, if not otherwise specified. So, this function
  // always returns 2 ** 32, for any sha256-based coin.
  const { multiplier } = algorithms[algorithm];
  return 2 ** 32 / multiplier;
};

// Computes a sum from a set of Redis hscan results.
const sumScanValues = (results) => {
  // Redis hscan results have the values in the array's odd indexes
  const values = results.filter((e, i) => i % 2);
  return values.reduce((acc, v) => acc + parseFloat(v), 0);
};

// Round to # of Digits Given
const roundTo = (n, digits) => {
  if (digits === undefined) {
    digits = 0;
  }
  const multiplicator = 10 ** digits;
  n = parseFloat((n * multiplicator).toFixed(11));
  const test = (Math.round(n) / multiplicator);
  return +(test.toFixed(digits));
};

// Round Coins to Nearest Value Given Precision
const coinsRound = (number) => {
  const magnitude = 100000000;
  const coinPrecision = magnitude.toString().length - 1;
  return roundTo(number, coinPrecision);
};

// Sort Object Properties Given Info
const sortProperties = (obj, sortedBy, isNumericSort, reverse) => {
  sortedBy = sortedBy || 1;
  isNumericSort = isNumericSort || false;
  reverse = reverse || false;
  const reversed = (reverse) ? -1 : 1;
  const sortable = [];
  Object.keys(obj).forEach((key) => {
    if ({}.hasOwnProperty.call(obj, key)) {
      sortable.push([key, obj[key]]);
    }
  });
  if (isNumericSort) {
    sortable.sort((a, b) => reversed * (a[1][sortedBy] - b[1][sortedBy]));
  } else {
    sortable.sort((a, b) => {
      const x = a[1][sortedBy].toLowerCase();
      const y = b[1][sortedBy].toLowerCase();
      const xGreater = x > y ? reversed : 0;
      return x < y ? reversed * -1 : xGreater;
    });
  }
  return sortable;
};

// Sort All Pools
const sortPools = (objects) => {
  const newObject = {};
  const sortedArray = sortProperties(objects, 'name', false, false);
  for (let i = 0; i < sortedArray.length; i += 1) {
    const key = sortedArray[i][0];
    const value = sortedArray[i][1];
    newObject[key] = value;
  }
  return newObject;
};

// Sort All Blocks
const sortBlocks = (a, b) => {
  const as = parseInt(JSON.parse(a).height, 10);
  const bs = parseInt(JSON.parse(b).height, 10);
  if (as > bs) return -1;
  if (as < bs) return 1;
  return 0;
};

module.exports = {
  shareMultiplier,
  sumScanValues,
  coinsRound,
  sortProperties,
  sortPools,
  sortBlocks,
};
