const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['dateFormat', 'dateformat', false],
  ['colorizeLog', `${__dirname}/colorize_log`]
];

// Takes the log message items, colorizes them, if necessary, and then returns
// a joined message string, representing the log's output.
const _formatLog = (deps) => (env) => (args) => {
  const { dateFormat, colorizeLog } = deps;
  const { severityLevels, level, logColors } = env;
  const { severity, system, component } = args;
  let { text, subcat } = args;

  // Only report logs at or above the overall severity level
  if (severityLevels[severity] < level) return false;

  const ts = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');

  // If the "subcat" argument is supplied, it, positionally, represents the "text"
  // argument, and vice-versa. This swaps their values.
  if (subcat) [subcat, text] = [text, subcat];

  // Decorate component and subcat (if present), prior to colorizing.
  const items = {
    ts,
    system,
    component: `[${component}]`,
    text
  };
  if (subcat) items.subcat = `(${subcat})`;

  if (logColors) colorizeLog(severity, items);

  // Join the items into a single string, for output. Making sure to place the subcat
  // vaule *before* the text value, if present.
  let formatted = `${items.ts} ${items.system}\t${items.component} `;
  formatted += subcat ? `${items.subcat} ${items.text}` : `${items.text}`;

  return formatted;
};

module.exports = {
  _formatLog,
  formatLog: _formatLog(requireDeps(defaultDeps))
};
