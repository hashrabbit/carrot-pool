// This is a heavily modified version of payments/utils.validateAddress. We want to
// ensure that the pool's wallet address (poolOptions.addresses.address) belongs to
// our pool, since all payments are processed through it. This is done via the
// https://bitcoincore.org/en/doc/0.20.0/rpc/wallet/getaddressinfo/ RPC command.

const validateAddress = ({ daemon, logger }) => async (address) => (
  daemon.rpcCmd('getaddressinfo', [address], true)
    .then((reply) => {
      const { response: { ismine } } = reply;
      return ismine;
    })
    .catch((error) => {
      const msg = `validateAddress: getaddressinfo failed with: ${error.message}`;
      // TODO(rschifflin): Hack since the wrapped daemon doesn't expose its logger yet
      // We should be able to re-use the wrapped daemon's logger which always exists
      if (logger) {
        logger.error(msg);
      } else {
        console.log(`error: ${msg}`);
      }

      return false;
    })
);

module.exports = { validateAddress };
