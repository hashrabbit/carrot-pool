const { describe, it } = require('mocha');
const sinon = require('sinon');
const { promisify } = require('util');

const { expect } = require('../chai-local');
const { logger } = require('../helpers');

const { _daemonWrapper } = require('../../src/daemon');

describe('DaemonWrapper() -- wraps Stratum daemon interface in promises', () => {
  const daemonStub = {
    batchCmd: () => {},
    cmd: (m, p, c, _s, _r) => c(m)
  };
  const Interface = sinon.stub();
  const validateAddress = () => sinon.stub();
  const deps = { promisify, Interface, validateAddress };
  const DaemonWrapper = _daemonWrapper(deps);

  it('correctly wraps the daemon cmd function', async () => {
    const wrapper = new DaemonWrapper(daemonStub, logger);
    const batch = await wrapper.rpcCmd(1);
    expect(batch).to.eql(1);
  });
});
