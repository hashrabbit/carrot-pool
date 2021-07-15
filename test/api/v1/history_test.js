const { describe, it } = require('mocha');

const { expect } = require('../../chai-local');
const { responseStub } = require('../../helpers.js');

const { history } = require('../../../src/api/v1/history');

describe('history() - Route handler for the /history endpoint.', () => {
  const poolStats = { stats: { name: 'coin', history: [] } };

  describe('when providing no pool', () => {
    const res = responseStub();
    const req = { query: {} };

    it('sets a 200 status, with empty history payload', () => {
      const result = history({ poolStats })(req, res);
      expect(res.status).to.have.been.calledOnceWith(200);
      expect(result.history).to.eql([]);
    });
  });
});
