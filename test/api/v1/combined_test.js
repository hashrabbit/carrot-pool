const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { responseStub } = require('../../helpers.js');

const utils = require('../../../src/api/v1/utils');
const { _combined } = require('../../../src/api/v1/combined');

describe('combined() - Route handler for the /combined endpoint.', () => {
  const empty = [];
  const collectBlocksData = sinon.stub().returns({ blocks: [] });
  const collectPaymentsData = sinon.stub().returns({ payments: [] });
  const collectWorkersData = sinon.stub().returns({ workers: empty });
  const deps = {
    collectBlocksData, collectPaymentsData, collectWorkersData, utils
  };
  const poolStats = {
    stats: {
      name: 'coin',
      statistics: {},
      hashrate: {},
      workers: {}
    }
  };
  const combined = _combined(deps)({ poolStats });

  describe('when providing the correct pool', () => {
    const res = responseStub();
    const req = { query: { pool: 'coin' } };

    it('sets a 200 status, with the combined payload', () => {
      const result = combined(req, res);

      expect(res.status).to.have.been.calledOnceWith(200);
      expect(result.combined).to.include({ pool: 'coin', workers: empty });
    });
  });
});
