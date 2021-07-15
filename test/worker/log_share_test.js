const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const { expect } = require('../chai-local');

const { logShare } = require('../../src/worker/log_share');

describe('logShare - Logging behavior for submitted shares', () => {
  let onLogShare;
  let logger;
  let isValidShare;
  let isValidBlock;
  let data;

  beforeEach(() => {
    logger = { debug: sinon.stub() };
    onLogShare = logShare({ logger });

    isValidShare = true;
    isValidBlock = true;
    data = {};
  });

  describe('when the blockhash is present but invalid', () => {
    beforeEach(() => {
      data = { blockHash: '<some blockhash>' };
      isValidBlock = false;
    });

    it('notifies us that assumed valid block data was actually rejected', () => {
      onLogShare(isValidShare, isValidBlock, data);
      expect(logger.debug).to.have.been.called;
      expect(logger.debug.getCall(0).args[0]).to.include('rejected');
    });
  });

  describe('when the blockhash is valid', () => {
    const blockHash = '<some blockhash>';
    const worker = '<some worker>';
    beforeEach(() => { data = { blockHash, worker }; });

    it('notifies us that a block was found', () => {
      onLogShare(isValidShare, isValidBlock, data);
      expect(logger.debug).to.have.been.called;
      expect(logger.debug.getCall(0).args[0]).to.include('Block found');
      expect(logger.debug.getCall(0).args[0]).to.include(blockHash);
      expect(logger.debug.getCall(0).args[0]).to.include(worker);
    });
  });

  describe('when the share is invalid', () => {
    beforeEach(() => { isValidShare = false; });

    it('notifies us that the share was rejected', () => {
      onLogShare(isValidShare, isValidBlock, data);
      expect(logger.debug).to.have.been.called;
      expect(logger.debug.getCall(1).args[0]).to.include('Share rejected');
    });
  });

  describe('when the share is valid', () => {
    it('notifies us that the share was accepted', () => {
      onLogShare(isValidShare, isValidBlock, data);
      expect(logger.debug).to.have.been.called;
      expect(logger.debug.getCall(1).args[0]).to.include('Share accepted');
    });
  });
});
