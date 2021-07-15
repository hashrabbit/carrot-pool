const { requireDeps } = require('./require_deps');

const defaultDeps = [
  ['posix', 'posix', false, false],
];

// Wraps a function that would throw on exception to one that returns false on exception
const orFalse = (proc) => (...args) => {
  let result;
  try {
    result = proc(...args);
  } catch {
    result = false;
  }
  return result;
};

// Raises the "nofile" connection limit on POSIX-compatibile operating systems.
const _setPosixLimit = (deps) => ({ baseLogger, isMaster }) => {
  const { posix } = deps;
  const logger = baseLogger.cached('POSIX', 'Connection Limit');

  const setLimit = orFalse(() => {
    posix.setrlimit('nofile', { soft: 100000, hard: 100000 }); // Might throw
    return true;
  });

  const setUid = orFalse((uid) => {
    process.setuid(uid); // Might throw
    return true;
  });

  // If we're not on a POSIX operating system, we log and exit out.
  let msg;
  if (!posix) {
    msg = '(Safe to ignore) POSIX module not installed. Connection limit not raised';
    if (isMaster) logger.debug(msg);
    return false;
  }

  if (!setLimit()) {
    // If we fail, we log the failure with a notice about needing root-level access.
    msg = '(Safe to ignore) Must be a root user to increase file connection limit';
    if (isMaster) logger.warning(msg);

    // If we have a root user's UID, try to switch
    // to that UID then try to raise the file limit.
    const rootUid = parseInt(process.env.SUDO_UID, 10);
    if (!(rootUid && setUid(rootUid) && setLimit())) { return false; }
  }

  msg = `File connection limit, for user: ${process.getuid()}, raised to 100K `;
  logger.debug(msg);
  return true;
};

module.exports = {
  _setPosixLimit,
  setPosixLimit: _setPosixLimit(requireDeps(defaultDeps)),
};
