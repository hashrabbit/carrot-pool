const { roundTo } = require('./utils.js');

function CoinUtils(coinInfo) {
  const { minPaymentSatoshis, magnitude, coinPrecision } = coinInfo;

  this.satoshisToCoins = (satoshis) => roundTo((satoshis / magnitude), coinPrecision);

  // Convert Coins to Satoshis
  this.coinsToSatoshies = (coins) => Math.round(coins * magnitude);

  // Round Coins to Nearest Value Given Precision
  this.coinsRound = (number) => roundTo(number, coinPrecision);

  this.minPaymentSatoshis = minPaymentSatoshis;
}

module.exports = { CoinUtils };
