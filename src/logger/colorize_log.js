const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['colors', 'colors/safe', false],
  ['severityColor', `${__dirname}/utils`]
];

// Uses the colors module to apply TTY-based colors and styles to the individual
// log message items. Each item can have a separate color/style applied, with
// ts (timestamp) and system getting their color from the log severity.
const _colorizeLog = (deps) => (severity, items) => {
  const { colors, severityColor } = deps;
  const colorValue = severityColor(severity);

  colors.setTheme({
    ts: [...colorValue, 'italic'],
    system: [...colorValue, 'italic'],
    component: 'italic',
    text: 'grey',
    subcat: ['grey', 'bold'],
  });
  Object.entries(items).forEach(([key, value]) => {
    if (value) items[key] = colors[key](value);
  });
};

module.exports = {
  _colorizeLog,
  colorizeLog: _colorizeLog(requireDeps(defaultDeps))
};
