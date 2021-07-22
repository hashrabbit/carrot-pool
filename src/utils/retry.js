// A function, `retry`, which tries to resolve a promise-producing fn a set number of times.
//
// Promises whose failures return true for a given predicate will be retried.
// Promises which fail for unrelated reasons will be rejected.
// Promises which succeed will be resolved
// If the promise does not succeed after a set number of tries, retry will reject with a RetryError
// containing a list of each failure in order
class RetryError extends Error {
  constructor(n, failures) {
    super(`Attempt failed after ${n} tries.`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.failures = failures;
  }
}

const retry = (n, attemptFn, pred) => {
  let tries = 0;

  return new Promise((resolve, reject) => {
    const attempt = (fn, failures) => {
      if (tries >= n) {
        reject(new RetryError(n, failures));
      } else {
        fn(tries)
          .then(resolve)
          .catch((e) => {
            if (pred(e)) {
              tries += 1;
              failures.push(e);
              attempt(fn, failures);
            } else {
              reject(e);
            }
          });
      }
    };

    attempt(attemptFn, []);
  });
};

module.exports = {
  retry,
  RetryError
};
