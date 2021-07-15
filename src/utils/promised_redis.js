const { promisify } = require('util');

const errorMessage = (what, where) => `Redis ${what} Failed: ${where}`;

const failed = ({ logger, failMsg }) => (err) => {
  const msg = `${failMsg}: ${err.toString()}`;
  logger.error(msg);
  throw new Error(msg);
};

const promiseCmd = (name) => ({ client, logger }) => ({ args, fullName, failMsg }) => {
  const promise = promisify(client[name]).bind(client);
  failMsg = `Redis ${fullName || name} Failed: ${failMsg}`;
  return promise(...args).catch(failed({ logger, failMsg }));
};

// TODO: Refactor to use promiseCmd to wrap exec
const promiseExec = ({ client, logger }) => ({ commands, failMsg }) => {
  const name = 'exec';
  failMsg = errorMessage(name, failMsg);
  const multi = client.multi(commands);
  return promiseCmd(name)({ client: multi, logger })({ args: [], failMsg });
};

module.exports = {
  promiseCmd,
  promiseExec,
};
