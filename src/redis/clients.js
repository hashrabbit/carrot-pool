const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['redis', 'redis', false],
  ['RedisClustr', 'redis-clustr', false],
];

// Returns a standard (non-cluster) Redis client
const _standard = ({ redis }) => ({ host, port, password = '' }) => {
  const args = { port, host };
  if (password !== '') args.password = password;
  return redis.createClient(args);
};

// Returns a RedisClustr client
const _cluster = (deps) => ({ host, port, password = '' }) => {
  const { redis, RedisClustr } = deps;
  const servers = [{ host, port }];

  const createClient = (cPort, cHost, options) => {
    const args = { host: cHost, port: cPort };
    if (options) args.password = options.password;
    return redis.createClient(args);
  };
  const clusterArgs = { servers, createClient };
  const redisOptions = { password };
  if (password !== '') clusterArgs.redisOptions = redisOptions;
  return new RedisClustr(clusterArgs);
};

module.exports = {
  _standard,
  _cluster,
  standard: _standard(requireDeps(defaultDeps)),
  cluster: _cluster(requireDeps(defaultDeps))
};
