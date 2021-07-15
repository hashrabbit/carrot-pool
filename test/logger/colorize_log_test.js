const { describe, it } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');
const { _colorizeLog } = require('../../src/logger/colorize_log');

describe('colorizeLog() - color/styling for log message items', () => {
  const severityColor = () => ['green'];
  const colors = {
    setTheme: sinon.stub().returns(true),
    system: sinon.stub().returnsArg(0),
  };
  const colorizeLog = _colorizeLog({ colors, severityColor });
  const items = { system: 'test' };

  it('applies the correct colors/styling', () => {
    colorizeLog('error', items);
    expect(colors.setTheme).to.have.callCount(1);
    expect(colors.system).to.have.been.calledWith('test');
  });
});
