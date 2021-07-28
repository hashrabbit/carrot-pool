const { describe, it, before, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');
const events = require('events');
const { expect } = require('../chai-local');

const { _PoolWorker } = require('../../src/worker');

describe('PoolWorker() - Stratum pool worker thread', () => {
  const poolConfig = { coin: { name: 'carrot' }, rest: '<... some carrot coin config ...>' };
  const portalConfig = '<... some portal config ...>';

  // NOTE(rschifflin): Incredibly hacky. We need to define a property process.send to mock it.
  before(() => {
    if (typeof process.send === 'undefined') {
      Object.defineProperty(process, 'send', {
        writable: true,
        value: () => { throw new Error('Cannot call `send` from a Node process spawned without an IPC channel'); }
      });
    }
  });

  let logger;
  let cachedLogger;
  let stratumStub;
  let sharesStub;
  let sharesStubConstructor;
  let logShareStub;
  let logShareEnvStub;
  let sharesProcessor;
  let poolAuthCallbackEnvStub;
  let poolAuthCallbackStub;
  let stubs;

  beforeEach(() => {
    logger = { cached: sinon.stub() };
    cachedLogger = { debug: sinon.stub() };
    logger.cached.returns(cachedLogger);

    stratumStub = {
      daemon: { cmd: sinon.stub() },
      createPool: sinon.stub()
    };
    sharesStub = sinon.stub();
    sharesProcessor = { handleShare: sinon.stub().resolves(true) };
    sharesStub.returns(sharesProcessor);
    sharesStubConstructor = function (...args) { return sharesStub(...args); };
    logShareStub = sinon.stub();
    logShareEnvStub = sinon.stub().returns(logShareStub);
    poolAuthCallbackStub = sinon.stub();
    poolAuthCallbackEnvStub = sinon.stub().returns(poolAuthCallbackStub);

    stubs = {
      Stratum: stratumStub,
      PoolShares: sharesStubConstructor,
      poolAuthCallback: poolAuthCallbackEnvStub,
      logShare: logShareEnvStub
    };
  });

  describe('With a stratum pool', () => {
    let PoolWorker;
    let pool;

    beforeEach(() => {
      pool = {
        start: sinon.stub(),
        stratumServer: { addBannedIP: sinon.stub() }
      };
      Object.setPrototypeOf(pool, events.EventEmitter.prototype);

      stratumStub.createPool.returns(pool);
      PoolWorker = _PoolWorker(stubs);
      new PoolWorker({ baseLogger: logger, poolConfig, portalConfig });
    });

    describe('#new', () => {
      it('creates the pool with the appropriate args', () => {
        const args = [poolConfig, poolAuthCallbackStub, logger];
        expect(stratumStub.createPool).to.have.been.calledWith(...args);
      });

      it('starts the pool', () => {
        expect(pool.start).to.have.been.calledOnce;
      });
    });

    describe('on difficulty update', () => {
      const workerName = '<some worker name>';
      const newDiff = '<some new diff>';

      it('logs the difficulty update', () => {
        pool.emit('difficultyUpdate', workerName, newDiff);
        expect(cachedLogger.debug).to.have.been.calledOnce;
        expect(cachedLogger.debug.getCall(0).args[0]).to.include('Difficulty update');
        expect(cachedLogger.debug.getCall(0).args[0]).to.include(workerName);
        expect(cachedLogger.debug.getCall(0).args[0]).to.include(newDiff);
      });
    });

    describe('on log', () => {
      const severity = '<some severity>';
      const logText = '<some log text>';

      beforeEach(() => {
        cachedLogger = { [severity]: sinon.stub() };
        logger.cached.returns(cachedLogger);
        pool = { start: sinon.stub() };
        Object.setPrototypeOf(pool, events.EventEmitter.prototype);

        stratumStub.createPool = sinon.stub();
        stratumStub.createPool.returns(pool);
        PoolWorker = _PoolWorker(stubs);
        new PoolWorker({ baseLogger: logger, poolConfig, portalConfig });
      });

      it('logs the given text at the given severity', () => {
        pool.emit('log', severity, logText);
        expect(cachedLogger[severity]).to.have.been.calledWith(logText);
      });
    });

    describe('on banIP', () => {
      const ip = '<some IP to ban>';
      const worker = '<presumably some worker to ban>';

      beforeEach(() => {
        sinon.stub(process, 'send');
        Object.setPrototypeOf(pool, events.EventEmitter.prototype);
      });

      afterEach(() => {
        process.send.restore;
      });

      it('sends the IP up to the main thread to add to all workers ban list', () => {
        pool.emit('banIP', ip, worker);
        expect(process.send).to.have.been.calledWith({ type: 'banIP', ip });
      });
    });

    describe('When the primary process emits a banIP message to this worker', () => {
      const ip = '<some IP to ban>';

      it('Adds the banned ip to the stratum server for the pool worker', () => {
        process.emit('message', { type: 'banIP', ip });
        expect(pool.stratumServer.addBannedIP).to.have.been.calledWith(ip);
      });
    });

    describe('on share', () => {
      let isValidShare;
      let isValidBlock;
      let shareData;

      beforeEach(() => {
        isValidShare = true;
        isValidBlock = true;
        shareData = {};
      });

      it('forwards the share data to the share logger', () => {
        pool.emit('share', isValidShare, isValidBlock, shareData);
        const args = [isValidShare, isValidBlock, shareData];
        expect(logShareEnvStub).to.have.been.calledWith({ logger: cachedLogger });
        expect(logShareStub).to.have.been.calledWith(...args);
      });

      it('forwards the share data to the shares processor', () => {
        pool.emit('share', isValidShare, isValidBlock, shareData);
        const args = { isValidShare, isValidBlock, shareData };
        expect(sharesProcessor.handleShare).to.have.been.calledWith(args);
      });
    });
  });
});
