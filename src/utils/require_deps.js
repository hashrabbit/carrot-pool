// Provides a mechanism for specifying a module's dependencies, in a manner
// that allows for overrides, much like traditional dependency injection.
// Dependencies are provided as an array of arrays, where each element is a
// series of arguments that determine how a given dependecy will be loaded.
//
// Dependencies can be a key in a module object, or a reference to an entire
// module. You can also choose to supress the normal exception that is thrown
// when the specified dependency path is invalid.
const requireDeps = (deps) => {
  /* eslint-disable import/no-dynamic-require */
  const safeRequire = (path, reThrow = true) => {
    try {
      return require(path);
    } catch (e) {
      if (reThrow) throw e;
      return undefined;
    }
  };

  const resolveDep = ([name, path, isKey = true, shouldThrow = true]) => {
    let dep = safeRequire(path, shouldThrow);
    if (isKey && !dep) dep = {};
    return { [name]: isKey ? dep[name] : dep };
  };

  return deps.reduce((acc, args) => ({ ...acc, ...resolveDep(args) }), {});
};

module.exports = { requireDeps };
