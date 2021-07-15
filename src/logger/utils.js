const severityColor = (name) => {
  const severityMap = {
    special: ['cyan', 'underline'],
    debug: ['green'],
    warning: ['yellow'],
    error: ['red']
  };

  const color = severityMap[name] || [];
  // TODO: I think we need a cleaner way to handle unknown log severity levels.
  // Possiby throwing an error, or if we managed to switch to a more Result-style,
  // this should probably return a Failure object.
  if (color.length === 0) {
    color.push('italic');
    console.log(`Unknown severity: ${name}`);
  }
  return color;
};

// Dynamically defines methods, on the supplied logger, corresponding to each
// named severity level. That severity level is added to the front of the array
// of arguments, and then sent to an "apply"-ed version of the base log function.
const severityFunctions = ({ logger, severityLevels }) => (log) => {
  Object.keys(severityLevels).forEach((severity) => {
    logger[severity] = (...args) => {
      args.unshift(severity);
      return log.apply(this, args);
    };
  });
};

// A constructor function that provides caching of the "system", "component", and
// "subcat" arguemnts that are regulary repeated when a module is outputting log
// messages. We initialize our constructor with the severiyLevels, and the logger
// instance requesting the caching service.
const cachedLogger = (env) => function (system, component, subcat) {
  const _this = this;
  const { severityLevels, logger } = env;

  Object.keys(severityLevels).forEach((logType) => {
    _this[logType] = function (...args) {
      if (subcat) args = [subcat, ...args];
      logger[logType](system, component, ...args);
    };
  });
};

module.exports = {
  severityColor,
  severityFunctions,
  cachedLogger,
};
