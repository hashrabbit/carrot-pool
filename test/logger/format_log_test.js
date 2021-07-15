const { describe, it } = require('mocha');
const sinon = require('sinon');
const dateFormat = require('dateformat');

const { expect } = require('../chai-local');
const { _formatLog } = require('../../src/logger/format_log');

describe('formatLog() - formatting/combining log message items', () => {
  const colorizeLog = sinon.stub().returnsArg(0);
  const formatLog = _formatLog({ dateFormat, colorizeLog });
  const [system, component, text, subcat] = ['test', 'one', 'two', 'three'];

  describe('when the severity equals the level', () => {
    const env = { severityLevels: { error: 4 }, level: 4 };
    const severity = 'error';
    const args = {
      severity, system, component, text, subcat
    };
    const logPat = new RegExp(`\\(${text}\\) ${subcat}`);

    it('returns a properly formatted log string', () => {
      const log = formatLog(env)(args);
      expect(log).to.match(logPat);
    });
  });

  describe('when the severity is below the level', () => {
    const env = { severityLevels: { warning: 3 }, level: 4 };
    const severity = 'warning';
    const args = { severity };

    it('returns false', () => {
      const log = formatLog(env)(args);
      expect(log).to.eql(false);
    });
  });
});
