const { Server } = require('socket.io');

const initSocket = (server) => {
  const io = new Server(server, { cors: { origin: '*' } });
  return io;
};

module.exports = initSocket;