const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { _processBlockData } = require('../../src/shares/process_block_data');

// Stub external dependencies with doubles that return their first argument.
const promiseExec = () => sinon.stub().resolvesArg(0);

const processBlockData = _processBlockData({ promiseExec });

describe('processBlockData() - PoolShares.handleShare pipeline function', () => {
  const logger = { error: sinon.stub().returnsArg(0) };
  const coin = 'coin';
  const timestamp = Date.parse('2021-01-10T12:00:00');
  const shareData = { worker: 'AAAAAA', height: 0 };
  const isSoloMining = false;
  const baseEnv = {
    coin, logger, timestamp, shareData, isSoloMining
  };

  describe('for a valid block, not under a redis cluster', () => {
    const isValidBlock = true;
    const isCluster = false;
    const env = { ...baseEnv, isValidBlock };
    const currentShares = {};
    const currentTimes = {};
    const args = { currentShares, currentTimes, isCluster };

    it('sends the correct persistsence commands', async () => {
      const { commands: cmds } = await processBlockData(env)(args);
      const [, , ...cmdNames] = cmds.map((c) => c[0]);
      expect(cmds.length).to.eql(6);
      expect(cmdNames).to.eql(['rename', 'rename', 'sadd', 'hincrby']);
    });
  });

  describe('for a valid block, under a redis cluster', () => {
    const isValidBlock = true;
    const isCluster = true;
    const env = { ...baseEnv, isValidBlock };
    const currentShares = { a: 0 };
    const currentTimes = { a: 0 };
    const args = { currentShares, currentTimes, isCluster };

    it('sends the additional cluster persistsence commands', async () => {
      const { commands: cmds } = await processBlockData(env)(args);
      const [, , ...cmdNames] = cmds.map((c) => c[0]);
      expect(cmds.length).to.eql(8);
      expect(cmdNames).to.eql(['del', 'del', 'hset', 'hset', 'sadd', 'hincrby']);
    });
  });

  describe('for an invalid block', () => {
    const isValidBlock = false;
    const env = { isValidBlock };

    it('sends the increment invalidBlocks persistsence cmd', async () => {
      const { commands: cmds } = await processBlockData(env)({});
      expect(cmds.length).to.eql(1);
      expect(cmds[0][0]).to.eql('hincrby');
      expect(cmds[0][2]).to.eql('invalidBlocks');
    });
  });
});
