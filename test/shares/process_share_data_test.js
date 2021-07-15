const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _processShareData } = require('../../src/shares/process_share_data');

// Stub external dependencies with doubles that return their first argument.
const roundTo = sinon.stub().returnsArg(0);
const promiseExec = () => sinon.stub().resolvesArg(0);

// Allows us to fully isolate the function under test. Producing an actual
// "unit" test of its functionality.
const processShareData = _processShareData({ roundTo, promiseExec });

describe('processShareData() - PoolShares.handleShare pipeline function', () => {
  const logger = { error: sinon.stub().returnsArg(0) };
  const coin = 'coin';
  const timestamp = Date.parse('2021-01-10T12:00:00');
  const shareData = { worker: 'AAAAAA', difficulty: 1.15 };
  const baseEnv = {
    coin, logger, timestamp, shareData
  };
  const isSoloMining = false;
  const startTimes = {};
  const shareTimes = {};
  const currentShares = {};
  const currentTimes = {};

  describe('for a valid share and valid block', () => {
    const isValidShare = true;
    const isValidBlock = true;
    const env = {
      ...baseEnv, isValidShare, isValidBlock, isSoloMining
    };
    const args = {
      startTimes, shareTimes, currentShares, currentTimes
    };

    it('updates passed args and sends correct persistsence cmds', async () => {
      const { commands: cmds } = await processShareData(env)(args);
      expect(Object.keys(currentTimes)).to.eql(['AAAAAA']);
      expect(Object.values(currentShares)).to.eql([1.15]);
      expect(cmds.length).to.eql(3);
    });
  });

  describe('for a valid share and invalid block', () => {
    const isValidShare = true;
    const isValidBlock = false;
    const env = {
      ...baseEnv, isValidShare, isValidBlock, isSoloMining
    };
    const args = {
      startTimes, shareTimes, currentShares, currentTimes
    };

    it('sends additional invalidBlock persistsence cmd', async () => {
      const { commands: cmds } = await processShareData(env)(args);
      expect(cmds.length).to.eql(5);
    });
  });

  describe('for a valid share outside the duration range', () => {
    const isValidShare = true;
    const isValidBlock = true;
    const env = {
      ...baseEnv, isValidShare, isValidBlock, isSoloMining
    };
    const args = {
      startTimes: { AAAAAA: timestamp },
      shareTimes: { AAAAAA: timestamp - 901000 },
      currentShares,
      currentTimes
    };

    it('does not sends worker duration persistsence cmd', async () => {
      const { commands: cmds } = await processShareData(env)(args);
      const durationCmd = cmds.filter((c) => c[2].match(/timesCurrent/));
      expect(durationCmd).to.eql([]);
    });
  });

  describe('for an invalid share', () => {
    const isValidShare = false;
    const isValidBlock = false;
    const env = {
      ...baseEnv, isValidShare, isValidBlock, isSoloMining
    };
    const args = {
      startTimes, shareTimes, currentShares, currentTimes
    };

    it('sends the increment invalidShares persistsence cmd', async () => {
      const { commands: cmds } = await processShareData(env)(args);
      expect(cmds[0][0]).to.eql('hincrby');
      expect(cmds[0][2]).to.eql('invalidShares');
    });
  });
});
