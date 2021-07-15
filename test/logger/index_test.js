const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { severityFunctions, cachedLogger } = require('../../src/logger/utils');
const { _poolLogger } = require('../../src/logger');

// Provides a properly initialized set of stubs and a logger instance
// with supplied dependencies.
const loggerWithDeps = () => {
  const formatLog = sinon.stub().returnsArg(0);
  const deps = {
    formatLog: () => formatLog,
    utils: { severityFunctions, cachedLogger }
  };
  const PoolLogger = _poolLogger(deps);
  const logger = new PoolLogger({ logLevel: 'warning', tty: false });
  return { formatLog, logger };
};

describe('PoolLogger() - output formatted log messages, from their severity', () => {
  describe('when calling a valid serverity function', () => {
    const { formatLog, logger } = loggerWithDeps();
    const undefItems = { component: undefined, text: undefined, subcat: undefined };
    const items = { severity: 'error', system: 'test', ...undefItems };

    it('correctly calls formatLog to produce the log message', () => {
      logger.error('test');
      expect(formatLog).to.have.been.calledOnceWith(items);
    });
  });

  describe('when calling an invalid serverity function', () => {
    const { logger } = loggerWithDeps();
    const invalid = () => logger.invalid();

    it('throws a TypeError', () => {
      expect(invalid).to.throw(TypeError);
    });
  });

  describe('when using a cached logger', () => {
    const { formatLog, logger } = loggerWithDeps();
    const severity = 'error';
    const [system, component, subcat] = ['sys', 'comp', 'subcat'];
    const cached = logger.cached(system, component, subcat);
    const items = {
      severity, system, component, subcat: 'test', text: 'subcat'
    };

    it('supplies the cached values to the parent logger instance', () => {
      cached[severity]('test');
      expect(formatLog).to.have.been.calledOnceWith(items);
    });
  });
});
