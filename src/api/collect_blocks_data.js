// Block address filter test
const isBlockAddress = (address) => (block) => {
  if (!address || address.length === 0) return true;
  return block.worker === address;
};

const blocksSinceX = (blocks, time) => blocks.filter((b) => b.time > time).length;

const collectBlocksData = ({ stats, address }) => {
  const poolEntries = {
    pool: stats.name,
    symbol: stats.symbol,
    algorithm: stats.algorithm
  };
  const confirms = stats.blocks.confirmations;
  const types = ['pending', 'confirmed'];
  const blocks = types.flatMap((type) => {
    const isPending = type === 'pending';
    return stats.blocks[type].map((p) => JSON.parse(p))
      .map((entries) => ({
        ...poolEntries,
        ...entries,
        confirmed: !isPending,
        confirmations: isPending ? (confirms[entries.blockHash] || 1) : 100
      }));
  }).filter(isBlockAddress(address));

  // Calculate Blocks Found in Last "X" Hours/Days
  const currentDate = new Date();
  const statistics = {
    lastHour: blocksSinceX(blocks, currentDate.setHours(currentDate.getHours() - 1)),
    last24Hours: blocksSinceX(blocks, currentDate.setDate(currentDate.getDate() - 1)),
    last7Days: blocksSinceX(blocks, currentDate.setDate(currentDate.getDate() - 7)),
  };

  return { blocks, statistics };
};

module.exports = { collectBlocksData };
