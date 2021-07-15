const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { responseStub } = require('../../helpers.js');

const utils = require('../../../src/api/v1/utils');
const { _payments } = require('../../../src/api/v1/payments');

describe('payments() - Route handler for the /payments endpoint.', () => {
  const collectPaymentsData = sinon.stub().returns({ payments: [] });
  const poolStats = { stats: { name: 'coin' } };
  const payments = _payments({ collectPaymentsData, utils })({ poolStats });

  describe('when providing no pool', () => {
    const res = responseStub();
    const req = { query: {} };

    it('sets a 200 status, with empty payments payload', () => {
      const result = payments(req, res);
      expect(res.status).to.have.been.calledOnceWith(200);
      expect(result.payments).to.eql([]);
    });
  });
});
