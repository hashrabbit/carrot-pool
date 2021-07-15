const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../chai-local');

const { retry, RetryError } = require('../../src/utils/retry.js');

describe('Retry', () => {
  const bad = new Error('bad');
  const bads = [new Error('bad0'), new Error('bad1'), new Error('bad2')];
  let attemptStub;
  let predStub;

  beforeEach(() => {
    attemptStub = sinon.stub();
    predStub = sinon.stub();
  });

  describe('when given 0 tries', () => {
    it('Immediately fails with a RetryError', () => {
      const msg = 'Attempt failed after 0 tries';
      const promise = retry(0, attemptStub, predStub);
      return expect(promise).to.eventually.have.been.rejectedWith(msg).then((e) => {
        expect(attemptStub).not.to.have.been.called;
        expect(e).to.be.an.instanceof(RetryError);
        expect(e.failures).to.eql([]);
      });
    });
  });

  describe('when given several tries', () => {
    let n;
    beforeEach(() => {
      n = 5;
    });

    describe('with a fn that initially resolves', () => {
      beforeEach(() => {
        attemptStub.resolves('good');
      });

      it('resolves to the resolved promise returned by the fn', () => {
        const promise = retry(n, attemptStub, predStub);
        return expect(promise).to.eventually.eql('good');
      });

      it('only calls the fn once with the value of the try count', () => {
        const promise = retry(n, attemptStub, predStub);
        const pending = promise.then(() => attemptStub.getCall(0).args[0]);
        return expect(pending).to.eventually.eql(0).then(() => {
          expect(attemptStub).to.have.been.calledOnce;
        });
      });
    });

    describe('with a fn that initially rejects', () => {
      beforeEach(() => {
        attemptStub.rejects(bad);
      });

      it('tests the retry predicate with the failure', () => {
        const promise = retry(n, attemptStub, predStub);
        return expect(promise).to.eventually.be.rejected.then((err) => {
          expect(predStub).to.have.been.calledWith(err);
        });
      });

      describe('and the retry predicate does not match the failure', () => {
        beforeEach(() => {
          predStub.returns(false);
        });

        it('rejects with the failure of the fn', () => {
          const promise = retry(n, attemptStub, predStub);
          return expect(promise).to.eventually.be.rejectedWith('bad');
        });
      });

      describe('and the retry predicate matches the failure', () => {
        beforeEach(() => {
          predStub.returns(true);
        });

        describe('when the attempt fn eventually succeeds', () => {
          beforeEach(() => {
            attemptStub.onCall(0)
              .rejects(bad)
              .onCall(1)
              .rejects(bad)
              .onCall(2)
              .rejects(bad)
              .onCall(3)
              .resolves('good');
          });

          it('tries the fn until success, passing the try count as an arg', () => {
            const promise = retry(n, attemptStub, predStub);

            return expect(promise).to.eventually.eql('good').then(() => {
              expect(attemptStub).to.have.callCount(4);
              expect(attemptStub.getCall(0).args[0]).to.eql(0);
              expect(attemptStub.getCall(1).args[0]).to.eql(1);
              expect(attemptStub.getCall(2).args[0]).to.eql(2);
              expect(attemptStub.getCall(3).args[0]).to.eql(3);
            });
          });
        });

        describe('when the attempt runs out of tries before succeeding', () => {
          beforeEach(() => {
            n = 3;
            attemptStub.onCall(0)
              .rejects(bads[0])
              .onCall(1)
              .rejects(bads[1])
              .onCall(2)
              .rejects(bads[2])
              .onCall(3)
              .resolves('good');
          });

          it('tries the fn until out of tries, passing the try count as an arg', () => {
            const promise = retry(n, attemptStub, predStub);
            return expect(promise).to.eventually.be.rejected.then(() => {
              expect(attemptStub).to.have.callCount(3);
              expect(attemptStub.getCall(0).args[0]).to.eql(0);
              expect(attemptStub.getCall(1).args[0]).to.eql(1);
              expect(attemptStub.getCall(2).args[0]).to.eql(2);
            });
          });

          it('returns a RetryError with the failures', () => {
            const msg = 'Attempt failed after 3 tries.';
            const promise = retry(n, attemptStub, predStub);
            return expect(promise).to.eventually.be.rejectedWith(msg).then((e) => {
              expect(e).to.be.an.instanceof(RetryError);
              expect(e.failures[0].message).to.include('bad0');
              expect(e.failures[1].message).to.include('bad1');
              expect(e.failures[2].message).to.include('bad2');
            });
          });
        });

        describe('when the predicate fails to match before a try succeeds', () => {
          beforeEach(() => {
            n = 5;
            attemptStub.onCall(0)
              .rejects(bads[0])
              .onCall(1)
              .rejects(bads[1])
              .onCall(2)
              .rejects(bads[2])
              .onCall(3)
              .resolves('good');

            predStub.onCall(0).returns(true)
              .onCall(1)
              .returns(true)
              .onCall(2)
              .returns(false);
          });

          it('tries the fn until the predicate fails, passing the try count as an arg', () => {
            const promise = retry(n, attemptStub, predStub);
            return expect(promise).to.eventually.be.rejected.then(() => {
              expect(attemptStub).to.have.callCount(3);
              expect(attemptStub.getCall(0).args[0]).to.eql(0);
              expect(attemptStub.getCall(1).args[0]).to.eql(1);
              expect(attemptStub.getCall(2).args[0]).to.eql(2);
            });
          });

          it('fails with the error that failed the predicate', () => {
            const promise = retry(n, attemptStub, predStub);
            return expect(promise).to.eventually.be.rejectedWith('bad2');
          });
        });
      });
    });
  });
});
