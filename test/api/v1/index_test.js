const { describe, it } = require('mocha');
const express = require('express');

const { chai, expect } = require('../../chai-local');

const { requireDeps } = require('../../../src/utils/require_deps');
const { _defaultDeps, _v1 } = require('../../../src/api/v1');

describe('v1 -- router instance for all v1 routes', () => {
  const poolStats = { stats: { name: 'coin', history: [] } };

  describe('for a valid /history request', () => {
    const deps = requireDeps(_defaultDeps);
    const app = express();

    it('responds with a 200 status and json payload', (done) => {
      _v1(deps)({ poolStats })({ app, prefix: '' });
      chai.request(app)
        .get('/v1/history')
        .query({ pool: 'coin' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(Object.keys(res.body)).to.eql(['endpoint', 'history']);
          done();
        });
    });
  });

  describe('when requesting an invalid route', () => {
    const deps = requireDeps(_defaultDeps);
    const app = express();

    it('responds with a 404 status', (done) => {
      _v1(deps)({ poolStats })({ app, prefix: '' });
      chai.request(app)
        .get('/v1/invalid-route')
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.error).to.eql('Invalid API route');
          done();
        });
    });
  });

  describe('when an asyc request to /wallets succeeds', () => {
    const deps = requireDeps(_defaultDeps);
    const app = express();
    const walletsStub = () => async (req, res) => (
      res.status(200).json({ test: true })
    );
    deps.wallets = walletsStub;

    it('responds with a 200 status', async () => {
      _v1(deps)({ poolStats })({ app, prefix: '' });
      const response = await chai.request(app).get('/v1/wallets');
      expect(response).to.have.status(200);
    });
  });

  describe('when an async request to /wallets fails', () => {
    const deps = requireDeps(_defaultDeps);
    const app = express();
    const walletsStub = () => () => Promise.reject(new Error('Test failed'));
    deps.wallets = walletsStub;
    const error500 = (err, req, res, next) => {
      if (res.headersSent) return next(err);
      return res.status(500).json({ error: err.toString() });
    };

    it('responds with a 500 status', async () => {
      const router = _v1(deps)({ poolStats })({ app, prefix: '' });
      router.use(error500);
      const response = await chai.request(app).get('/v1/wallets');
      expect(response).to.have.status(500);
    });
  });
});
