const buildWorkersRounds = ({ coinUtils }) => ([unpaid, pending]) => {
  const workers = {};

  if (unpaid) {
    Object.entries(unpaid).forEach((pair) => {
      const [w, bal] = pair;
      workers[w] = { balance: coinUtils.coinsToSatoshies(parseFloat(bal)) };
    });
  }

  // Convert pending entries into block rounds
  const rounds = pending.map((r) => {
    const details = JSON.parse(r);
    const { worker: workerAddress } = details;
    delete details.worker;
    return {
      ...details,
      workerAddress,
      duplicate: false,
      serialized: r
    };
  });
  // Sort Rounds by Block Height
  rounds.sort((a, b) => a.height - b.height);
  return { workers, rounds };
};

module.exports = { buildWorkersRounds };
