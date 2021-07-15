const { requireDeps } = require('../../utils/require_deps');

const _defaultDeps = [
  ['express', 'express', false],
  ['blocks', `${__dirname}/blocks`],
  ['combined', `${__dirname}/combined`],
  ['history', `${__dirname}/history`],
  ['payments', `${__dirname}/payments`],
  ['statistics', `${__dirname}/statistics`],
  ['wallets', `${__dirname}/wallets`],
  ['workers', `${__dirname}/workers`],
];

// Defines the /v1 routes section of our API. This function takes a reference to the
// express app, and a path prefix to mount itself, once all routes have been defined.
// Also defines a 404 route, for this mounted area.
const _v1 = (deps) => (env) => ({ app, prefix = '' }) => {
  const { express, blocks, combined, history, payments,
    statistics, wallets, workers } = deps;
  const router = express.Router();

  router.get('/blocks', blocks(env));
  router.get('/combined', combined(env));
  router.get('/history', history(env));
  router.get('/payments', payments(env));
  router.get('/statistics', statistics(env));
  router.get('/workers', workers(env));

  router.get('/wallets', (req, res, next) => {
    // Directly resolve wallets returned promise, so we can correctly pass errors
    // to next().
    Promise.resolve(wallets(env)(req, res)).catch(next);
  });

  // 404 (Not Found) handler for this route section
  router.use((req, res) => (
    res.status(404).json({ error: 'Invalid API route' })
  ));

  // Mount the router entpoints to our app, at path.
  app.use(`${prefix}/v1`, router);

  return router;
};

module.exports = {
  _defaultDeps,
  _v1,
  v1: _v1(requireDeps(_defaultDeps))
};
