const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['clients', `${__dirname}/clients`, false],
  ['isValidVersion', `${__dirname}/is_valid_version`],
];

const attachEvents = (env) => (client) => {
  const { logger, config } = env;

  // Add event listeners
  client.on('ready', () => {
    logger.debug(`Share processing setup with redis (${config.host}:${config.port})`);
  }).on('error', (error) => {
    logger.error(`Redis client had an error: ${error.toString()}`);
  }).on('end', () => {
    logger.error('Connection to redis database has been ended');
  });
  return client;
};

// Wrapper function/constructor for our Redis client instance. Provides both a "plain"
// client, as well as one with several event listeners that output log messages.
const _redis = (deps) => function (config) {
  const { clients, isValidVersion } = deps;

  // Assign our client property to either a standard, or cluster-ed, setup.
  this.client = config.cluster ? clients.cluster(config) : clients.standard(config);

  const _this = this;

  // Attaches the "standard" event listeners to our initialized client.
  // To maintain existing compatibility, we hardcode the 2.6 minumumum version.
  // Throws errors if the Redis version is invalid.
  this.attachEvents = (logger) => {
    isValidVersion({ client: _this.client, logger })(2.6).then(() => {});
    _this.client = attachEvents({ logger, config })(_this.client);
  };
};

module.exports = {
  _redis,
  Redis: _redis(requireDeps(defaultDeps))
};
