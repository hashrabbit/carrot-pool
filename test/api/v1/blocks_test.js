const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');
const { responseStub } = require('../../helpers.js');

const utils = require('../../../src/api/v1/utils');
const { _blocks } = require('../../../src/api/v1/blocks');

describe('blocks() - Route handler for the /blocks endpoint.', () => {
  const collectBlocksData = sinon.stub().returns({ blocks: [] });
  const poolStats = { stats: { name: 'coin' } };
  const blocks = _blocks({ collectBlocksData, utils })({ poolStats });

  describe('when providing no pool', () => {
    const res = responseStub();
    const req = { query: {} };

    it('sets a 200 status, with empty blocks payload', () => {
      const result = blocks(req, res);
      expect(res.status).to.have.been.calledOnceWith(200);
      expect(result.blocks).to.eql([]);
    });
  });

  describe('when the provided pool does not match', () => {
    const res = responseStub();
    const req = { query: { pool: 'invalid' } };

    it('sets a 400 status, with error payload', () => {
      const result = blocks(req, res);
      expect(res.status).to.have.been.calledOnceWith(400);
      expect(Object.keys(result)).to.eql(['endpoint', 'error']);
    });
  });
});
