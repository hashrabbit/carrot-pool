const { describe, it } = require('mocha');

const { expect } = require('../chai-local');
const { requireDeps } = require('../../src/utils/require_deps');

describe('requireDeps() - Utility for specifying overridable dependencies', () => {
  describe('when the dependency is a key in an object', () => {
    const deps = [['keyDep', `${__dirname}/key_dep`, true]];

    it('the deps entry directly references the inner function', () => {
      const result = requireDeps(deps);
      expect(Object.keys(result)).to.eql(['keyDep']);
      expect(result.keyDep()).to.eql('keyDep');
    });
  });

  describe('when the dependency is a module object', () => {
    const deps = [['keyDep', `${__dirname}/key_dep`, false]];

    it('deps entry is an object that references the dep function', () => {
      const result = requireDeps(deps);
      expect(Object.keys(result.keyDep)).to.eql(['keyDep']);
    });
  });

  describe('when the dependency reference is invalid', () => {
    describe('and the "throw" flag is set to false', () => {
      const deps = [['keyDep', `${__dirname}/invalid`, true, false]];

      it('sets the named dep entry to undefined', () => {
        const result = requireDeps(deps);
        expect(Object.keys(result)).to.eql(['keyDep']);
        expect(result.keyDep).to.eql(undefined);
      });
    });
  });
});
