const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { responseStub } = require('../../helpers.js');

const { _wallets } = require('../../../src/api/v1/wallets');

describe('wallets() - Route handler for the /wallets endpoint.', () => {
  const collectBlocksData = sinon.stub().returns({ blocks: [] });
  const collectPaymentsData = sinon.stub().returns({ payments: [] });
  const collectWorkersData = sinon.stub().returns({ workers: [] });
  const deps = { collectBlocksData, collectPaymentsData, collectWorkersData };
  const balances = {
    totalBalance: 0.111, totalImmature: 0, totalPaid: 0.222, totalUnpaid: 0
  };
  const getBalanceByAddress = sinon.stub().resolves({ balances });
  const poolStats = {
    getBalanceByAddress,
    stats: {
      name: 'coin',
      statistics: {},
      hashrate: {},
      workers: {}
    }
  };
  const wallets = _wallets(deps)({ poolStats });

  describe('when providing a worker address', () => {
    const res = responseStub();
    const req = { query: { worker: 'worker' } };

    it('sets a 200 status, with the wallets payload', async () => {
      const result = await wallets(req, res);

      expect(res.status).to.have.been.calledOnceWith(200);
      expect(result.wallets).to.include({ total: '0.33300000' });
    });
  });

  describe('when not providing a worker address', () => {
    const res = responseStub();
    const req = { query: {} };

    it('sets a 400 status, returning an Invalid "worker" error', async () => {
      const result = await wallets(req, res);

      expect(res.status).to.have.been.calledOnceWith(400);
      expect(result.error).to.include('Invalid "worker" parameter');
    });
  });
});
