const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const { expect } = require('../../chai-local');

const { sendRedisCommands } = require('../../../src/payments/manage_sent_payments/send_redis_commands');

describe('sendRedisCommands()', () => {
  const logger = { error: sinon.stub() };
  const emptyPaymentMode = '';
  const coin = 'carrot';

  let env;
  let redisStub;
  let execStub;
  let loggerStub;
  let fsStub;
  let signalStop;

  beforeEach(() => {
    redisStub = { multi: sinon.stub() };
    execStub = { exec: sinon.stub() };
    execStub.exec.onCall(0).callsArgWith(0, null, 'redis succeeded');
    redisStub.multi.returns(execStub);
    loggerStub = { error: sinon.stub() };
    fsStub = { writeFile: sinon.stub() };
    signalStop = sinon.stub();

    env = {
      coin,
      logger,
      paymentMode: emptyPaymentMode,
      client: redisStub,
      fs: fsStub,
      signalStop,
    };
  });

  describe('with no commands', () => {
    it('resolves successfully', () => expect(sendRedisCommands(env)([])).to.eventually.eql(null));
  });

  describe('with commands', () => {
    const commands = ['cmd:1', 'cmd:2', 'cmd:3'];
    describe('When redis returns an error', () => {
      const fsErrorDump = commands;
      const errSnippets = ['Payments sent but could not update redis', 'redis failure reason'];

      beforeEach(() => {
        env.logger = loggerStub;
        execStub.exec.onCall(0).callsArgWith(0, 'redis failure reason');
        fsStub.writeFile.onCall(0).callsArgWith(2, null, 'ok');
      });

      it('calls the stop signal to prevent rescheduling', () => {
        const promise = sendRedisCommands(env)(commands);
        return expect(promise).to.eventually.be.rejected
          .and.satisfy((err) => errSnippets.every((snippet) => err.message.includes(snippet)))
          .then(() => { expect(signalStop).to.have.been.called; });
      });

      it('emits an error log describing the failure and next steps', () => {
        const promise = sendRedisCommands(env)(commands);
        return expect(promise).to.eventually.be.rejected
          .and.satisfy((err) => errSnippets.every((snippet) => err.message.includes(snippet)))
          .then(() => {
            expect(loggerStub.error).to.have.been.calledOnce;
            expect(loggerStub.error.getCall(0).args[0]).to.include('redis failure reason');
            expect(loggerStub.error.getCall(0).args[0]).to.include('could not update redis');
            expect(loggerStub.error.getCall(0).args[0]).to.include('Disabling payment processing');
            expect(loggerStub.error.getCall(0).args[0]).to.include('must be ran manually');
          });
      });

      it('attempts to dump the commands to be run to a file', () => {
        const promise = sendRedisCommands(env)(commands);
        return expect(promise).to.eventually.be.rejected
          .and.satisfy((err) => errSnippets.every((snippet) => err.message.includes(snippet)))
          .then(() => {
            expect(fsStub.writeFile).to.have.been.calledWith(
              `${coin}_finalRedisCommands.txt`,
              JSON.stringify(fsErrorDump)
            );
          });
      });

      describe('if dumping the commands to a file fails', () => {
        const fsErr = 'fs failure reason: Could not write finalRedisCommands.txt';
        beforeEach(() => {
          fsStub.writeFile.onCall(0).callsArgWith(2, 'fs failure reason');
        });

        it('emits an error log letting you know the cold reality of the situation', () => {
          const promise = sendRedisCommands(env)(commands);
          return expect(promise).to.eventually.be.rejectedWith(fsErr).then(() => {
            expect(loggerStub.error).to.have.been.calledTwice;
            expect(loggerStub.error.getCall(1).args[0]).to.include('fs failure reason');
            expect(loggerStub.error.getCall(1).args[0]).to.include('you are fucked');
          });
        });
      });

      describe('if dumping the commands to a file succeeds', () => {
        beforeEach(() => {
          fsStub.writeFile.onCall(0).callsArgWith(2, null, 'ok');
        });

        it('does not emit an ominous error, merely the redis err', () => {
          const promise = sendRedisCommands(env)(commands);
          return expect(promise).to.eventually.be.rejected
            .and.satisfy((err) => errSnippets.every((snippet) => err.message.includes(snippet)))
            .then(() => {
              expect(loggerStub.error).to.have.been.calledOnce;
              expect(loggerStub.error.getCall(0).args[0]).not.to.include('fs failure reason');
            });
        });
      });
    });
  });
});
