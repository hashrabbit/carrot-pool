// Prepare a record of payments for redis from the result of jsonrpc sendmany call
const preparePaymentsUpdate = (env) => (args) => {
  const { logger, withholdPercent, coinUtils, signalStop } = env;
  const { workers, rounds, workerRecords } = args;
  const { amountsRecords, unpaidRecords, shareRecords, totalShares, totalSent } = workerRecords;
  const { satoshisToCoins } = coinUtils;

  return (result) => {
    let txid = null;
    if (result.response) {
      txid = result.response;
    }
    if (txid != null) {
      logger.special(`Sent ${satoshisToCoins(totalSent)} to ${Object.keys(amountsRecords).length} workers; txid: ${txid}`);
      if (withholdPercent > 0) {
        logger.warning(`Had to withhold ${withholdPercent * 100
        }% of reward from workers to cover transaction fees. `
                                + 'Fund pool wallet with coins to prevent this from happening');
      }
      const paymentsRecords = rounds.filter((round) => round.category === 'generate').map((round) => {
        const roundRecords = {
          height: round.height,
          amounts: {},
          shares: {},
          times: {},
        };
        Object.keys(workers).forEach((worker) => {
          if (typeof workers[worker].records !== 'undefined') {
            if (round.height in workers[worker].records) {
              const record = workers[worker].records[round.height];
              roundRecords.amounts[worker] = record.amounts;
              roundRecords.shares[worker] = record.shares;
              roundRecords.times[worker] = record.times;
            }
          }
        });
        return roundRecords;
      });
      const paymentsUpdate = [];
      const paymentsData = {
        time: Date.now(),
        txid,
        paid: satoshisToCoins(totalSent),
        records: paymentsRecords,
        shares: totalShares,
        totals: {
          amounts: amountsRecords,
          shares: shareRecords,
        },
        unpaid: unpaidRecords,
        workers: Object.keys(amountsRecords).length,
      };
      paymentsUpdate.push(['zadd', `${logger.component}:payments:payments`, Date.now(), JSON.stringify(paymentsData)]);

      return { workers, rounds, paymentsUpdate };
    } // Else if result had no response...
    // TODO: Instead of passing down a `signalStop` callback which clears the intervals...
    // Return a custom error type like DoNotScheduleError,
    //   subclass of CalculatePaymentsError (itself a subclass of Error)
    // Match on instanceof DoNotScheduleError at the SetInterval callsite
    //   to determine if we must also cancel the scheduling intervals.
    // Requires us to completely promisify the chain all the way up to SetInterval
    //   so errors are properly propagated back.
    signalStop();
    logger.error(`Error RPC sendmany did not return txid ${JSON.stringify(result)}Disabling payment processing to prevent possible double-payouts.`);
    throw new Error(`Error RPC sendmany did not return txid ${JSON.stringify(result)}Disabling payment processing to prevent possible double-payouts.`);
  };
};

module.exports = { preparePaymentsUpdate };
