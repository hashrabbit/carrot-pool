const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { _fetchVersionNum } = require('../../src/redis/fetch_version_num');

describe('fetchVersionNum() - Redis sub-function', () => {
  const logger = { error: sinon.stub().returnsArg(0) };
  const client = sinon.stub();

  describe('when the server provides a version number', () => {
    const infoReturn = 'foo:bar\r\nredis_version:6.0.9\r\n';
    const promiseInfo = () => sinon.stub().resolves(infoReturn);
    const promiseCmd = () => promiseInfo;
    const fetchVersionNum = _fetchVersionNum({ promiseCmd });

    it('returns a resolved promise, containing a parseFloat of the version', () => {
      const promise = fetchVersionNum({ logger, client });
      expect(promise).to.eventually.eql(6.0);
    });
  });

  describe('when the server fails to provide a version number', () => {
    const infoReturn = 'foo:bar\r\n';
    const promiseInfo = () => sinon.stub().resolves(infoReturn);
    const promiseCmd = () => promiseInfo;
    const fetchVersionNum = _fetchVersionNum({ promiseCmd });

    it('returns a resolved promise, containing false', () => {
      const promise = fetchVersionNum({ logger, client });
      expect(promise).to.eventually.eql(false);
    });
  });

  describe('when fetching Redis info fails', () => {
    const infoError = new Error('infoError');
    const promiseInfo = () => sinon.stub().rejects(infoError);
    const promiseCmd = () => promiseInfo;
    const fetchVersionNum = _fetchVersionNum({ promiseCmd });

    it('returns a rejected promise', () => {
      const promise = fetchVersionNum({ logger, client });
      expect(promise).to.be.rejectedWith(Error, 'infoError');
    });
  });
});
