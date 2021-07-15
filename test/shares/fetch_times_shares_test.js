const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { _fetchTimesShares } = require('../../src/shares/fetch_times_shares');

describe('fetchTimesShares() - PoolShares.handleShare pipeline function', () => {
  const logger = { error: sinon.stub().returnsArg(0) };
  const coin = 'coin';

  describe('when the client retrieves data successfully', () => {
    const timesCurrent = { address: 111 };
    const execReturn = [undefined, undefined, undefined, timesCurrent];
    const promiseExec = () => sinon.stub().resolves(execReturn);
    const fetchTimesShares = _fetchTimesShares({ promiseExec });

    it('returns the retrieved sharesData object', async () => {
      const sharesData = await fetchTimesShares({ logger, coin });
      expect(Object.keys(sharesData)).to.eql(
        ['startTimes', 'shareTimes', 'currentShares', 'currentTimes']
      );
      expect(sharesData.currentTimes).to.deep.equal(timesCurrent);
    });
  });
});
