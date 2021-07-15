const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { _standard, _cluster } = require('../../src/redis/clients');

describe('standard() - Factory function for standard Redis clients', () => {
  const redis = { createClient: sinon.stub().returnsArg(0) };

  describe('when supplied "host", "port" and "password"', () => {
    const standard = _standard({ redis });
    const args = { host: 1, port: 2, password: '3' };

    it('sends the correct client config to redis.createClient', () => {
      const config = standard(args);
      expect(Object.keys(config)).to.include('password');
    });
  });
});

describe('cluster() - Factory function for clustered Redis clients', () => {
  const redis = { createClient: sinon.stub().returnsArg(0) };
  const RedisClustr = sinon.stub().returnsArg(0);

  describe('when supplied only "host" and "port"', () => {
    const cluster = _cluster({ redis, RedisClustr });
    const args = { host: 1, port: 2 };

    it('sends the correct cluster config to RedisClustr', () => {
      const config = cluster(args);
      expect(Object.keys(config)).to.not.include('redisOptions');
    });
  });
});
