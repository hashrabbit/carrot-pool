const fetchBlocks = ({ daemon, logger }) => (dups) => {
  const rpcDupCheck = dups.map((r) => ['getblock', [r.blockHash]]);
  return daemon.rpcBatch(rpcDupCheck)
    .catch((dupError) => {
      const msg = `dupsInvalidator: Error calling 'getblock' daemon rpc ${dupError.message}`;
      logger.error(msg);
      throw new Error(msg);
    });
};

module.exports = { fetchBlocks };
