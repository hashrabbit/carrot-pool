// Return the list of unspent balances, via RPC to the coin daemon.

const listUnspent = (env) => {
  const { daemon, logger, coinUtils } = env;
  const { coinsRound, coinsToSatoshies } = coinUtils;

  return (addr, notAddr, minConf, displayBool) => {
    let args;
    if (addr !== null) {
      args = [minConf, 99999999, [addr]];
    } else {
      addr = 'Payout wallet';
      args = [minConf, 99999999];
    }
    return daemon.rpcCmd('listunspent', args)
      .catch((error) => {
        logger.error(`Error with RPC call listunspent ${addr} ${error.toString()}`);
        throw error;
      })
      .then(([data]) => {
        let balance = 0;
        if (data.response != null && data.response.length > 0) {
          data.response.forEach((response) => {
            if (response.address && response.address !== notAddr) {
              balance += parseFloat(response.amount || 0);
            }
          });
          balance = coinsRound(balance);
        }
        if (displayBool) { logger.special(`${addr} balance of ${balance}`); }
        return coinsToSatoshies(balance);
      });
  };
};

module.exports = { listUnspent };
