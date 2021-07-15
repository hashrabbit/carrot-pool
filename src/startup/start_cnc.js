const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['cluster', 'cluster', false],
  ['PoolCnC', `${__dirname}/../cnc`]
];

// Supervisor function for our Command/Control server. Listens for event messages
// sent from the server instance and processes them.
const _startCnC = (deps) => ({ portalConfig, baseLogger }) => {
  const { cluster, PoolCnC } = deps;
  const logger = baseLogger.cached('Startup', 'CnC');

  // TODO: Rename this server config entry to 'controlPort' or 'commandPort'
  const { cliPort: port } = portalConfig;

  // Initialize our Command/Control server instance
  const cnc = new PoolCnC(port);

  // Handle 'log' events. Output the { [severity] : text } through our logger
  cnc.on('log', (severity, text) => { logger[severity](text); });

  // Handle 'command' events. Process the named command, if known, or return an error.
  cnc.on('command', (command, params, options, reply) => {
    switch (command) {
      case 'reloadpool':
        Object.values(cluster.workers).forEach((worker) => {
          worker.send({ type: 'reloadpool', coin: params[0] });
        });
        reply(`reloaded pool ${params[0]}`);
        break;
      default:
        reply(`unknown command: ${command}`);
        break;
    }
  });

  // Launch the Command/Control server
  cnc.listen();
};

module.exports = {
  _startCnC,
  startCnC: _startCnC(requireDeps(defaultDeps))
};
