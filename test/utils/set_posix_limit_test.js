const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { swapProcess, restoreProcess } = require('../helpers');

const { _setPosixLimit } = require('../../src/utils/set_posix_limit');

describe('setPosixLimit() - sets the "nofile" limit for our posix OS', () => {
  let origProcess = {};

  afterEach(() => { restoreProcess(origProcess); });

  describe('when a non-root user sets the limit', () => {
    const posix = {
      setrlimit: sinon.stub().returns(true),
      getrlimit: () => ({ soft: 100000 })
    };
    const setPosixLimit = _setPosixLimit({ posix });
    const logger = { debug: sinon.stub() };
    const baseLogger = { cached: () => logger };
    const isMaster = true;

    const getuid = sinon.stub().returns(1);

    beforeEach(() => { origProcess = swapProcess({ getuid }); });

    it('sets the limit and logs to the debug severity', () => {
      setPosixLimit({ baseLogger, isMaster });
      expect(posix.setrlimit).to.have.been.calledOnce;
      expect(logger.debug).to.have.been.calledOnce;
      expect(logger.debug).to.have.been.calledWithMatch('for user: 1');
    });
  });

  describe('when a non-root user fails to set the limit', () => {
    describe('and SUDO_UID is set', () => {
      const setrlimit = sinon.stub();
      setrlimit.onCall(0).throws('non-root');
      setrlimit.onCall(1).returns(true);
      const posix = { setrlimit, getrlimit: () => ({ soft: 10000 }) };
      const setPosixLimit = _setPosixLimit({ posix });
      const logger = { debug: sinon.stub(), warning: sinon.stub() };
      const baseLogger = { cached: () => logger };
      const isMaster = true;

      const env = { SUDO_UID: 1 };
      const getuid = sinon.stub().returns(1);
      const setuid = sinon.stub().returns(true);

      beforeEach(() => { origProcess = swapProcess({ env, getuid, setuid }); });

      it('sets the limit as the root user', () => {
        setPosixLimit({ baseLogger, isMaster });
        expect(posix.setrlimit).to.have.callCount(2);
        expect(logger.warning).to.have.been.calledOnce;
        expect(logger.debug).to.have.been.calledOnce;
        expect(logger.debug).to.have.been.calledWithMatch('for user: 1');
      });
    });

    describe('and SUDO_UID is not set', () => {
      const setrlimit = sinon.stub();
      setrlimit.onCall(0).throws('non-root');
      const posix = { setrlimit, getrlimit: () => ({ soft: 10000 }) };
      const setPosixLimit = _setPosixLimit({ posix });
      const logger = { debug: sinon.stub(), warning: sinon.stub() };
      const baseLogger = { cached: () => logger };
      const isMaster = true;

      const getuid = sinon.stub().returns(1);
      const setuid = sinon.stub().returns(true);

      beforeEach(() => { origProcess = swapProcess({ getuid, setuid }); });

      it('does not set the "nofile" limit', () => {
        const result = setPosixLimit({ baseLogger, isMaster });
        expect(result).to.eql(false);
        expect(posix.setrlimit).to.have.callCount(1);
        expect(logger.warning).to.have.been.calledOnce;
        expect(logger.debug).not.to.have.been.called;
      });
    });
  });

  describe('when posix module is not present', () => {
    const posix = undefined;
    const setPosixLimit = _setPosixLimit({ posix });
    const logger = { debug: sinon.stub() };
    const baseLogger = { cached: () => logger };
    const isMaster = true;

    it('returns false with a not installed log message', () => {
      const result = setPosixLimit({ baseLogger, isMaster });
      expect(result).to.eql(false);
      expect(logger.debug).to.have.been.calledOnce;
      expect(logger.debug).to.have.been.calledWithMatch('POSIX module not installed');
    });
  });
});
