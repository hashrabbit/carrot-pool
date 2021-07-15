const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { _isValidVersion } = require('../../src/redis/is_valid_version');

describe('isValidVersion() - Redis sub-function', () => {
  const logger = { error: sinon.stub().returnsArg(0) };
  const client = sinon.stub();

  describe('when the fetched version is >= number', () => {
    const num = 6.0;
    const fetchVersionNum = sinon.stub().resolves(num);
    const isValidVersion = _isValidVersion({ fetchVersionNum });
    const env = { client, logger };

    it('returns a resolved promise, containing true', () => {
      const promise = isValidVersion(env)(num);
      expect(promise).to.eventually.eql(true);
    });
  });

  describe('when the fetched version is < number', () => {
    const num = 6.0;
    const fetchVersionNum = sinon.stub().resolves(num - 0.1);
    const isValidVersion = _isValidVersion({ fetchVersionNum });
    const env = { client, logger };

    it('returns a rejected promise, with "Redis verison invalid"', () => {
      const promise = isValidVersion(env)(num);
      expect(promise).to.be.rejectedWith(Error, 'Redis version invalid');
    });
  });
});
