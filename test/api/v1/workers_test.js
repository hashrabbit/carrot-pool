const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { responseStub } = require('../../helpers.js');

const utils = require('../../../src/api/v1/utils');
const { _workers } = require('../../../src/api/v1/workers');

describe('workers() - Route handler for the /workers endpoint.', () => {
  const collectWorkersData = sinon.stub().returns({ workers: [] });
  const poolStats = { stats: { name: 'coin' } };
  const workers = _workers({ collectWorkersData, utils })({ poolStats });

  describe('when providing no pool', () => {
    const res = responseStub();
    const req = { query: {} };

    it('sets a 200 status, with empty workers payload', () => {
      const result = workers(req, res);
      expect(res.status).to.have.been.calledOnceWith(200);
      expect(result.workers).to.eql([]);
    });
  });
});
