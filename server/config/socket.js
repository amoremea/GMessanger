const { Server } = require('socket.io');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      // Разрешаем запросы с твоего домена и локального хоста
      origin: process.env.NODE_ENV === 'production' 
        ? ["https://gmessanger.onrender.com", "file://"] 
        : "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    // Настройки для борьбы с разрывами на Render:
    pingTimeout: 60000,  // Ждать ответа от клиента 60 секунд перед закрытием
    pingInterval: 25000, // Посылать пинг каждые 25 секунд (Render не закроет idle соединение)
    connectTimeout: 45000,
    transports: ['websocket', 'polling'] // Позволяем откатиться на polling, если websocket заблокирован
  });

  return io;
};

module.exports = initSocket;