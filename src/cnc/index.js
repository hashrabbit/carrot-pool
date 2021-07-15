const { requireDeps } = require('../utils/require_deps');

const defaultDeps = [
  ['net', 'net', false],
  ['EventEmitter', 'events']
];

// Pool Command/Control Server contructor. Outer function recevies the overridable
// dependencies. Inner constructor encapsulates the TCP/IP server. We separate their
// definitions so we can apply EventEmitter to the inner constructor.
const _poolCnC = ({ net, EventEmitter }) => {
  const cnc = function (port) {
    const _this = this;

    const server = net.createServer();
    server.on('connection', (socket) => {
      let data = '';
      // Receives text data that should be part (or all) of a command, in JSON format.
      socket.on('data', (d) => {
        // Capture the JSON fragment into our data buffer
        data += d;
        // Process the command JSON when we have all the fragments
        if (data.slice(-1) === '\n') {
          try {
            const { command, params, options } = JSON.parse(data);
            _this.emit('command', command, params, options, socket.end);
          } catch (e) {
            _this.emit('log', 'error', `CLI listener failed to parse message ${data}`);
          }
        }
      });
      socket.on('end', () => {});
      socket.on('error', () => {});
    });

    // Set the server to listen on the supplied port
    this.listen = () => {
      server.listen(port, '127.0.0.1', () => {
        _this.emit('log', 'debug', `Command/Control listening on port ${port}`);
      });
    };
  };
  // Return our constructor function, after inheriting EventEmitter's prototype.
  Object.setPrototypeOf(cnc.prototype, EventEmitter.prototype);
  return cnc;
};

module.exports = {
  _poolCnC,
  PoolCnC: _poolCnC(requireDeps(defaultDeps))
};
