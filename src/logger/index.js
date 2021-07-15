const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['formatLog', `${__dirname}/format_log`],
  ['utils', `${__dirname}/utils`, false],
];

const severityLevels = {
  debug: 1, warning: 2, error: 3, special: 4
};

// Pool Logger
const _poolLogger = (deps) => function ({ logLevel, logColors, tty = true }) {
  const { formatLog, utils: { severityFunctions, cachedLogger } } = deps;
  const level = severityLevels[logLevel];
  const env = { severityLevels, level, logColors };

  // Base Logging Functon
  const log = (severity, system, component, text, subcat) => {
    const logString = formatLog(env)({
      severity, system, component, text, subcat
    });

    // Print Formatted Logger Message
    if (tty) console.log(logString);
    return (logString);
  };

  // Add severity functions
  const _this = this;
  env.logger = _this;
  severityFunctions(env)(log);

  this.cached = (system, component, subcat) => {
    const CachedLogger = cachedLogger(env);
    return new CachedLogger(system, component, subcat);
  };
};

// Export Pool Logger
module.exports = {
  _poolLogger,
  PoolLogger: _poolLogger(requireDeps(defaultDeps)),
};
